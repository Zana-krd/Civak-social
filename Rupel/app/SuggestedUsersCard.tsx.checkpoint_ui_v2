'use client';

import { useEffect, useMemo, useState } from 'react';

type ProfileRow = {
  id: string;
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  location?: string | null;
  created_at?: string | null;
};

type FollowRow = {
  follower_id?: string;
  following_id?: string;
  follower_handle?: string;
  following_handle?: string;
};

type SuggestedDict = {
  suggestedTitle: string;
  suggestedMutual: string; // contains {count}
  followBtn: string;
  followingBtn: string;
};

type Props = {
  dict: SuggestedDict;
  profiles: ProfileRow[];
  follows: FollowRow[];
  currentUserId: string;
  myHandle: string;
  excludeIds?: string[];
  limit?: number;
  onFollow: (handle: string, userId: string) => void;
  onOpenProfile: (handle: string, name: string) => void;
};

const norm = (h?: string | null) =>
  (h || '').trim().toLowerCase().replace(/^@/, '');

export default function SuggestedUsersCard({
  dict,
  profiles,
  follows,
  currentUserId,
  myHandle,
  excludeIds,
  limit = 5,
  onFollow,
  onOpenProfile,
}: Props) {
  const myKey = norm(myHandle);
  const excludeKey = (excludeIds || []).join(',');

  const { candidates, mutualCounts, followedIds, followedHandles } = useMemo(() => {
    const followedIds = new Set<string>();
    const followedHandles = new Set<string>();
    follows.forEach((f) => {
      const mine =
        f.follower_id === currentUserId ||
        (myKey !== '' && norm(f.follower_handle) === myKey);
      if (!mine) return;
      if (f.following_id) followedIds.add(f.following_id);
      const h = norm(f.following_handle);
      if (h) followedHandles.add(h);
    });

    // Friends-of-friends: how many of the people I follow also follow this user
    const mutualCounts = new Map<string, number>();
    follows.forEach((f) => {
      if (f.follower_id && f.following_id && followedIds.has(f.follower_id)) {
        mutualCounts.set(f.following_id, (mutualCounts.get(f.following_id) || 0) + 1);
      }
    });

    const excluded = new Set(excludeKey ? excludeKey.split(',') : []);
    const me = profiles.find((p) => p.id === currentUserId);
    const myLoc = (me?.location || '').trim().toLowerCase();

    const scored = profiles
      .filter(
        (p) =>
          p.id &&
          p.id !== currentUserId &&
          !excluded.has(p.id) &&
          norm(p.username) !== '' &&
          !followedIds.has(p.id) &&
          !followedHandles.has(norm(p.username))
      )
      .map((p) => {
        const sameLocation =
          myLoc !== '' && (p.location || '').trim().toLowerCase() === myLoc;
        const score =
          (mutualCounts.get(p.id) || 0) * 3 +
          (sameLocation ? 2 : 0) +
          (p.avatar_url ? 0.5 : 0) +
          (p.bio ? 0.25 : 0);
        return { p, score };
      })
      .sort(
        (a, b) =>
          b.score - a.score ||
          String(b.p.created_at || '').localeCompare(String(a.p.created_at || ''))
      );

    return {
      candidates: scored.map((s) => s.p),
      mutualCounts,
      followedIds,
      followedHandles,
    };
  }, [follows, profiles, currentUserId, myKey, excludeKey]);

  // Freeze the list once, so people don't vanish from the card right after you follow them.
  const [shownIds, setShownIds] = useState<string[] | null>(null);
  useEffect(() => {
    if (shownIds === null && candidates.length > 0) {
      setShownIds(candidates.slice(0, limit).map((p) => p.id));
    }
  }, [candidates, limit, shownIds]);

  const shown = (shownIds || [])
    .map((id) => profiles.find((p) => p.id === id))
    .filter((p): p is ProfileRow => Boolean(p));

  if (shown.length === 0) return null;

  return (
    <section className="bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-sm space-y-1">
      <h3 className="text-sm font-semibold text-amber-400 pb-1">
        {dict.suggestedTitle}
      </h3>
      <div className="divide-y divide-gray-800/70">
        {shown.map((p) => {
          const handle = `@${norm(p.username)}`;
          const name = p.full_name || norm(p.username);
          const following =
            followedIds.has(p.id) || followedHandles.has(norm(p.username));
          const mutual = mutualCounts.get(p.id) || 0;
          const sub =
            mutual > 0
              ? dict.suggestedMutual.replace('{count}', String(mutual))
              : p.location || '';
          return (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 py-2.5"
            >
              <button
                type="button"
                onClick={() => onOpenProfile(handle, name)}
                className="flex items-center gap-3 min-w-0 text-start"
              >
                <div className="w-10 h-10 bg-amber-500/15 border border-amber-500/40 rounded-full flex items-center justify-center text-sm font-bold text-amber-400 overflow-hidden shrink-0">
                  {p.avatar_url ? (
                    <img
                      src={p.avatar_url}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p dir="auto" className="text-sm font-semibold text-white truncate">
                    {name}
                  </p>
                  <p dir="auto" className="text-xs text-amber-400 truncate">
                    {handle}
                  </p>
                  {sub && (
                    <p dir="auto" className="text-[11px] text-gray-500 truncate">
                      {sub}
                    </p>
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => onFollow(handle, p.id)}
                aria-pressed={following}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                  following
                    ? 'bg-gray-800 text-amber-400 border border-amber-500/40 hover:bg-gray-700'
                    : 'bg-amber-500 text-gray-950 hover:bg-amber-400'
                }`}
              >
                {following ? dict.followingBtn : dict.followBtn}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
