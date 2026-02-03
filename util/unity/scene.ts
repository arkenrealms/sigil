// OneJS: App/unity/scene.ts
//
// Purpose:
// - Promise-based scene load/unload helpers from JS land (no C# coroutine wrapper)
// - "Desired set" API: load a list of scenes, unload anything not in the list (optionally restricted to a known set)
// - Convenience helpers: loadScenes(), unloadScenes()
//
// Notes:
// - Preserves your original wait semantics by default:
//     while (!op.isDone && LoaderHandler.Instance == null) yield return null;
//   i.e. stop waiting once LoaderHandler.Instance becomes non-null.
//   Disable with useLoaderGate:false to wait strictly on op.isDone.
// - Uses polling via setInterval. If your OneJS runtime doesn't have setInterval, replace waitAsyncOperation()
//   with a tick-based scheduler.

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

  // Original C# gate: keep yielding while LoaderHandler.Instance == null
  return safeGetLoaderInstance() == null;
}

export function waitAsyncOperation(op, opts) {
  const intervalMs = opts?.intervalMs ?? 16;
  const timeoutMs = opts?.timeoutMs ?? 60_000;
  const useLoaderGate = opts?.useLoaderGate ?? true;
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
          `[scene] setInterval missing; cannot poll AsyncOperation in JS land. ` +
            `Replace waitAsyncOperation() with a tick-based scheduler.`,
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

export async function unloadScene(sceneName, opts) {
  const name = String(sceneName);
  if (!isSceneLoaded(name)) {
    if (opts?.logging) console.log("[scene] unload skip (not loaded):", name);
    return;
  }

  if (opts?.logging) console.log("[scene] unload:", name);
  const op = SceneManager.UnloadSceneAsync(name);
  await waitAsyncOperation(op, { ...opts, label: `Unload ${name}` });
  if (opts?.logging) console.log("[scene] unload done:", name);
}

export async function loadSceneAdditive(sceneName, opts) {
  const name = String(sceneName);
  if (isSceneLoaded(name)) {
    if (opts?.logging) console.log("[scene] load skip (already loaded):", name);
    return;
  }

  if (opts?.logging) console.log("[scene] load additive:", name);
  const op = SceneManager.LoadSceneAsync(name, LoadSceneMode.Additive);
  await waitAsyncOperation(op, { ...opts, label: `Load ${name}` });
  if (opts?.logging) console.log("[scene] load done:", name);
}

// -------------------------
// ✅ Simple helpers you asked for
// -------------------------

/**
 * Load multiple scenes additively (skips already-loaded).
 * Loads sequentially by default to avoid spikes; set parallel:true if you want.
 */
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

/**
 * Unload multiple scenes (skips not-loaded).
 * Unloads sequentially by default; set parallel:true if you want.
 */
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

// -------------------------
// ✅ Desired-set API (your new requirement)
// -------------------------

/**
 * Ensure ONLY `desiredScenes` are loaded (optionally restricted to `managedScenes`).
 *
 * - desiredScenes: scenes that should be loaded (additive)
 * - managedScenes (optional): the universe you manage. If provided, we unload any loaded scenes
 *   that are in managedScenes but NOT in desiredScenes.
 *   If not provided, we only unload scenes that we can "see" in `desiredScenes`? (not enough)
 *   so default managedScenes is recommended.
 *
 * - unloadUnknownLoaded:
 *   If true and managedScenes is NOT provided, we try to unload anything loaded that is NOT desired.
 *   BUT Unity doesn't provide a cheap "list all loaded scenes by name" unless you use sceneCount,
 *   so we implement it via SceneManager.sceneCount + GetSceneAt(i) (safe).
 */
export async function ensureScenesLoaded(desiredScenes, opts) {
  const desired = new Set(normalizeSceneList(desiredScenes));
  const managed = opts?.managedScenes
    ? new Set(normalizeSceneList(opts.managedScenes))
    : null;

  const logging = !!opts?.logging;
  const unloadUnknownLoaded = !!opts?.unloadUnknownLoaded;
  const parallel = !!opts?.parallel;

  if (logging) {
    console.log("[scene] ensureScenesLoaded desired=", [...desired], {
      managedScenes: managed ? [...managed] : null,
      unloadUnknownLoaded,
      parallel,
    });
  }

  // 1) Determine what to unload
  const unloadList = [];

  if (managed) {
    // unload managed scenes that are not desired
    for (const s of managed) {
      if (!desired.has(s) && isSceneLoaded(s)) unloadList.push(s);
    }
  } else if (unloadUnknownLoaded) {
    // unload any loaded scenes that are not desired
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

  // 3) Load desired (only those that are in managed, if managed provided)
  const loadList = [];
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
    console.log("[scene] ensureScenesLoaded done loading all");
  } else if (logging) {
    console.log("[scene] ensureScenesLoaded nothing to load");
  }
}

// -------------------------
// Convenience: from your old onChangeGame string
// -------------------------
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

  if (logging) {
    console.log(
      "[scene] ensureManagedScenes desired=",
      [...desired],
      "managed=",
      [...managed],
    );
  }

  // unload: managed but not desired
  const unloadList = [];
  for (const s of managed) {
    if (!desired.has(s) && isSceneLoaded(s)) unloadList.push(s);
  }
  if (unloadList.length) await unloadScenes(unloadList, opts);

  // load: desired that are managed (or allow unmanaged if allowUnmanaged)
  const loadList = [];
  for (const s of desired) {
    if (!managed.has(s) && !opts?.allowUnmanaged) {
      if (logging)
        console.warn("[scene] desired not in managedScenes (skipping):", s);
      continue;
    }
    if (!isSceneLoaded(s)) loadList.push(s);
  }
  if (loadList.length) await loadScenes(loadList, opts);
}
