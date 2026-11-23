#!/usr/bin/env python3
"""Rûpel: install the Suggested Users card.

Usage (from the repo root):
    python3 install_suggested_users.py            # auto-detects app/page.tsx
    python3 install_suggested_users.py path/to/page.tsx

What it does:
  1. Writes SuggestedUsersCard.tsx next to page.tsx.
  2. Patches page.tsx (a backup page.tsx.bak is created first).
  3. Fixes the follow/unfollow logic so it works by user id.
If any anchor in page.tsx is not found exactly as expected, NOTHING is changed.
"""
import pathlib
import re
import shutil
import sys

COMPONENT = r''''use client';

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
'''

NEW_RESOLVE = r'''  const resolveUserIdByHandle = async (handle?: string | null): Promise<string | null> => {
    const clean = normHandle(handle).replace(/^@/, "");
    if (!clean) return null;
    // Exact match only (escape % and _ which are wildcards in ilike).
    const escaped = clean.replace(/[%_\\]/g, (m) => "\\" + m);

    const { data: profMatch } = await supabase
      .from("profiles")
      .select("id, username")
      .ilike("username", escaped)
      .limit(1)
      .maybeSingle();
    if (profMatch?.id) return String(profMatch.id);

    const { data: postMatch } = await supabase
      .from("posts")
      .select("user_id, author_handle")
      .ilike("author_handle", "@" + escaped)
      .not("user_id", "is", null)
      .limit(1)
      .maybeSingle();
    return postMatch?.user_id ? String(postMatch.user_id) : null;
  };
'''

NEW_TOGGLE = r'''  const handleToggleFollow = async (targetHandleRaw: string, targetUserId?: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const normalizedTarget = targetHandleRaw.startsWith('@')
      ? targetHandleRaw.toLowerCase()
      : `@${targetHandleRaw.toLowerCase()}`;

    if (!normalizedTarget || normalizedTarget === myHandle) return;

    const existing = follows.find(
      (f) =>
        (f.follower_id === user.id || f.follower_handle.toLowerCase() === myHandle) &&
        (f.following_handle.toLowerCase() === normalizedTarget ||
          (targetUserId ? f.following_id === targetUserId : false))
    );

    // Resolve the target's id: explicit id > existing follow row > handle lookup
    const followingId =
      targetUserId || existing?.following_id || (await resolveUserIdByHandle(normalizedTarget));
    if (!followingId || followingId === user.id) return;

    const isSame = (f: (typeof follows)[number]) =>
      (f.follower_id === user.id || f.follower_handle.toLowerCase() === myHandle) &&
      (f.following_id === followingId ||
        f.following_handle.toLowerCase() === normalizedTarget);

    if (existing) {
      setFollows((prev) => prev.filter((f) => !isSame(f)));
      const { error: unfollowErr } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', followingId);
      if (unfollowErr) {
        console.error('Unfollow failed:', unfollowErr.message);
        setFollows((prev) => [...prev, existing]);
      }
    } else {
      const nextItem = {
        follower_handle: myHandle,
        following_handle: normalizedTarget,
        follower_id: user.id as string,
        following_id: followingId,
      };
      setFollows((prev) => [...prev, nextItem]);
      const { error: followErr } = await supabase
        .from('follows')
        .upsert([{ follower_id: user.id, following_id: followingId }], {
          onConflict: 'follower_id,following_id',
        });
      if (followErr) {
        console.error('Follow insert failed:', followErr.message);
        setFollows((prev) => prev.filter((f) => !isSame(f)));
        return;
      }
      pushNotification({
        type: 'follow',
        actorHandle: myHandle,
        targetHandle: normalizedTarget,
        recipientId: followingId,
        actorId: user.id,
      });
    }
  };
'''

FEED_BLOCK = r'''{filteredPosts.map((post, index) => (
                  <Fragment key={post.id}>
                    {renderPostCard(post)}
                    {user && index === Math.min(9, filteredPosts.length - 1) && (
                      <SuggestedUsersCard
                        dict={dict}
                        profiles={allProfiles}
                        follows={follows}
                        currentUserId={user.id}
                        myHandle={myHandle}
                        onFollow={(handle, id) => handleToggleFollow(handle, id)}
                        onOpenProfile={(handle, name) => openHandleProfile(handle, name)}
                      />
                    )}
                  </Fragment>
                ))}'''

PROFILE_BLOCK = r'''            {user &&
              (() => {
                const vaHandle = viewedAuthor
                  ? normHandle(viewedAuthor.handle).replace(/^@/, '')
                  : '';
                const vaId = viewedAuthor
                  ? String(
                      viewedAuthor.userId ||
                        (allProfiles || []).find(
                          (p: any) =>
                            normHandle(p.username).replace(/^@/, '') === vaHandle
                        )?.id ||
                        ''
                    )
                  : '';
                return (
                  <SuggestedUsersCard
                    key={vaId || 'me'}
                    dict={dict}
                    profiles={allProfiles}
                    follows={follows}
                    currentUserId={user.id}
                    myHandle={myHandle}
                    excludeIds={vaId ? [vaId] : []}
                    onFollow={(handle, id) => handleToggleFollow(handle, id)}
                    onOpenProfile={(handle, name) => openHandleProfile(handle, name)}
                  />
                );
              })()}

'''


def fail(msg):
    print("\n[STOP] " + msg)
    print("Nothing was changed.")
    sys.exit(1)


