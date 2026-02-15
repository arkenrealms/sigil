// OneJS: App/unity/scene.ts
//
// Fixes double-load when ensureManagedScenes is called twice quickly by:
// - locking ensure* calls (single-flight)
// - tracking per-scene in-flight Load/Unload promises so we never start the same operation twice

const SceneManager = CS.UnityEngine.SceneManagement.SceneManager;
const LoadSceneMode = CS.UnityEngine.SceneManagement.LoadSceneMode;

function safeGetLoaderInstance() {
  try {
    return CS.LoaderHandler?.Instance ?? null;
  } catch {
    return null;
  }
}

function shouldContinueWaiting(op, useLoaderGate) {
  if (!op) return false;
  if (op.isDone) return false;
  if (!useLoaderGate) return true;
  return safeGetLoaderInstance() == null;
}

export function waitAsyncOperation(op, opts) {
  const intervalMs = opts?.intervalMs ?? 16;
  const timeoutMs = opts?.timeoutMs ?? 60_000;
  const useLoaderGate = opts?.useLoaderGate ?? false;
  const label = opts?.label ?? "AsyncOp";

  return new Promise((resolve, reject) => {
    if (!op) return resolve(undefined);

    const start = Date.now();

    if (
      typeof setInterval !== "function" ||
      typeof clearInterval !== "function"
    ) {
      reject(
        new Error(
          `[scene] setInterval missing; cannot poll AsyncOperation in JS land. Replace waitAsyncOperation().`,
        ),
      );
      return;
    }

    const id = setInterval(() => {
      try {
        if (!shouldContinueWaiting(op, useLoaderGate)) {
          clearInterval(id);
          resolve(op);
          return;
        }
        if (Date.now() - start > timeoutMs) {
          clearInterval(id);
          reject(new Error(`[scene] ${label} timed out after ${timeoutMs}ms`));
          return;
        }
      } catch (e) {
        clearInterval(id);
        reject(e);
      }
    }, intervalMs);
  });
}

export function isSceneLoaded(sceneName) {
  try {
    const s = SceneManager.GetSceneByName(String(sceneName));
    return !!(s && s.isLoaded);
  } catch {
    return false;
  }
}

export function normalizeSceneList(list) {
  const arr = Array.isArray(list) ? list : [list];
  return arr.map((s) => String(s || "").trim()).filter(Boolean);
}

// ---------------------------------------------------------------------------
// ✅ NEW: in-flight operation tracking (prevents concurrent Load/Unload duplicates)
// ---------------------------------------------------------------------------

const inflightLoad = new Map<string, Promise<any>>();
const inflightUnload = new Map<string, Promise<any>>();

function withInflight(map, key, fn) {
  if (map.has(key)) return map.get(key);
  const p = (async () => {
    try {
      return await fn();
    } finally {
      map.delete(key);
    }
  })();
  map.set(key, p);
  return p;
}

// ---------------------------------------------------------------------------
// Scene ops
// ---------------------------------------------------------------------------

export async function unloadScene(sceneName, opts) {
  const name = String(sceneName);

  // If already unloading, await it
  return withInflight(inflightUnload, name, async () => {
    // If a load is in-flight for this scene, wait for it first,
    // then proceed to unload if it ended up loaded.
    if (inflightLoad.has(name)) {
      try {
        await inflightLoad.get(name);
      } catch {}
    }

    if (!isSceneLoaded(name)) {
      if (opts?.logging) console.log("[scene] unload skip (not loaded):", name);
      return;
    }

    if (opts?.logging) console.log("[scene] unload:", name);
    const op = SceneManager.UnloadSceneAsync(name);
    await waitAsyncOperation(op, { ...opts, label: `Unload ${name}` });
    if (opts?.logging) console.log("[scene] unload done:", name);
  });
}

export async function loadSceneAdditive(sceneName, opts) {
  const name = String(sceneName);

  console.log("[scene] loadSceneAdditive start", name, {
    loaded: isSceneLoaded(name),
    inflight: inflightLoad.has(name),
  });

  // ✅ If already loading, await the same Promise (prevents double load)
  return withInflight(inflightLoad, name, async () => {
    if (isSceneLoaded(name)) {
      if (opts?.logging)
        console.log("[scene] load skip (already loaded):", name);
      return;
    }

    // If an unload is in-flight, wait it out first.
    if (inflightUnload.has(name)) {
      try {
        await inflightUnload.get(name);
      } catch {}
    }

    if (isSceneLoaded(name)) {
      if (opts?.logging)
        console.log("[scene] load skip (already loaded after wait):", name);
      return;
    }

    if (opts?.logging) console.log("[scene] load additive:", name);
    const op = SceneManager.LoadSceneAsync(name, LoadSceneMode.Additive);
    await waitAsyncOperation(op, { ...opts, label: `Load ${name}` });
    if (opts?.logging) console.log("[scene] load done:", name);
  });
}

// -------------------------
// Helpers
// -------------------------

export async function loadScenes(scenes, opts) {
  const list = normalizeSceneList(scenes);
  const parallel = !!opts?.parallel;

  if (opts?.logging) console.log("[scene] loadScenes", list, { parallel });

  if (parallel) {
    await Promise.all(list.map((s) => loadSceneAdditive(s, opts)));
  } else {
    for (const s of list) await loadSceneAdditive(s, opts);
  }
}

