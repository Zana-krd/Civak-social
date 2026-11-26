#!/usr/bin/env python3
"""Rupel: notifications upgrade.

Usage (from the project folder, e.g. Rupel/):
    python3 install_notifications.py            # install (auto-detects app/page.tsx)
    python3 install_notifications.py --undo     # restore the backup
    python3 install_notifications.py path/to/page.tsx

What you get:
  1. The red number on the bell counts only UNREAD notifications and goes to zero when you open the list.
  2. The list shows the latest 20 notifications, with a "show more" button (change NOTIF_PAGE_SIZE to taste).
  3. New notifications have a highlighted background and a dot; the ones you already saw look normal.
  4. Tap a notification -> opens that post (comments open for comment notifications; follows open the profile).
     Tap the @username -> opens that person's profile.
If anything is not found exactly as expected, NOTHING is changed.
"""
import pathlib
import re
import shutil
import sys

KU_KEYS = ("    notifShowMore: 'Zêdetir nîşan bide',\n"
           "    notifPostGone: 'Ev post hatiye jêbirin.',")
SO_KEYS = ("    notifShowMore: 'پیشاندانی زیاتر',\n"
           "    notifPostGone: 'ئەم بابەتە سڕاوەتەوە.',")

STATE_BLOCK = r'''  const [notifLimit, setNotifLimit] = useState(NOTIF_PAGE_SIZE);
  const [notifLastSeen, setNotifLastSeen] = useState(0);
  const [freshNotifIds, setFreshNotifIds] = useState<string[]>([]);
  const [viewPostId, setViewPostId] = useState<number | null>(null);

  // Per-user "last time the notifications were opened"; (re)load them when the user changes
  useEffect(() => {
    if (!user?.id) {
      setNotifLastSeen(0);
      setNotifications([]);
      return;
    }
    let seen = 0;
    try {
      seen = Number(window.localStorage.getItem(`rupel_notif_seen_${user.id}`)) || 0;
    } catch {
      // Ignore storage access issues
    }
    setNotifLastSeen(seen);
    fetchNotifications();
  }, [user?.id]);

  // Close the post view when the person navigates somewhere else
  useEffect(() => {
    setViewPostId(null);
  }, [activeSection, viewedAuthor, selectedTag]);

'''

HELPERS = r'''const myNotifications = user
    ? notifications
        .filter((n) =>
          n.recipientId
            ? n.recipientId === user.id
            : normHandle(n.targetHandle) === normHandle(myHandle)
        )
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    : [];

  const isNotifUnread = (n: NotificationItem) =>
    !n.isRead && Date.parse(n.createdAt) > notifLastSeen;

  const unreadCount = myNotifications.filter(isNotifUnread).length;

  const notifActorHandle = (n: NotificationItem) => {
    const raw = n.actorHandle || '';
    if (raw.startsWith('@')) return raw;
    const prof = (allProfiles || []).find(
      (p: any) => String(p.id) === String(n.actorId || raw)
    );
    return prof?.username ? `@${normHandle(prof.username).replace(/^@/, '')}` : raw;
  };

  const notifPostPreview = (n: NotificationItem) => {
    if (!n.postId) return '';
    const p = posts.find((x: any) => Number(x.id) === Number(n.postId));
    return String(p?.content_ku || p?.content || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 90);
  };

  // Opening the list = "seen": the badge goes to zero right away.
  const openNotifications = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setFreshNotifIds(myNotifications.filter(isNotifUnread).map((n) => n.id));
    setNotifLimit(NOTIF_PAGE_SIZE);
    setShowNotificationsModal(true);

    const newest = myNotifications.length > 0 ? Date.parse(myNotifications[0].createdAt) : NaN;
    const seen = Number.isFinite(newest) ? newest : Date.now();
    const nextSeen = Math.max(notifLastSeen, seen);
    setNotifLastSeen(nextSeen);
    try {
      window.localStorage.setItem(`rupel_notif_seen_${user.id}`, String(nextSeen));
    } catch {
      // Ignore storage errors
    }
    setNotifications((prev) =>
      prev.map((n) => (n.recipientId === user.id ? { ...n, isRead: true } : n))
    );
    supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', user.id)
      .eq('is_read', false)
      .then(({ error }) => {
        if (error) console.error('Mark notifications read failed:', error.message);
      });
  };

  const openNotificationTarget = (n: NotificationItem) => {
    setShowNotificationsModal(false);
    if (n.type === 'follow' || !n.postId) {
      openHandleProfile(notifActorHandle(n));
      return;
    }
    if (n.type === 'comment') setOpenCommentsPostId(Number(n.postId));
    setViewPostId(Number(n.postId));
  };'''

