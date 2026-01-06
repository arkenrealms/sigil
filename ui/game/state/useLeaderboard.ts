import { useEffect, useMemo, useRef, useState } from "preact/hooks";

export type HudLeaderboardRow = {
  player: string;
  rank: string; // "#1"
  kills: number;
  deaths: number;
  evolves: number;
  items: number; // powerups
  sprites: number; // rewards
  points: number;
  ping: string;
};

type LeaderboardRowDto = {
  name: string;
  rawName?: string;
  rank: number; // 1-based
  points: string; // "0000" (string) from C#
  kills: number;
  deaths: number;
  powerups: number;
  evolves: number;
  rewards: number;
  ping: string; // "123ms" or "-"
};

declare const CS: any;

/** Adjust this if your binding is different */
function getNetworkManagerInstance(): any {
  return CS?.Arken?.Evolution?.NetworkManager?.Instance ?? null;
}

export function useLeaderboard(): HudLeaderboardRow[] {
  const [rows, setRows] = useState<HudLeaderboardRow[]>([]);
  const byRankRef = useRef<Record<number, HudLeaderboardRow>>({});

  useEffect(() => {
    const nm = getNetworkManagerInstance();
    if (!nm) {
      console.log(
        "[OneJS] NetworkManager.Instance not found; leaderboard not bound."
      );
      return;
    }

    const rebuild = () => {
      // IMPORTANT: create a BRAND NEW ARRAY every time
      const next = Object.keys(byRankRef.current)
        .map((k) => byRankRef.current[Number(k)])
        .filter(Boolean)
        .sort((a, b) => {
          const ra = Number(a.rank.slice(1)) || 9999;
          const rb = Number(b.rank.slice(1)) || 9999;
          return ra - rb;
        });

      setRows(next);
    };

    const onClear = () => {
      byRankRef.current = {};
      setRows([]); // new ref already
    };

    const onRowJson = (json: string) => {
      let dto: LeaderboardRowDto | null = null;
      try {
        dto = JSON.parse(json);
      } catch (e) {
        console.log("[OneJS] bad leaderboard json", json);
        return;
      }
      if (!dto) return;

      const rank = Number(dto.rank || 0);
      if (rank < 1) return;

      const row: HudLeaderboardRow = {
        player: String(dto.name ?? ""),
        rank: `#${rank}`,
        kills: Number(dto.kills ?? 0),
        deaths: Number(dto.deaths ?? 0),
        evolves: Number(dto.evolves ?? 0),
        items: Number(dto.powerups ?? 0),
        sprites: Number(dto.rewards ?? 0),
        points: Number(dto.points ?? 0), // "0000" -> 0.. parse ok
        ping: String(dto.ping ?? "-"),
      };

      // overwrite by rank (points can change without rank changing)
      byRankRef.current[rank] = row;

      rebuild();
    };

    // --- subscribe ---
    // depending on your bridge, it might be add_/remove_ or direct +=
    if (typeof nm.add_OnLeaderboardCleared === "function") {
      nm.add_OnLeaderboardCleared(onClear);
      nm.add_OnLeaderboardRowJson(onRowJson);
      return () => {
        nm.remove_OnLeaderboardCleared?.(onClear);
        nm.remove_OnLeaderboardRowJson?.(onRowJson);
      };
    }

    // fallback: try C#-style event property (some bindings expose it)
    try {
      nm.OnLeaderboardCleared = nm.OnLeaderboardCleared || [];
      nm.OnLeaderboardRowJson = nm.OnLeaderboardRowJson || [];
    } catch {}

    console.log(
      "[OneJS] Warning: NetworkManager event subscription method not detected (add_OnLeaderboardCleared missing)."
    );

    return;
  }, []);

  // This memo is optional; rows is already a new array each set
  return useMemo(() => rows, [rows]);
}