export async function unloadScenes(scenes, opts) {
  const list = normalizeSceneList(scenes);
  const parallel = !!opts?.parallel;

  if (opts?.logging) console.log("[scene] unloadScenes", list, { parallel });

  if (parallel) {
    await Promise.all(list.map((s) => unloadScene(s, opts)));
  } else {
    for (const s of list) await unloadScene(s, opts);
  }
}

// ---------------------------------------------------------------------------
// ✅ NEW: ensure "single-flight" lock so ensureManagedScenes can't run twice
// ---------------------------------------------------------------------------

let ensureInFlight: Promise<any> | null = null;

// If you prefer "drop" instead of "queue", set this to true.
const DROP_DUPLICATE_ENSURES = false;

async function runEnsureSingleFlight(fn, logging) {
  if (ensureInFlight) {
    if (DROP_DUPLICATE_ENSURES) {
      if (logging)
        console.warn("[scene] ensure already running; dropping duplicate call");
      return ensureInFlight; // or return undefined
    }
    if (logging) console.warn("[scene] ensure already running; waiting for it");
    await ensureInFlight;
  }

  ensureInFlight = (async () => {
    try {
      return await fn();
    } finally {
      ensureInFlight = null;
    }
  })();

  return ensureInFlight;
}

// -------------------------
// Desired-set API
// -------------------------

export async function ensureScenesLoaded(desiredScenes, opts) {
  const desired = new Set(normalizeSceneList(desiredScenes));
  const managed = opts?.managedScenes
    ? new Set(normalizeSceneList(opts.managedScenes))
    : null;

  const logging = !!opts?.logging;
  const unloadUnknownLoaded = !!opts?.unloadUnknownLoaded;
  const parallel = !!opts?.parallel;

  return runEnsureSingleFlight(async () => {
    if (logging) {
      console.log("[scene] ensureScenesLoaded desired=", [...desired], {
        managedScenes: managed ? [...managed] : null,
        unloadUnknownLoaded,
        parallel,
      });
    }

    // 1) Determine what to unload
    const unloadList: string[] = [];

    if (managed) {
      for (const s of managed) {
        if (!desired.has(s) && isSceneLoaded(s)) unloadList.push(s);
      }
    } else if (unloadUnknownLoaded) {
      try {
        const count = SceneManager.sceneCount;
        for (let i = 0; i < count; i++) {
          const sc = SceneManager.GetSceneAt(i);
          const name = String(sc?.name || "");
          if (!name) continue;
          if (!desired.has(name) && sc.isLoaded) unloadList.push(name);
        }
      } catch (e) {
        if (logging)
          console.warn(
            "[scene] ensureScenesLoaded: couldn't enumerate loaded scenes",
            e,
          );
      }
    }

    // 2) Unload
    if (unloadList.length) {
      if (logging)
        console.log("[scene] ensureScenesLoaded unloading:", unloadList);
      await unloadScenes(unloadList, { ...opts, parallel });
    } else if (logging) {
      console.log("[scene] ensureScenesLoaded nothing to unload");
    }

    // 3) Load desired
    const loadList: string[] = [];
    for (const s of desired) {
      if (managed && !managed.has(s)) {
        if (logging)
          console.warn(
            "[scene] desired scene not in managedScenes (skipping):",
            s,
          );
        continue;
      }
      if (!isSceneLoaded(s)) loadList.push(s);
    }

    if (loadList.length) {
      if (logging) console.log("[scene] ensureScenesLoaded loading:", loadList);
      await loadScenes(loadList, { ...opts, parallel });
      if (logging) console.log("[scene] ensureScenesLoaded done");
    } else if (logging) {
      console.log("[scene] ensureScenesLoaded nothing to load");
    }
  }, logging);
}

// Convenience: from your old onChangeGame string
export async function onChangeGame(data, opts) {
  const Delimiter = opts?.delimiter ?? "|";
  const pack = String(data).split(Delimiter);
  const target = pack[0];

  const managedScenes = opts?.managedScenes ?? [
    "E_MemeIsles",
    "E_MageIsles",
    "E_EndOfTime",
  ];
  return ensureScenesLoaded([target], { ...opts, managedScenes });
}

export async function ensureManagedScenes(desiredScenes, opts) {
  const desired = new Set(normalizeSceneList(desiredScenes));
  const managed = new Set(normalizeSceneList(opts?.managedScenes ?? []));
  const logging = !!opts?.logging;

  return runEnsureSingleFlight(async () => {
    if (logging) {
      console.log(
        "[scene] ensureManagedScenes desired=",
        [...desired],
        "managed=",
        [...managed],
      );
    }

    // unload: managed but not desired
    const unloadList: string[] = [];
    for (const s of managed) {
      if (!desired.has(s) && isSceneLoaded(s)) unloadList.push(s);
    }
    if (unloadList.length) await unloadScenes(unloadList, opts);

    // load: desired that are managed (or allowUnmanaged)
    const loadList: string[] = [];
    for (const s of desired) {
      if (!managed.has(s) && !opts?.allowUnmanaged) {
        if (logging)
          console.warn("[scene] desired not in managedScenes (skipping):", s);
        continue;
      }
      if (!isSceneLoaded(s)) loadList.push(s);
    }
    if (loadList.length) await loadScenes(loadList, opts);
  }, logging);
}