MODAL = r'''{/* Modal Agahdarî (Notifications) */}
      {showNotificationsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 w-full max-w-sm shadow-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => setShowNotificationsModal(false)}
              className="absolute top-4 end-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-amber-400 flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span>{dict.notificationsTitle}</span>
            </h2>
            {myNotifications.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">
                {dict.noNotifications}
              </p>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {myNotifications.slice(0, notifLimit).map((n) => {
                  const label =
                    n.type === 'like'
                      ? dict.notifLike
                      : n.type === 'comment'
                        ? dict.notifComment
                        : n.type === 'repost'
                          ? dict.notifRepost
                          : dict.notifFollow;
                  const isFresh = freshNotifIds.includes(n.id) || isNotifUnread(n);
                  const actor = notifActorHandle(n);
                  const preview = notifPostPreview(n);
                  return (
                    <div
                      key={n.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openNotificationTarget(n)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') openNotificationTarget(n);
                      }}
                      className={`border rounded-xl p-3 text-xs space-y-1 cursor-pointer transition ${
                        isFresh
                          ? 'bg-amber-500/10 border-amber-500/40'
                          : 'bg-gray-950 border-gray-800 hover:bg-gray-900'
                      }`}
                    >
                      <p className="text-gray-200 flex items-start gap-2">
                        {isFresh && (
                          <span className="mt-1 w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                        )}
                        <span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowNotificationsModal(false);
                              openHandleProfile(actor);
                            }}
                            className="font-semibold text-amber-400 hover:underline"
                          >
                            {actor}
                          </button>{' '}
                          <span className="hover:underline">{label}</span>
                        </span>
                      </p>
                      {preview && (
                        <p className="text-gray-500 truncate" dir="auto">
                          {preview}
                        </p>
                      )}
                      <p className="text-[10px] text-gray-500">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                  );
                })}
                {myNotifications.length > notifLimit && (
                  <button
                    type="button"
                    onClick={() => setNotifLimit((v) => v + NOTIF_PAGE_SIZE)}
                    className="w-full py-2 text-xs font-semibold text-amber-400 bg-gray-950 border border-gray-800 hover:bg-gray-900 rounded-xl transition"
                  >
                    {dict.notifShowMore}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Post view (opened from a notification) */}
      {viewPostId !== null &&
        (() => {
          const viewedPost = posts.find((p: any) => Number(p.id) === viewPostId);
          return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start justify-center p-3 z-50 overflow-y-auto">
              <div className="w-full max-w-xl mt-4 mb-20 space-y-3">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setViewPostId(null)}
                    className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-300 hover:text-white"
                    aria-label={dict.cancel}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {viewedPost ? (
                  renderPostCard(viewedPost)
                ) : (
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center text-sm text-gray-400">
                    {dict.notifPostGone}
                  </div>
                )}
              </div>
            </div>
          );
        })()}
'''


def fail(msg):
    print("\n[STOP] " + msg)
    print("Nothing was changed.")
    sys.exit(1)


def one(text, needle, label):
    n = text.count(needle)
    if n != 1:
        fail(f"{label}: expected exactly 1 match, found {n}.")


def replace_once(text, old, new, label):
    one(text, old, label)
    return text.replace(old, new, 1)


def sub_once(text, pattern, repl, label, flags=0):
    ms = list(re.finditer(pattern, text, flags))
    if len(ms) != 1:
        fail(f"{label}: expected exactly 1 match, found {len(ms)}.")
    m = ms[0]
    return text[:m.start()] + repl(m) + text[m.end():]


def insert_after_line(text, anchor, new, label):
    one(text, anchor, label)
    i = text.index(anchor)
    j = text.index("\n", i)
    return text[:j] + "\n" + new + text[j:]