def count_one(text, needle, label):
    n = text.count(needle)
    if n != 1:
        fail(f"{label}: expected exactly 1 match, found {n}.")


def replace_once(text, old, new, label):
    count_one(text, old, label)
    return text.replace(old, new, 1)


def insert_after_line(text, anchor, new_line, label):
    count_one(text, anchor, label)
    i = text.index(anchor)
    j = text.index("\n", i)
    return text[: j + 1] + new_line + "\n" + text[j + 1 :]


def replace_block(text, start_marker, end_marker, new_block, label):
    count_one(text, start_marker, label + " (start)")
    count_one(text, end_marker, label + " (end)")
    i = text.index(start_marker)
    i = text.rfind("\n", 0, i) + 1
    j = text.index(end_marker)
    j = text.rfind("\n", 0, j) + 1
    if j <= i:
        fail(f"{label}: markers are in an unexpected order.")
    return text[:i] + new_block + "\n" + text[j:]


def find_page():
    if len(sys.argv) > 1:
        return pathlib.Path(sys.argv[1])
    for p in pathlib.Path(".").rglob("page.tsx"):
        if "node_modules" in p.parts or ".next" in p.parts:
            continue
        try:
            if "rupel_lang" in p.read_text(encoding="utf-8"):
                return p
        except Exception:
            pass
    return None


def main():
    page = find_page()
    if not page or not page.exists():
        fail("Could not find your page.tsx. Pass its path: python3 install_suggested_users.py app/page.tsx")
    text = page.read_text(encoding="utf-8")
    if "SuggestedUsersCard" in text:
        fail("page.tsx already references SuggestedUsersCard (already installed?).")

    # 1) imports
    text = replace_once(
        text,
        "import { useState, useEffect, useRef } from 'react';",
        "import { Fragment, useState, useEffect, useRef } from 'react';",
        "react import",
    )
    text = insert_after_line(
        text,
        "import { createClient } from '@supabase/supabase-js';",
        "import SuggestedUsersCard from './SuggestedUsersCard';",
        "supabase import",
    )

    # 2) dictionary keys (have a native speaker review the Kurdish text)
    text = insert_after_line(
        text,
        "    noFollowList: 'Hîn ti kes tune.',",
        "    suggestedTitle: 'Kesên ku dibe ku tu bişopînî',\n    suggestedMutual: '{count} şopînerên hevpar',",
        "ku dict",
    )
    text = insert_after_line(
        text,
        "    noFollowList: 'هیچ کەسێک نییە.',",
        "    suggestedTitle: 'کەسانی پێشنیارکراو',\n    suggestedMutual: '{count} شوێنکەوتووی هاوبەش',",
        "so dict",
    )

    # 3) follows state: also keep ids
    text = replace_once(
        text,
        "{ follower_handle: string; following_handle: string }[]",
        "{ follower_handle: string; following_handle: string; follower_id?: string; following_id?: string }[]",
        "follows type",
    )

    # 4) use the freshly fetched profiles (not stale state) and keep allProfiles filled
    n = text.count("(allProfiles || []).forEach")
    if n != 2:
        fail(f"allProfiles forEach: expected 2 matches, found {n}.")
    text = text.replace("(allProfiles || []).forEach", "(profilesRows || []).forEach")
    text = insert_after_line(
        text,
        "    if (error || !followsRows) return;",
        "    setAllProfiles(profilesRows || []);",
        "fetchFollows",
    )

    # 5) exact handle lookup (the old one used a substring match)
    text = replace_block(
        text,
        "const resolveUserIdByHandle = async (",
        "const mapDbNotification = (",
        NEW_RESOLVE,
        "resolveUserIdByHandle",
    )

    # 6) follow / unfollow by user id
    text = replace_block(
        text,
        "const handleToggleFollow = async (targetHandleRaw: string) => {",
        "const handleAuth = async (e: React.FormEvent) => {",
        NEW_TOGGLE,
        "handleToggleFollow",
    )

    # 7) profile page follow button passes the id
    text = replace_once(
        text,
        "onClick={() => handleToggleFollow(viewedAuthor.handle)}",
        "onClick={() => handleToggleFollow(viewedAuthor.handle, viewedUserId || undefined)}",
        "profile follow button",
    )

    # 8) feed: card after ~10 posts
    text = replace_once(
        text,
        "{filteredPosts.map((post) => renderPostCard(post))}",
        FEED_BLOCK,
        "feed list",
    )

    # 9) profile: card under the info box
    pattern = re.compile(
        r'\n([ \t]*)<div className="space-y-3">\s*\n[ \t]*<h3 className="text-sm font-semibold text-amber-400 px-1">'
    )
    matches = pattern.findall(text)
    if len(matches) != 1:
        fail(f"profile posts header: expected 1 match, found {len(matches)}.")
    m = pattern.search(text)
    text = text[: m.start() + 1] + PROFILE_BLOCK + text[m.start() + 1 :]

    # write
    shutil.copy(page, str(page) + ".bak")
    comp_path = page.parent / "SuggestedUsersCard.tsx"
    comp_path.write_text(COMPONENT, encoding="utf-8")
    page.write_text(text, encoding="utf-8")
    print("Done.")
    print(f"  updated : {page}   (backup: {page}.bak)")
    print(f"  created : {comp_path}")
    print("Next: npx tsc --noEmit   then   npm run dev")


if __name__ == "__main__":
    main()