def replace_block(text, start_marker, end_marker, new_block, label):
    one(text, start_marker, label + " (start)")
    one(text, end_marker, label + " (end)")
    i = text.index(start_marker)
    j = text.index(end_marker)
    if j <= i:
        fail(f"{label}: markers are in an unexpected order.")
    return text[:i] + new_block + "\n      " + text[j:]


def patch_page(text):
    if "openNotifications" in text:
        fail("page.tsx already contains the notifications upgrade (already installed?).")

    # constants + types
    text = insert_after_line(text, "const MAX_POST_LENGTH = 500;", "const NOTIF_PAGE_SIZE = 20;", "constants")
    text = sub_once(text, r"(  preview\?: string;\n  createdAt: string;\n)(\})",
                    lambda m: m.group(1) + "  recipientId?: string;\n  actorId?: string;\n  isRead?: boolean;\n" + m.group(2),
                    "NotificationItem interface")

    # dictionary
    text = insert_after_line(text, "noNotifications: 'Hîn ti agahdarî nînin.',", KU_KEYS, "ku dict")
    text = insert_after_line(text, "noNotifications: 'هیچ ئاگادارکردنەوەیەک نییە.',", SO_KEYS, "so dict")

    # keep is_read from the database
    text = insert_after_line(text, "createdAt: row.created_at ?? new Date().toISOString(),",
                             "      isRead: Boolean(row.is_read),", "mapDbNotification")

    # fetch only MY notifications (and never overwrite the list when logged out)
    text = replace_once(
        text,
        'supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100),',
        'user?.id\n'
        '        ? supabase.from("notifications").select("*").eq("recipient_id", user.id).order("created_at", { ascending: false }).limit(100)\n'
        '        : Promise.resolve({ data: [] as any[], error: null as any }),',
        "fetch notifications")
    text = replace_once(
        text,
        "setNotifications(data.map((r: any) => mapDbNotification(r, idToHandle)));",
        "if (user?.id) setNotifications(data.map((r: any) => mapDbNotification(r, idToHandle)));",
        "set notifications")

    # bell in the bottom bar (done BEFORE inserting new code, so the anchors stay unique)
    text = replace_once(text, "setShowNotificationsModal(true);", "openNotifications();", "bell onClick")
    text = replace_once(text, "{user && myNotifications.length > 0 && (", "{user && unreadCount > 0 && (", "badge condition")
    text = replace_once(text, "{myNotifications.length}", "{unreadCount > 99 ? '99+' : unreadCount}", "badge number")

    # states + effects (before the main mount effect; all states they use are declared above it)
    text = sub_once(text, r"(\n)(  useEffect\(\(\) => \{\n    setMounted\(true\);)",
                    lambda m: m.group(1) + STATE_BLOCK + m.group(2), "mount effect anchor")

    # derived values + helpers
    text = sub_once(
        text,
        r"const myNotifications = user\s*\?\s*notifications\.filter\(\(n\) => normHandle\(n\.targetHandle\) === normHandle\(myHandle\)\)\s*:\s*\[\];",
        lambda m: HELPERS, "myNotifications")

    # modal + post view
    text = replace_block(text, "{/* Modal Agahdarî (Notifications) */}",
                         "{/* Modal Lîsteya Şopîner û Şopandî (Followers / Following) */}", MODAL, "notifications modal")
    return text


def find_page():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if args:
        return pathlib.Path(args[0])
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
        fail("Could not find page.tsx. Pass its path: python3 install_notifications.py app/page.tsx")
    bak = pathlib.Path(str(page) + ".nt.bak")
    if "--undo" in sys.argv:
        if not bak.exists():
            fail(f"No backup found ({bak}).")
        shutil.copy(bak, page)
        bak.unlink()
        print("Restored", page)
        return
    text = page.read_text(encoding="utf-8")
    new_text = patch_page(text)
    shutil.copy(page, bak)
    page.write_text(new_text, encoding="utf-8")
    print("Done.")
    print(f"  updated : {page}   (backup: {bak})")
    print("Next: npx tsc --noEmit   then reload the site")
    print("Undo any time: python3 install_notifications.py --undo")


if __name__ == "__main__":
    main()
