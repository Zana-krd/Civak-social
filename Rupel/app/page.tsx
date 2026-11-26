'use client';

import { Fragment, useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import './rupel-theme.css';
import SuggestedUsersCard from './SuggestedUsersCard';
import {
  Heart,
  Send,
  LogIn,
  LogOut,
  UserPlus,
  X,
  Languages,
  ArrowLeft,
  Search,
  Pencil,
  Trash2,
  Check,
  UserCheck,
  UserPlus2,
  Repeat2,
  MessageCircle,
  Bell,
  Bookmark,
  Image as ImageIcon,
  Users,
  SquarePen,
  Compass,
  Sun,
  Moon,
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const MAX_POST_LENGTH = 500;
const LANG_STORAGE_KEY = 'rupel_lang';
const BOOKMARKS_STORAGE_KEY = 'rupel_bookmarks';

interface CommentItem {
  id: number | string;
  post_id: number;
  user_id?: string;
  author_name: string;
  author_handle: string;
  content: string;
  created_at?: string;
}

interface NotificationItem {
  id: string;
  type: 'like' | 'comment' | 'repost' | 'follow';
  actorHandle: string;
  targetHandle: string;
  postId?: number;
  preview?: string;
  createdAt: string;
}

const t = {
  ku: {
    title: 'Rûpel',
    switchLang: 'Soranî',
    mainFeed: 'Rûpela Sereke',
    newPostNav: 'Posta Nû',
    exploreNav: 'Keşf / Etîket',
    bookmarksNav: 'Tomarkirî',
    profileNav: 'Profîl',
    settingsNav: 'Mîheng',
    allTab: 'Hemû',
    followingTab: 'Şopandî',
    placeholder: 'Çi di mejiyê te de ye? Li vir binivîse... (mînak: #werzîş @rupel)',
    imagePlaceholder: 'Lînka wêneyî (Image URL - opsiyonel)...',
    searchPlaceholder: 'Li post, @nav an #etîketan bigere...',
    publish: 'Weşandin',
    loginBtn: 'Têketin',
    logoutBtn: 'Derketin',
    registerBtn: 'Tomar bibe',
    registerTitle: 'Hesabekî Nû Veke',
    loginTitle: 'Têkeve Hesabê Xwe',
    fullNameLabel: 'Navê te',
    usernameLabel: 'Navê bikarhêner (@username)',
    emailLabel: 'Email',
    passwordLabel: 'Şîfre',
    emailPlaceholder: 'E-name (Email)...',
    passPlaceholder: 'Şîfre (Password - herî kêm 6 tîp)...',
    loginPrompt: 'Ji bo weşandinê pêwîst e tu têkevî hesabê xwe.',
    hasAccount: 'Gelo hesabê te heye? Têkeve',
    noAccount: 'Hesabê te nîne? Xwe tomar bike',
    noPosts: 'Hîn ti post nehatine weşandin.',
    noFollowingPosts: 'Kesên tu dişopînî hîn ti post neweşandine.',
    noTagPosts: 'Ji bo vê lêgerînê ti post nehatin dîtin.',
    noUserPosts: 'Vî bikarhênerî hîn ti post neweşandiye.',
    noSavedPosts: 'Hîn ti post nehatine tomarkirin.',
    editProfile: 'Biguherîne',
    editProfileTitle: 'Profîla Xwe Biguherîne',
    bioLabel: 'Jînenîgarî (Bio)',
    locationLabel: 'Cih',
    avatarLabel: 'Lînka Wêneyê Profîlê (Avatar URL)',
    uploadPostImage: 'Wêneyî ji cîhazê bar bike',
    uploadAvatarImage: 'Wêneyê profilê ji cîhazê bar bike',
    uploadingLabel: 'Tê barkirin...',
    cancel: 'Betal bike',
    save: 'Tomar bike',
    deleteConfirm: 'Tu dixwazî vê postê jê bibî?',
    deleteCommentConfirm: 'Tu dixwazî vê şîroveyê jê bibî?',
    defaultBio: 'Hîn jînenîgarî nehatiye nivîsandin.',
    userPostsTitle: 'Postên Profîlê',
    savedPostsTitle: 'Postên Tomarkirî',
    backToFeed: 'Vegere Rûpela Sereke',
    settingsTitle: 'Mîheng',
    interfaceLangLabel: 'Zimanê Rûpelê',
    interfaceLangDesc: 'Kurmancî (Sereke) / Soranî (Tê tomarkirin)',
    themeLabel: 'Dîmen',
    themeDesc: 'Moda tarî / ronî',
    themeLight: 'Moda ronî',
    themeDark: 'Moda tarî',
    defaultUser: 'Bikarhêner',
    followBtn: 'Bişopîne',
    followingBtn: 'Tê şopandin',
    followersLabel: 'Şopîner',
    followingLabel: 'Şopandî',
    postsCountLabel: 'Post',
    repostBtn: 'Ji nû ve biweşîne',
    repostedBadge: 'Ji nû ve hat weşandin ji',
    commentPlaceholder: 'Şîroveyekê binivîse...',
    commentSend: 'Bişîne',
    noComments: 'Hîn ti şîrove nehatine nivîsandin.',
    notificationsTitle: 'Agahdarî',
    noNotifications: 'Hîn ti agahdarî nînin.',
    notifLike: 'postek eciband',
    notifComment: 'şîrove li ser postê kir',
    notifRepost: 'postek ji nû ve weşand',
    notifFollow: 'dest bi şopandina te kir',
    noFollowList: 'Hîn ti kes tune.',
    suggestedTitle: 'Kesên ku dibe ku tu bişopînî',
    suggestedMutual: '{count} şopînerên hevpar',
    error: 'Çewtiyek çêbû: ',
  },
  so: {
    title: 'Rûpel',
    switchLang: 'Kurmancî',
    mainFeed: 'پەڕەی سەرەکی',
    newPostNav: 'بابەتی نوێ',
    exploreNav: 'گەڕان و هاشتاگ',
    bookmarksNav: 'پاشەکەوتکراوەکان',
    profileNav: 'پڕۆفایل',
    settingsNav: 'ڕێکخستنەکان',
    allTab: 'هەمووی',
    followingTab: 'شوێنکەوتووەکان',
    placeholder: 'چی لە مێشکتدایە؟ لێرە بنووسە... (بۆ نموونە: #werzîş @rupel)',
    imagePlaceholder: 'بەستەری وێنە (Image URL - ئارەزوومەندانە)...',
    searchPlaceholder: 'گەڕان لە بابەت، @ناو یان #هاشتاگەکان...',
    publish: 'بڵاوکردنەوە',
    loginBtn: 'چوونەژوورەوە',
    logoutBtn: 'دەرچوون',
    registerBtn: 'خۆتۆمارکردن',
    registerTitle: 'دروستکردنی هەژماری نوێ',
    loginTitle: 'چوونەژوورەوە بۆ هەژمارەکەت',
    fullNameLabel: 'ناوی تەواو',
    usernameLabel: 'ناوی بەکارهێنەر (@username)',
    emailLabel: 'ئیمەیڵ',
    passwordLabel: 'وشەی نهێنی',
    emailPlaceholder: 'ئیمەیڵ (Email)...',
    passPlaceholder: 'وشەی نهێنی (لایکەم ٦ پیت)...',
    loginPrompt: 'بۆ بڵاوکردنەوەی بابەت پێویستە سەرەتا بچیتە ژوورەوە.',
    hasAccount: 'هەژمارت هەیە؟ بچۆ ژوورەوە',
    noAccount: 'هەژمارت نییە؟ خۆت تۆمار بکە',
    noPosts: 'هێشتا هیچ بابەتێک بڵاونەکراوەتەوە.',
    noFollowingPosts: 'ئەوانەی شوێنیان کەوتوویت هێشتا بابەتیان بڵاونەکردووەتەوە.',
    noTagPosts: 'هیچ بابەتێک بۆ ئەم گەڕانە نەدۆزرایەوە.',
    noUserPosts: 'ئەم بەکارهێنەرە هێشتا هیچ بابەتێکی بڵاونەکردووەتەوە.',
    noSavedPosts: 'هێشتا هیچ بابەتێک پاشەکەوت نەکراوە.',
    editProfile: 'دەستکاری',
    editProfileTitle: 'دەستکاریکردنی پڕۆفایل',
    bioLabel: 'ژیاننامە (Bio)',
    locationLabel: 'شوێن',
    avatarLabel: 'بەستەری وێنەی پڕۆفایل (Avatar URL)',
    uploadPostImage: 'وێنە لە ئامێرەکەوە بار بکە',
    uploadAvatarImage: 'وێنەی پڕۆفایل لە ئامێرەکەوە بار بکە',
    uploadingLabel: 'بار دەکرێت...',
    cancel: 'هەڵوەشاندنەوە',
    save: 'پاشەکەوتکردن',
    deleteConfirm: 'دڵنیایت دەتەوێت ئەم بابەتە بسڕیتەوە؟',
    deleteCommentConfirm: 'دڵنیایت دەتەوێت ئەم کۆمێنتە بسڕیتەوە؟',
    defaultBio: 'هێشتا ژیاننامە نەنووسراوە.',
    userPostsTitle: 'بابەتەکانی پڕۆفایل',
    savedPostsTitle: 'بابەتە پاشەکەوتکراوەکان',
    backToFeed: 'گەڕانەوە بۆ پەڕەی سەرەکی',
    settingsTitle: 'ڕێکخستنەکان',
    interfaceLangLabel: 'زمانی ڕووکار',
    interfaceLangDesc: 'کورمانجی (سەرەکی) / سۆرانی (پاشەکەوت دەکرێت)',
    themeLabel: 'ڕەنگی ڕووکار',
    themeDesc: 'تاریک / ڕووناک',
    themeLight: 'ڕووناک',
    themeDark: 'تاریک',
    defaultUser: 'بەکارهێنەر',
    followBtn: 'شوێنکەوتن',
    followingBtn: 'شوێنکەوتوو',
    followersLabel: 'شوێنکەوتووان',
    followingLabel: 'شوێنکەوتووەکان',
    postsCountLabel: 'بابەت',
    repostBtn: 'دووبارە بڵاوکردنەوە',
    repostedBadge: 'دووبارە بڵاوکرایەوە لە',
    commentPlaceholder: 'کۆمێنتێک بنووسە...',
    commentSend: 'ناردن',
    noComments: 'هێشتا هیچ کۆمێنتێک نەنووسراوە.',
    notificationsTitle: 'ئاگادارکردنەوەکان',
    noNotifications: 'هیچ ئاگادارکردنەوەیەک نییە.',
    notifLike: 'بابەتێکی بەدڵ بوو',
    notifComment: 'کۆمێنتی لەسەر بابەتێک نووسی',
    notifRepost: 'بابەتێکی دووبارە بڵاوکردەوە',
    notifFollow: 'دەستی کرد بە شوێنکەوتنت',
    noFollowList: 'هیچ کەسێک نییە.',
    suggestedTitle: 'کەسانی پێشنیارکراو',
    suggestedMutual: '{count} شوێنکەوتووی هاوبەش',
    error: 'هەڵەیەک ڕوویدا: ',
  },
};

const SUGGESTED_LIMITS = {
  profile: 3,
  feed: 6,
  modal: 50,
} as const;

const renderBrandLogo = (label: string) => {
  if (!label) return null;
  const first = label.charAt(0);
  const rest = label.slice(1);
  if (first.toUpperCase() === "R") {
    return (
      <>
        <span className="text-amber-400">{first}</span>
        <span>{rest}</span>
      </>
    );
  }
  return <>{label}</>;
};

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quoteDraft, setQuoteDraft] = useState("");
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [lang, setLang] = useState<'ku' | 'so'>('ku');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const getNotifClearKey = (u: any) => {
    const id = u?.id || u?.handle || u?.username || u?.email || "guest";
    return "rupel_cleared_notif_" + String(id);
  };
  const [clearedNotifCount, setClearedNotifCount] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try {
      const keys = Object.keys(window.localStorage).filter((k) => k.startsWith("rupel_cleared_notif_"));
      if (keys.length === 0) return 0;
      const val = Number(window.localStorage.getItem(keys[0]));
      return Number.isFinite(val) && val >= 0 ? val : 0;
    } catch {
      return 0;
    }
  });
useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem('rupel_theme');
    } catch {
      // Ignore storage access issues
    }
    const initial = saved === 'light' ? 'light' : 'dark';
    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);
  }, []);

  const applyTheme = (next: 'dark' | 'light') => {
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      window.localStorage.setItem('rupel_theme', next);
    } catch {
      // Ignore storage errors
    }
  };
  const [user, setUser] = useState<any>(null);

  const postTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [posts, setPosts] = useState<any[]>([]);
  const [feedMode, setFeedMode] = useState<'all' | 'following'>('all');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingPostImage, setUploadingPostImage] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const uploadImageToBucket = async (fileObj: File, folder: "posts" | "avatars"): Promise<string> => {
    if (!fileObj.type.startsWith("image/")) {
      throw new Error("Please select a valid image file.");
    }
    const maxBytes = 5 * 1024 * 1024;
    if (fileObj.size > maxBytes) {
      throw new Error("Image size must be 5MB or less.");
    }
    const ext = (fileObj.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const uidPart = user?.id || "anon";
    const filePath = `${folder}/${uidPart}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext || "jpg"}`;
    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(filePath, fileObj, { cacheControl: "3600", upsert: false });
    if (uploadError) {
      throw uploadError;
    }
    const { data: pubData } = supabase.storage.from("media").getPublicUrl(filePath);
    if (!pubData?.publicUrl) {
      throw new Error("Could not get public image URL.");
    }
    return pubData.publicUrl;
  };
  const [showImageInput, setShowImageInput] = useState(false);
  const [selectedTag, setSelectedTag] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchTab, setSearchTab] = useState<'all' | 'posts' | 'people' | 'tags'>('all');
  const [showSuggestedModal, setShowSuggestedModal] = useState(false);
const [likedPostIds, setLikedPostIds] = useState<number[]>([]);
  const [savedPostIds, setSavedPostIds] = useState<number[]>([]);

  const [commentsByPost, setCommentsByPost] = useState<Record<number, CommentItem[]>>({});
  const [openCommentsPostId, setOpenCommentsPostId] = useState<number | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});

  const [follows, setFollows] = useState<
    { follower_handle: string; following_handle: string; follower_id?: string; following_id?: string }[]
  >([]);
  const [repostMenuPostId, setRepostMenuPostId] = useState<string | number | null>(null);

  useEffect(() => {
    if (repostMenuPostId === null) return;
    const onOutside = (e: MouseEvent | TouchEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && el.closest('[data-no-open="true"]')) return;
      setRepostMenuPostId(null);
    };
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("touchstart", onOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("touchstart", onOutside);
    };
  }, [repostMenuPostId]);
  const [followModalType, setFollowModalType] = useState<'followers' | 'following' | null>(
    null
  );

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editingPostContent, setEditingPostContent] = useState('');

  const [profile, setProfile] = useState<any>(null);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [viewedAuthor, setViewedAuthorState] = useState<{
    name: string;
    handle: string;
    userId?: string;
  } | null>(null);

  const setViewedAuthor = (
    val: { name: string; handle: string; userId?: string } | null
  ) => {
    setViewedAuthorState(val);
    try {
      if (val) sessionStorage.setItem("rupel_viewed_author", JSON.stringify(val));
      else sessionStorage.removeItem("rupel_viewed_author");
    } catch {}
  };

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("rupel_viewed_author");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.handle) {
          setViewedAuthorState(parsed);
          setActiveSection("profile");
        }
      }
    } catch {}
  }, []);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [editFullName, setEditFullName] = useState('');

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<
    'feed' | 'bookmarks' | 'profile' | 'settings'
  >('feed');

  useEffect(() => {
    setMounted(true);

    try {
      const savedLang = window.localStorage.getItem(LANG_STORAGE_KEY);
      if (savedLang === 'ku' || savedLang === 'so') {
        setLang(savedLang);
      }
      const rawBookmarks = window.localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      if (rawBookmarks) {
        const parsed = JSON.parse(rawBookmarks);
        if (Array.isArray(parsed)) setSavedPostIds(parsed.map(Number));
      }
    } catch {
      // Ignore storage access issues
    }

    fetchPosts();
    fetchProfile();
    fetchFollows();
    fetchComments();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const changeLanguage = (nextLang: 'ku' | 'so') => {
    setLang(nextLang);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, nextLang);
    } catch {
      // Ignore storage errors
    }
  };

  const toggleBookmark = (postId: number) => {
    setSavedPostIds((prev) => {
      const exists = prev.includes(postId);
      const next = exists ? prev.filter((id) => id !== postId) : [...prev, postId];
      try {
        window.localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  const normHandle = (h?: string | null) => (h || "").trim().toLowerCase();

  const resolveUserIdByHandle = async (handle?: string | null): Promise<string | null> => {
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

  const mapDbNotification = (
    row: any,
    idToHandle?: Map<string, string>
  ): NotificationItem & { recipientId?: string; actorId?: string } => {
    const actorId = row.actor_id ? String(row.actor_id) : undefined;
    const recipientId = row.recipient_id ? String(row.recipient_id) : undefined;
    const resolvedActor =
      normHandle(row.actorHandle) ||
      (actorId && idToHandle?.get(actorId)) ||
      actorId ||
      "";
    const resolvedTarget =
      normHandle(row.targetHandle) ||
      (recipientId && idToHandle?.get(recipientId)) ||
      recipientId ||
      "";
    return {
      id: String(row.id),
      type: row.type,
      actorHandle: resolvedActor,
      targetHandle: resolvedTarget,
      postId: row.post_id ?? undefined,
      createdAt: row.created_at ?? new Date().toISOString(),
      recipientId,
      actorId,
    };
  };

  const fetchNotifications = async () => {
    const [{ data, error }, { data: profilesRows }, { data: postsRows }] = await Promise.all([
      supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("profiles").select("id, username, full_name, avatar_url, bio, location, created_at"),
      supabase.from("posts").select("user_id, author_handle").not("user_id", "is", null),
    ]);
    if (error || !data) return;

    const idToHandle = new Map<string, string>();
    setAllProfiles(profilesRows || []);
        setAllProfiles(profilesRows || []);
        setAllProfiles(profilesRows || []);
        (profilesRows || []).forEach((p: any) => {
      if (p?.id && p?.username) {
        idToHandle.set(String(p.id), `@${normHandle(p.username).replace(/^@/, "")}`);
      }
    });
    (postsRows || []).forEach((pt: any) => {
      if (pt?.user_id && pt?.author_handle) {
        const h = normHandle(pt.author_handle);
        if (h) idToHandle.set(String(pt.user_id), h.startsWith("@") ? h : `@${h}`);
      }
    });
    if (user?.id && myHandle) {
      idToHandle.set(String(user.id), normHandle(myHandle));
    }

    setNotifications(data.map((r: any) => mapDbNotification(r, idToHandle)));
  };

  const pushNotification = async (
    item: Omit<NotificationItem, "id" | "createdAt"> & {
      recipientId?: string | null;
      actorId?: string | null;
      message?: string;
    }
  ) => {
    const actor = normHandle(item.actorHandle || myHandle);
    const target = normHandle(item.targetHandle);
      const optimistic: NotificationItem & { recipientId?: string | null; actorId?: string | null } = {
      ...item,
        recipientId: item.recipientId ?? undefined,
        actorId: item.actorId ?? undefined,
      actorHandle: actor,
      targetHandle: target,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [optimistic, ...prev]);

    const actorId = item.actorId ?? user?.id ?? null;
    const recipientId = item.recipientId ?? (await resolveUserIdByHandle(target));
    if (!actorId || !recipientId || actorId === recipientId) return;

    const msg =
      item.message ||
      (item.type === "follow"
        ? `${actor} started following you`
        : item.type === "like"
        ? `${actor} liked your post`
        : `${actor} interacted with your post`);

    const { data, error } = await supabase
      .from("notifications")
      .insert([{
        recipient_id: recipientId,
        actor_id: actorId,
        type: item.type,
        post_id: item.postId ?? null,
        message: msg,
        is_read: false,
      }])
      .select()
      .single();

    if (error) {
      console.error("Notification insert failed:", error.message);
      return;
    }
    if (data) {
      const saved = mapDbNotification({
        ...data,
        actorHandle: actor,
        targetHandle: target,
      });
      setNotifications((prev) => [saved, ...prev.filter((n) => n.id !== optimistic.id)]);
    }
  };
  const fetchPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setPosts(data);
  };

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error && data) {
      const grouped: Record<number, CommentItem[]> = {};
      data.forEach((c: any) => {
        const pid = Number(c.post_id);
        if (!grouped[pid]) grouped[pid] = [];
        grouped[pid].push(c);
      });
      setCommentsByPost(grouped);
    }
  };

  const fetchFollows = async () => {
    const [{ data: followsRows, error }, { data: profilesRows }, { data: postsRows }] =
      await Promise.all([
        supabase.from("follows").select("follower_id, following_id"),
        supabase.from("profiles").select("id, username, full_name, avatar_url, bio, location, created_at"),
        supabase.from("posts").select("user_id, author_handle").not("user_id", "is", null),
      ]);
    if (error || !followsRows) return;
    setAllProfiles(profilesRows || []);

    const idToHandle = new Map<string, string>();
    (profilesRows || []).forEach((p: any) => {
      if (p?.id && p?.username) {
        idToHandle.set(String(p.id), `@${normHandle(p.username).replace(/^@/, "")}`);
      }
    });
    (postsRows || []).forEach((pt: any) => {
      if (pt?.user_id && pt?.author_handle) {
        const h = normHandle(pt.author_handle);
        if (h) idToHandle.set(String(pt.user_id), h.startsWith("@") ? h : `@${h}`);
      }
    });
    if (user?.id && myHandle) {
      idToHandle.set(String(user.id), normHandle(myHandle));
    }

    const mapped = followsRows.map((row: any) => {
      const fId = String(row.follower_id || "");
      const tId = String(row.following_id || "");
      return {
        follower_handle: idToHandle.get(fId) || fId,
        following_handle: idToHandle.get(tId) || tId,
        follower_id: fId,
        following_id: tId,
      };
    });
    setFollows(mapped as any);
  };

  useEffect(() => {
    fetchNotifications();
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const incoming = mapDbNotification(payload.new);
          setNotifications((prev) => {
            if (prev.some((n) => n.id === incoming.id)) return prev;
            return [incoming, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchProfile() {
    const { data: authData } = await supabase.auth.getUser();
    const currentUser = authData?.user;
    if (!currentUser) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();

    if (data) {
      setProfile(data);
      setBio(data.bio || '');
      setLocation(data.location || '');
      setAvatarUrl(data.avatar_url || '');
      setEditFullName(data.full_name || '');
    } else if (currentUser.user_metadata) {
      const metaName = currentUser.user_metadata.fullname || '';
      const metaUser =
        currentUser.user_metadata.username || currentUser.email?.split('@')[0] || '';
      if (metaName || metaUser) {
        await supabase.from('profiles').upsert(
          {
            id: currentUser.id,
            full_name: metaName,
            username: metaUser,
          },
          { onConflict: 'id' }
        );
      }
    }
  }

  async function handleSaveProfile() {
    const { data: authData } = await supabase.auth.getUser();
    const currentUser = authData?.user;
    if (!currentUser) return;

    const { error } = await supabase.from('profiles').upsert(
      {
        id: currentUser.id,
        full_name: editFullName,
        bio,
        location,
        avatar_url: avatarUrl,
      },
      { onConflict: 'id' }
    );

    if (!error) {
      setIsEditingProfile(false);
      fetchProfile();
    }
  }

  if (!mounted) return null;

  const dict = t[lang];

  const getUsername = (userObj: any) => {
    if (profile?.username) return profile.username;
    if (userObj?.user_metadata?.username) return userObj.user_metadata.username;
    if (!userObj?.email) return 'zana2ibrahim';
    return userObj.email.split('@')[0];
  };

  const myHandle = user
    ? `@${getUsername(user).toLowerCase().replace(/\s+/g, '')}`
    : '';

  const emailHandle = user?.email
    ? `@${user.email.split('@')[0].toLowerCase().replace(/\s+/g, '')}`
    : '';

  const isPostOwnedByCurrentUser = (post: any) => {
    if (!user) return false;
    if (post.user_id && post.user_id === user.id) return true;
    const postHandle = (
      post.author_handle || (post.author ? `@${post.author}` : '')
    ).toLowerCase();
    return Boolean(
      postHandle && (postHandle === myHandle || postHandle === emailHandle)
    );
  };

  const openHandleProfile = (handleRaw: string, fallbackName?: string) => {
    const normalized = handleRaw.startsWith('@')
      ? handleRaw.toLowerCase()
      : `@${handleRaw.toLowerCase()}`;
    if (!normalized || normalized === '@') return;

    if (user && (normalized === myHandle || normalized === emailHandle)) {
      setViewedAuthor(null);
    } else {
      const cleanName = fallbackName || normalized.replace(/^@/, '');
      setViewedAuthor({
        name: cleanName,
        handle: normalized,
      });
    }
    setIsEditingProfile(false);
    setActiveSection('profile');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  };

  const handleToggleFollow = async (targetHandleRaw: string, targetUserId?: string) => {
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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    if (isRegisterMode) {
      const cleanUsername = username.trim().toLowerCase().replace(/^@+/, '');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            fullname: fullName.trim(),
            username: cleanUsername,
          },
        },
      });
      if (error) {
        alert(dict.error + error.message);
      } else {
        if (data.user) {
          await supabase.from('profiles').upsert(
            {
              id: data.user.id,
              full_name: fullName.trim(),
              username: cleanUsername,
            },
            { onConflict: 'id' }
          );
        }
        setShowAuthModal(false);
        setEmail('');
        setPassword('');
        setFullName('');
        setUsername('');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        alert(dict.error + error.message);
      } else {
        setShowAuthModal(false);
        setEmail('');
        setPassword('');
      }
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setViewedAuthor(null);
    setIsEditingProfile(false);
    setIsSidebarOpen(false);
    if (activeSection === 'bookmarks') {
      setActiveSection('feed');
    }
  };

  const handleNewPostShortcut = () => {
    setViewedAuthor(null);
    setActiveSection('feed');
    setIsSidebarOpen(false);
    setTimeout(() => {
      if (user) {
        postTextareaRef.current?.focus();
        postTextareaRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      } else {
        setShowAuthModal(true);
      }
    }, 80);
  };

  const handleExploreShortcut = () => {
    setViewedAuthor(null);
    setActiveSection('feed');
    setIsSidebarOpen(false);
    setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 80);
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user || content.length > MAX_POST_LENGTH) return;

    const authorName =
      profile?.full_name || user?.user_metadata?.fullname || getUsername(user);
    const handleBase = getUsername(user).toLowerCase().replace(/\s+/g, '');
    const trimmedContent = content.trim();
    const cleanedImage = imageUrl.trim();

    const payloadWithImage: Record<string, any> = {
      user_id: user.id,
      author_name: authorName,
      author_handle: '@' + handleBase,
      content_ku: trimmedContent,
      category: 'Giştî',
      likes: 0,
    };
    if (cleanedImage) {
      payloadWithImage.image_url = cleanedImage;
    }

    let { error } = await supabase.from('posts').insert([payloadWithImage]);

    if (error && cleanedImage) {
      const { error: fallbackError } = await supabase.from('posts').insert([
        {
          user_id: user.id,
          author_name: authorName,
          author_handle: '@' + handleBase,
          content_ku: `${trimmedContent}\n\n🖼️ ${cleanedImage}`,
          category: 'Giştî',
          likes: 0,
        },
      ]);
      error = fallbackError;
    }

    if (!error) {
      setContent('');
      setImageUrl('');
      setShowImageInput(false);
      fetchPosts();
    } else {
      alert(dict.error + error.message);
    }
  };

  const renderEmbeddedPostCard = (rawText: string) => {
  if (!rawText) return null;
  const mQuote = rawText.match(/^([\s\S]*?)\s*[❝“]([\s\S]*?)[❞”]\s*$/);
  if (mQuote) {
    const userComment = mQuote[1].trim();
    const inner = mQuote[2].trim();
    const mHandle = inner.match(/^(.*?)\s*@([A-Za-z0-9_.-]+)\s*$/);
    const quotedHandle = mHandle ? mHandle[2].trim() : "";
    const quotedBody = (mHandle ? mHandle[1] : inner).replace(/["❝❞“”]/g, "").trim();
    if (quotedBody || quotedHandle) {
      return { quotedBody, quotedHandle, userComment };
    }
  }
  const match = rawText.match(/^\s*"([\s\S]*?)"\s*(?:@([A-Za-z0-9_.-]+))?\s*([\s\S]*)$/);
  if (!match) return null;
  const quotedBody = match[1].replace(/["]/g, "").trim();
  const quotedHandle = (match[2] || "").trim();
  const userComment = (match[3] || "").trim();
  return { quotedBody, quotedHandle, userComment };
};
const handleRepost = async (post: any) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const originalBody = post.content_ku || post.content || '';
    const originalHandle =
      post.author_handle || (post.author ? `@${post.author}` : '');
    const repostedText = originalHandle ? `${originalBody}\n\n🔁 ${originalHandle}` : originalBody;

    if (repostedText.length > MAX_POST_LENGTH) {
      alert(dict.error + 'Post is too long to repost.');
      return;
    }

    const authorName =
      profile?.full_name || user?.user_metadata?.fullname || getUsername(user);
    const handleBase = getUsername(user).toLowerCase().replace(/\s+/g, '');

    const { error } = await supabase.from('posts').insert([
      {
        user_id: user.id,
        author_name: authorName,
        author_handle: '@' + handleBase,
        content_ku: repostedText,
        category: 'Giştî',
        likes: 0,
      },
    ]);

    if (!error) {
      if (originalHandle && originalHandle.toLowerCase() !== myHandle) {
        pushNotification({
          type: 'repost',
          actorHandle: myHandle,
          targetHandle: originalHandle.toLowerCase(),
          postId: post.id,
          preview: originalBody.slice(0, 60),
        });
      }
      fetchPosts();
    } else {
      alert(dict.error + error.message);
    }
  }

  const handleQuote = (targetPost: any) => {
  if (!targetPost) return;
  setRepostMenuPostId(null);
  const raw = String(targetPost.content_ku || targetPost.content || "").trim();
  const withoutQuote = raw.replace(/^[\s\S]*?\s*(?:@[A-Za-z0-9_.-]+)?\s*/, "").trim();
  const clean = (withoutQuote || raw)
    .split("\n")
    .map((ln) => ln.trim())
    .filter((ln) => ln && !ln.startsWith("🔁") && ln !== "❝" && ln !== "❞")
    .join(" ")
    .replace(/[\u201c\u201d]/g, "")
    .trim();
  const hRaw = String(targetPost.author_handle || targetPost.handle || targetPost.username || "").replace(/^@/, "").trim();
  const formatted = `❝ ${clean} ${hRaw ? `@${hRaw}` : ""} ❞\n\n`;
  setQuoteDraft('');
  if (typeof window !== "undefined") { const cand: any = (typeof targetPost !== "undefined" ? targetPost : null)   || null; (window as any).__RUL_QUOTE_POST__ = cand; } setQuoteModalOpen(true);
};





  const handleAddComment = async (postId: number, e: React.FormEvent) => {
    e.preventDefault();
    const text = (commentInputs[postId] || '').trim();
    if (!text) return;

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const authorName =
      profile?.full_name || user?.user_metadata?.fullname || getUsername(user);
    const handleStr = myHandle || `@${getUsername(user)}`;

    const optimisticComment: CommentItem = {
      id: Date.now(),
      post_id: postId,
      user_id: user.id,
      author_name: authorName,
      author_handle: handleStr,
      content: text,
      created_at: new Date().toISOString(),
    };

    setCommentsByPost((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), optimisticComment],
    }));
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));

    const targetPost = posts.find((p) => p.id === postId);
    const targetHandle = (
      targetPost?.author_handle ||
      (targetPost?.author ? `@${targetPost.author}` : '')
    ).toLowerCase();
    if (targetHandle && targetHandle !== myHandle) {
      pushNotification({
        type: 'comment',
        actorHandle: handleStr,
        targetHandle,
        postId,
        preview: text.slice(0, 60),
      });
    }

    const { error } = await supabase.from('comments').insert([
      {
        post_id: postId,
        user_id: user.id,
        author_name: authorName,
        author_handle: handleStr,
        content: text,
      },
    ]);

    if (!error) {
      fetchComments();
    }
  };

  const handleDeleteComment = async (postId: number, commentId: number | string) => {
    if (!window.confirm(dict.deleteCommentConfirm)) return;

    setCommentsByPost((prev) => ({
      ...prev,
      [postId]: (prev[postId] || []).filter((c) => c.id !== commentId),
    }));

    if (typeof commentId === 'number') {
      await supabase.from('comments').delete().eq('id', commentId);
    }
  };

  const handleDeletePost = async (id: number) => {
    if (!window.confirm(dict.deleteConfirm)) return;
    const { data: deletedRows, error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)
      .select('id');
    if (!error) {
      if (!deletedRows || deletedRows.length === 0) {
        alert(dict.error + 'No matching row deleted (check RLS permissions or post id).');
        if (typeof fetchPosts === 'function') {
          await fetchPosts();
        }
        return;
      }
      setPosts((prev) => prev.filter((p) => String(p.id) !== String(id)));
      if (typeof fetchPosts === 'function') {
        await fetchPosts();
      }
    } else {
      alert(dict.error + error.message);
    }
  };

  const splitEditableQuote = (raw: string) => {
  const str = String(raw || "");
  const parsed = renderEmbeddedPostCard(str);
  if (parsed && (parsed.quotedBody || parsed.quotedHandle)) {
    return { isQuoted: true, comment: parsed.userComment || "", quotedHandle: parsed.quotedHandle || "", quotedBody: parsed.quotedBody || "" };
  }
  const m = str.match(/^([\s\S]*?)\s*[❝“]([\s\S]*?)@([A-Za-z0-9_.-]+)\s*[❞”]\s*$/);
  if (m) {
    return { isQuoted: true, comment: m[1].trim(), quotedHandle: m[3].trim(), quotedBody: m[2].replace(/["❝❞“”]/g, "").trim() };
  }
  return { isQuoted: false, comment: str, quotedHandle: "", quotedBody: "" };
};

const handleSaveEditedPost = async (id: number) => {
      const targetPost = posts.find((item: any) => String(item.id) === String(id));
      const rawOrig = String(targetPost?.content_ku || targetPost?.content || "");
      const qInfo = splitEditableQuote(rawOrig);
      const finalEditedContent = qInfo.isQuoted
        ? `${editingPostContent.trim()}❝${qInfo.quotedBody}${qInfo.quotedHandle ? ` @${qInfo.quotedHandle.replace(/^@/, "")}` : ""} ❞`.trim()
        : editingPostContent.trim();
      if (!finalEditedContent || finalEditedContent.length > MAX_POST_LENGTH) return;
      const { error } = await supabase
        .from('posts')
        .update({ content_ku: finalEditedContent })
        .eq('id', id);
      if (!error) {
        setEditingPostId(null);
        setEditingPostContent('');
        fetchPosts();
      } else {
        alert(dict.error + error.message);
      }
    };

  const handleLike = async (post: any) => {
    const id = post.id;
    const currentLikes = post.likes || 0;
    const alreadyLiked = likedPostIds.includes(id);
    const nextLikes = alreadyLiked
      ? Math.max(0, currentLikes - 1)
      : currentLikes + 1;

    setLikedPostIds((prev) =>
      alreadyLiked ? prev.filter((item) => item !== id) : [...prev, id]
    );

    if (!alreadyLiked && user) {
      const targetHandle = (
        post.author_handle ||
        (post.author ? `@${post.author}` : '')
      ).toLowerCase();
      if (targetHandle && targetHandle !== myHandle) {
        pushNotification({
          type: 'like',
          actorHandle: myHandle,
          targetHandle,
          postId: id,
          preview: (post.content_ku || post.content || '').slice(0, 60),
        });
      }
    }

    await supabase
      .from("posts")
      .update({ likes: nextLikes, likes_count: nextLikes })
      .eq("id", id);
    fetchPosts();
  };

  const openAuthorProfile = (post: any) => {
    if (isPostOwnedByCurrentUser(post)) {
      setViewedAuthor(null);
    } else {
      const rawName = post.author_name || post.author || dict.defaultUser;
      const rawHandle =
        post.author_handle ||
        (post.author
          ? `@${post.author}`
          : `@${rawName.toLowerCase().replace(/\s+/g, '')}`);
      setViewedAuthor({
        name: rawName,
        handle: rawHandle,
        userId: post.user_id,
      });
    }
    setIsEditingProfile(false);
    setActiveSection('profile');
  };

  const renderContentWithTagsAndMentions = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(#[^\s#]+|@[A-Za-z0-9_.-]+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('#') && part.length > 1) {
        const cleanTag = part.slice(1).toLowerCase();
        const isActive = selectedTag.toLowerCase() === cleanTag;
        return (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setViewedAuthor(null);
              setActiveSection('feed');
              setSelectedTag(isActive ? '' : cleanTag);
            }}
            className={`inline font-semibold mx-0.5 transition ${
              isActive
                ? 'text-amber-300 underline decoration-amber-400'
                : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            {part}
          </button>
        );
      }

      if (part.startsWith('@') && part.length > 1) {
        return (
          <button
            key={idx}
            type="button"
            onClick={() => openHandleProfile(part)}
            className="inline font-semibold text-amber-300 hover:underline mx-0.5 transition"
          >
            {part}
          </button>
        );
      }

      return <span key={idx}>{part}</span>;
    });
  };

  const tagCounts: Record<string, number> = {};
  posts.forEach((p) => {
    const body = p.content_ku || p.content || '';
    const matches = body.match(/#[^\s#]+/g) || [];
    matches.forEach((rawTag: string) => {
      const clean = rawTag.slice(1).toLowerCase();
      if (clean) tagCounts[clean] = (tagCounts[clean] || 0) + 1;
    });
  });

  const trendingTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([tag]) => tag);

  const myFollowingHandles = user
    ? follows
        .filter((f) => f.follower_handle.toLowerCase() === myHandle)
        .map((f) => f.following_handle.toLowerCase())
    : [];

  const filteredPosts = posts.filter((p) => {
    const body = (p.content_ku || p.content || '').toLowerCase();
    const author = (p.author_name || p.author_handle || '').toLowerCase();
    const postHandle = (
      p.author_handle || (p.author ? `@${p.author}` : '')
    ).toLowerCase();

    const matchesFeedMode =
      feedMode === 'following'
        ? Boolean(user && myFollowingHandles.includes(postHandle))
        : true;
    const matchesTag = selectedTag
      ? body.includes(`#${selectedTag.toLowerCase()}`)
      : true;
    const matchesSearch = searchQuery.trim()
      ? body.includes(searchQuery.trim().toLowerCase()) ||
        author.includes(searchQuery.trim().toLowerCase())
      : true;
    return matchesFeedMode && matchesTag && matchesSearch;
  });

  const targetHandle = viewedAuthor ? viewedAuthor.handle.toLowerCase() : myHandle;

  const profilePosts = posts.filter((p) => {
    if (viewedAuthor) {
      if (viewedAuthor.userId && p.user_id === viewedAuthor.userId) return true;
      const postHandle = (
        p.author_handle || (p.author ? `@${p.author}` : '')
      ).toLowerCase();
      return postHandle === targetHandle;
    }
    return isPostOwnedByCurrentUser(p);
  });

  const bookmarkedPosts = posts.filter((p) => savedPostIds.includes(Number(p.id)));

  const sidebarTargetHandle = myHandle || '@zana2ibrahim';
  const sidebarFollowersCount = follows.filter(
    (f) => f.following_handle.toLowerCase() === sidebarTargetHandle
  ).length;
  const sidebarFollowingCount = follows.filter(
    (f) => f.follower_handle.toLowerCase() === sidebarTargetHandle
  ).length;

  const followersList = follows
    .filter((f) => f.following_handle.toLowerCase() === targetHandle)
    .map((f) => f.follower_handle);

  const followingList = follows
    .filter((f) => f.follower_handle.toLowerCase() === targetHandle)
    .map((f) => f.following_handle);

  const followersCount = followersList.length;
  const followingCount = followingList.length;

  const isFollowingViewed = follows.some(
    (f) =>
      f.follower_handle.toLowerCase() === myHandle &&
      f.following_handle.toLowerCase() === targetHandle
  );

  const myNotifications = user
    ? notifications.filter((n) => normHandle(n.targetHandle) === normHandle(myHandle))
    : [];
  const unreadNotifCount = Math.max(0, myNotifications.length - clearedNotifCount);
const renderPostCard = (post: any) => {
    const postBody = post.content_ku || post.content || '';
    const repostLines: string[] = [];
    const repostHandles: string[] = [];
    let trimmedBody = postBody;
    const lines = postBody.split(/\r?\n/);
    while (lines.length > 0) {
      const lastLine = lines[lines.length - 1].trim();
      if (!lastLine) {
        lines.pop();
        continue;
      }
      if (lastLine.startsWith("🔁")) {
        repostLines.unshift(lastLine);
        const handleMatches = lastLine.match(/@[A-Za-z0-9_.-]+/g) || [];
        for (const h of handleMatches) {
          if (!repostHandles.includes(h)) {
            repostHandles.push(h);
          }
        }
        lines.pop();
      } else {
        break;
      }
    }
    trimmedBody = lines.join("\n").trimEnd();
    const cleanPostBody = trimmedBody || (repostLines.length > 0 ? "" : postBody);
    const ownedByMe = isPostOwnedByCurrentUser(post);
    const displayName = ownedByMe
      ? profile?.full_name || post.author_name || post.author || dict.defaultUser
      : post.author_name || post.author || dict.defaultUser;
    const displayHandle = ownedByMe
      ? myHandle || post.author_handle || ''
      : post.author_handle || (post.author ? `@${post.author}` : '');
    const isLiked = likedPostIds.includes(post.id);
    const isSaved = savedPostIds.includes(Number(post.id));
    const postComments = commentsByPost[post.id] || [];
    const commentsOpen = openCommentsPostId === post.id;
    const postImage = post.image_url || '';

    return (
      <article
        key={post.id}
        className="bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-sm space-y-3"
      >
        <div className="flex items-center justify-between gap-2">
          <button
                  type="button"
                  onClick={() => openAuthorProfile(post)}
                  className="flex items-center gap-2.5 text-start group min-w-0"
                >
                  {(() => {
                    const cleanH = String(displayHandle || '').replace(/^@+/, '').toLowerCase();
                    const profEntry = Object.values(((typeof allProfiles !== 'undefined' ? allProfiles : {}) as Record<string, any>)).find(
                      (pr: any) =>
                        String(pr?.handle || pr?.username || '').replace(/^@+/, '').toLowerCase() === cleanH
                    );
                    const candidates = [
                      ownedByMe ? (typeof profile !== 'undefined' ? profile?.avatar_url : null) : null,
                      ownedByMe ? (typeof profile !== 'undefined' ? profile?.avatar : null) : null,
                      ownedByMe ? (typeof profile !== 'undefined' ? profile?.photo_url : null) : null,
                      post?.author_avatar,
                      post?.avatar_url,
                      post?.avatar,
                      post?.author_avatar_url,
                      profEntry?.avatar_url,
                      profEntry?.avatar,
                      profEntry?.photo_url,
                    ];
                    const avatarSrc = String(
                      candidates.find((v) => typeof v === 'string' && v.trim().length > 0) || ''
                    );
                    const initial = String(displayName || cleanH || '?').trim().charAt(0).toUpperCase() || '?';
                    return avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={displayName}
                        className="w-8 h-8 rounded-full object-cover border border-amber-400/40 shrink-0"
                      />
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">
                        {initial}
                      </span>
                    );
                  })()}
                  <span className="truncate">
            <span className="text-sm font-semibold text-amber-400 group-hover:underline">
              {displayName}
            </span>
            {displayHandle && (
              <span className="text-xs text-gray-400 font-normal ms-1.5 group-hover:text-gray-300">
                {displayHandle}
              </span>
            )}
          </span>
                </button>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-gray-500">
              {post.created_at
                ? new Date(post.created_at).toLocaleDateString()
                : ''}
            </span>
            {ownedByMe && editingPostId !== post.id && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditingPostId(post.id);
                    setEditingPostContent(splitEditableQuote(postBody).comment);
                  }}
                  className="p-1 text-gray-400 hover:text-amber-400 rounded-lg hover:bg-gray-800 transition"
                  aria-label="Edit"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePost(post.id)}
                  className="p-1 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-800 transition"
                  aria-label="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {editingPostId === post.id ? (
          <div className="space-y-2">
            <textarea
              value={editingPostContent}
              onChange={(e) => setEditingPostContent(e.target.value)}
              maxLength={MAX_POST_LENGTH}
              rows={3}
              className="w-full bg-gray-950 border border-gray-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              dir="auto"
            />
                      {(() => { const qInfo = splitEditableQuote(String(post?.content_ku || post?.content || "")); if (!qInfo.isQuoted) return null; return (<div className="rounded-xl border border-gray-700/80 bg-gray-900/75 p-3 space-y-1.5 select-none">
                            <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap" dir="auto">{qInfo.quotedBody}</div>
                            {qInfo.quotedHandle && (<div className="text-xs font-semibold text-amber-400">@{qInfo.quotedHandle}</div>)}
                          </div>); })()}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingPostId(null);
                  setEditingPostContent(splitEditableQuote('').comment);
                }}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 rounded-lg transition"
              >
                {dict.cancel}
              </button>
              <button
                type="button"
                onClick={() => handleSaveEditedPost(post.id)}
                className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-xs text-gray-950 font-semibold rounded-lg transition"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{dict.save}</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {(() => {
  const rawBody = String(cleanPostBody || "").trim();
  if (!rawBody) return null;
  const parsed = renderEmbeddedPostCard(rawBody);
  if (parsed) {
    return (
      <div className="space-y-2.5">
        {parsed.userComment && (
          <div className="text-base text-gray-100 leading-relaxed whitespace-pre-wrap" dir="auto">
            {renderContentWithTagsAndMentions(parsed.userComment)}
          </div>
        )}
        <div className="rounded-xl border border-gray-700/80 bg-gray-900/75 p-3 space-y-1.5 select-none">
          <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap" dir="auto">
            {renderContentWithTagsAndMentions(parsed.quotedBody)}
          </div>
              {parsed.quotedHandle && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              <span>@{parsed.quotedHandle}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  const hasRepost = repostHandles.length > 0 || repostLines.length > 0;
  if (hasRepost) {
    const rawHandle =
      repostHandles[0] ||
      (repostLines[0] || "").replace(/^🔁\s*/, "").trim() ||
      "";
    const cleanHandle = rawHandle.replace(/^@/, "").trim();
    return (
      <div className="rounded-xl border border-gray-700/80 bg-gray-900/75 p-3 space-y-1.5 select-none">
        {cleanHandle && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
            <Repeat2 className="w-3.5 h-3.5 shrink-0" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openHandleProfile(cleanHandle);
              }}
              className="hover:underline cursor-pointer"
            >
              @{cleanHandle}
            </button>
          </div>
        )}
        <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap" dir="auto">
          {renderContentWithTagsAndMentions(rawBody)}
        </div>
      </div>
    );
  }
  return (
    <div className="text-base text-gray-100 leading-relaxed whitespace-pre-wrap" dir="auto">
      {renderContentWithTagsAndMentions(rawBody)}
    </div>
  );
})()}
      {(() => null)()}
            {postImage && (
              <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-950">
                <img
                  src={postImage}
                  alt="Post attachment"
                  className="w-full max-h-80 object-cover"
                />
              </div>
            )}
          </>
        )}

        <div className="flex items-center justify-between gap-2 text-xs text-gray-400 pt-2.5 border-t border-gray-800/70">
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => handleLike(post)}
              className={`flex items-center gap-1.5 transition ${
                isLiked ? 'text-amber-400 font-semibold' : 'hover:text-amber-400'
              }`}
            >
              <Heart
                className={`w-4 h-4 text-amber-400 ${
                  isLiked ? 'fill-amber-400' : ''
                }`}
              />
              <span>{post.likes || 0}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setOpenCommentsPostId(commentsOpen ? null : post.id)
              }
              className={`flex items-center gap-1.5 transition ${
                commentsOpen ? 'text-amber-400' : 'hover:text-amber-400'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>{postComments.length}</span>
            </button>

            {(() => {
              const normalizedMyHandle = String(myHandle || '').trim().toLowerCase();
              const isRepostedByMe =
                Array.isArray(repostHandles) &&
                repostHandles.some((h) => String(h || '').trim().toLowerCase() === normalizedMyHandle) ||
                (Array.isArray(posts) &&
                  posts.some(
                    (other: any) =>
                      String(other?.author_handle || '').trim().toLowerCase() === normalizedMyHandle &&
                      String(other?.content_ku || other?.content || '').includes(
                        String(post?.author_handle || '').trim()
                      ) &&
                      String(other?.content_ku || other?.content || '').includes(
                        String(post?.content_ku || post?.content || '').slice(0, 40)
                      )
                  ));
              return (
                                <div className="relative" data-no-open="true">
                  <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setRepostMenuPostId((prev) => (prev === post.id ? null : post.id)); }}
                  className={`flex items-center gap-1.5 transition ${
                    isRepostedByMe ? 'text-amber-400 font-semibold' : 'hover:text-amber-400'
                  }`}
                >
                  <Repeat2
                    className={`w-4 h-4 ${isRepostedByMe ? 'text-amber-400' : ''}`}
                  />
                  <span>{dict.repostBtn}</span>
                </button>
                  {repostMenuPostId === post.id && (
                    <div className="absolute bottom-full mb-2 start-0 z-30 w-52 rounded-xl border border-gray-700 bg-gray-900/95 p-1.5 shadow-xl space-y-1">
                      <button
                        type="button"
                        className="w-full rounded-lg px-3 py-2 text-start text-xs font-medium text-gray-100 hover:bg-gray-800 transition"
                        onClick={(e) => { e.stopPropagation(); setRepostMenuPostId(null); handleRepost(post); }}>
                        {dict.repostBtn}
                      </button>
                      <button
                        type="button"
                        className="w-full rounded-lg px-3 py-2 text-start text-xs font-medium text-amber-300 hover:bg-gray-800 transition"
                        onClick={(e) => { e.stopPropagation(); handleQuote(post); }}>
                        {lang === 'so' ? 'دووبارە بڵاوکردنەوە بە وەرگرتنی دەق' : 'Ji nû ve biweşîne bi jêgirtin'}
                      </button>
                      {isRepostedByMe && (
                        <button
                          type="button"
                          className="w-full rounded-lg px-3 py-2 text-start text-xs font-medium text-red-300 hover:bg-gray-800 transition"
                          onClick={(e) => { e.stopPropagation(); setRepostMenuPostId(null); handleRepost(post); }}>
                          {lang === 'so' ? 'هەڵوەشاندنەوەی دووبارە بڵاوکردنەوە' : 'Betalkirina ji nû ve weşandinê'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          <button
            type="button"
            onClick={() => toggleBookmark(Number(post.id))}
            className={`flex items-center gap-1 transition ${
              isSaved ? 'text-amber-400' : 'hover:text-amber-400'
            }`}
            aria-label="Bookmark"
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-400' : ''}`} />
          </button>
        </div>

        {commentsOpen && (
          <div className="pt-3 border-t border-gray-800/80 space-y-3">
            {postComments.length === 0 ? (
              <p className="text-xs text-gray-500">{dict.noComments}</p>
            ) : (
              <div className="space-y-2">
                {postComments.map((c) => {
                  const canDeleteComment =
                    user &&
                    ((c.user_id && c.user_id === user.id) ||
                      (c.author_handle || '').toLowerCase() === myHandle);
                  return (
                    <div
                      key={c.id}
                      className="bg-gray-950 border border-gray-800/80 rounded-xl px-3 py-2 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => openHandleProfile(c.author_handle, c.author_name)}
                          className="font-semibold text-amber-400 hover:underline text-start"
                        >
                          {c.author_name}{' '}
                          <span className="text-gray-500 font-normal">
                            {c.author_handle}
                          </span>
                        </button>
                        {canDeleteComment && (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(post.id, c.id)}
                            className="text-gray-500 hover:text-red-400 transition"
                            aria-label="Delete comment"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-gray-200 whitespace-pre-wrap" dir="auto">
                        {c.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            <form
              onSubmit={(e) => handleAddComment(post.id, e)}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={commentInputs[post.id] || ''}
                onChange={(e) =>
                  setCommentInputs((prev) => ({
                    ...prev,
                    [post.id]: e.target.value,
                  }))
                }
                placeholder={dict.commentPlaceholder}
                className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                dir="auto"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-gray-950 text-xs font-semibold rounded-xl transition shrink-0"
              >
                {dict.commentSend}
              </button>
            </form>
          </div>
        )}
      </article>
    );
  };

  return (
    <main
      className="min-h-screen bg-gray-950 text-gray-100"
      dir={lang === 'so' ? 'rtl' : 'ltr'}
    >
      {/* Şerîta Jorîn (Top Bar): Sidebar button on one side, Rûpel centered, Notifications on the other side */}
      <header className="sticky top-0 z-30 bg-gray-950/90 backdrop-blur-md border-b border-gray-800 px-4 py-3 mb-6">
        <div className="max-w-2xl mx-auto grid grid-cols-3 items-center gap-2">
          <div className="flex items-center justify-start">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-200 transition"
              aria-label="Menû"
            >
              ☰
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => {
                setViewedAuthor(null);
                setActiveSection('feed');
                setSelectedTag('');
                setSearchQuery('');
              }}
              className="text-xl font-bold tracking-tight text-white hover:text-amber-400 transition truncate"
            >
              {renderBrandLogo(dict.title)}
            </button>
            {selectedTag && (
              <button
                type="button"
                onClick={() => setSelectedTag('')}
                className="hidden sm:flex items-center gap-1 text-[11px] bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full hover:bg-amber-500/25 transition shrink-0"
              >
                <span>#{selectedTag}</span>
                <span>✕</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => setShowSearchModal(true)}
className="flex items-center justify-center bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-amber-400/50 text-amber-400 w-9 h-9 rounded-xl transition shrink-0"
aria-label={dict.searchPlaceholder}
>
<span className="text-base font-bold leading-none">🔍</span>
</button>
          </div>
        </div>
      </header>

      {/* Lîsteya Alî (Sidebar Drawer) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          <aside className="relative w-72 max-w-[80vw] bg-gray-950 border-e border-gray-800 h-full p-5 flex flex-col justify-between z-10 shadow-2xl">
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-amber-500/15 border border-amber-500/40 rounded-full flex items-center justify-center text-sm font-bold text-amber-400 overflow-hidden shrink-0">
                    {(profile?.avatar_url || (profile?.id === user?.id ? avatarUrl : "")) ? (
                  <img
                    src={profile?.avatar_url || (profile?.id === user?.id ? avatarUrl : "")}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>
                        {(profile?.full_name || 'Zana Ibrahim').charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white text-sm truncate">
                      {profile?.full_name || 'Zana Ibrahim'}
                    </p>
                    <p className="text-xs text-amber-400 truncate">
                      @{profile?.username || getUsername(user)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-gray-400 hover:text-white px-2 py-1 rounded-lg hover:bg-gray-800"
                >
                  ✕
                </button>
              </div>

              {user && (
                <div className="flex items-center gap-4 text-xs px-1">
                  <div>
                    <span className="font-bold text-amber-400">
                      {sidebarFollowersCount}
                    </span>{' '}
                    <span className="text-gray-400">{dict.followersLabel}</span>
                  </div>
                  <div>
                    <span className="font-bold text-amber-400">
                      {sidebarFollowingCount}
                    </span>{' '}
                    <span className="text-gray-400">{dict.followingLabel}</span>
                  </div>
                </div>
              )}

              <nav className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setViewedAuthor(null);
                    setActiveSection('feed');
                    setSelectedTag('');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                    activeSection === 'feed'
                      ? 'bg-amber-500 text-gray-950 font-semibold'
                      : 'text-gray-300 hover:bg-gray-900'
                  }`}
                >
                  <span>🏠</span>
                  <span>{dict.mainFeed}</span>
                </button>

                <button
                  type="button"
                  onClick={handleNewPostShortcut}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-amber-400 hover:bg-gray-900 transition"
                >
                  <SquarePen className="w-4 h-4" />
                  <span>{dict.newPostNav}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExploreShortcut}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:bg-gray-900 transition"
                >
                  <Compass className="w-4 h-4 text-amber-400" />
                  <span>{dict.exploreNav}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setViewedAuthor(null);
                    setActiveSection('bookmarks');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                    activeSection === 'bookmarks'
                      ? 'bg-amber-500 text-gray-950 font-semibold'
                      : 'text-gray-300 hover:bg-gray-900'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Bookmark className="w-4 h-4" />
                    <span>{dict.bookmarksNav}</span>
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      activeSection === 'bookmarks'
                        ? 'bg-gray-950/20 text-gray-950 font-bold'
                        : 'bg-gray-900 text-amber-400'
                    }`}
                  >
                    {bookmarkedPosts.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setViewedAuthor(null);
                    setActiveSection('profile');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                    activeSection === 'profile'
                      ? 'bg-amber-500 text-gray-950 font-semibold'
                      : 'text-gray-300 hover:bg-gray-900'
                  }`}
                >
                  <span>👤</span>
                  <span>{dict.profileNav}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setViewedAuthor(null);
                    setActiveSection('settings');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                    activeSection === 'settings'
                      ? 'bg-amber-500 text-gray-950 font-semibold'
                      : 'text-gray-300 hover:bg-gray-900'
                  }`}
                >
                  <span>⚙️</span>
                  <span>{dict.settingsNav}</span>
                </button>
              </nav>
            </div>

            <div className="border-t border-gray-800 pt-4 space-y-3">
              {user ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-red-950/40 border border-gray-800 hover:border-red-500/40 text-xs font-semibold text-red-400 px-3.5 py-2.5 rounded-xl transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{dict.logoutBtn}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsSidebarOpen(false);
                    setIsRegisterMode(false);
                    setShowAuthModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-xs font-semibold text-gray-950 px-3.5 py-2.5 rounded-xl transition"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{dict.loginBtn}</span>
                </button>
              )}
              <div className="text-[11px] text-gray-500 text-center">
                {dict.title}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Modal Agahdarî (Notifications) */}
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
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {myNotifications.map((n) => {
                  const label =
                    n.type === 'like'
                      ? dict.notifLike
                      : n.type === 'comment'
                        ? dict.notifComment
                        : n.type === 'repost'
                          ? dict.notifRepost
                          : dict.notifFollow;
                  return (
                    <div
                      key={n.id}
                      className="bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs space-y-1"
                    >
                      <p className="text-gray-200">
                        <button
                          type="button"
                          onClick={() => {
                            setShowNotificationsModal(false);
                            openHandleProfile(n.actorHandle);
                          }}
                          className="font-semibold text-amber-400 hover:underline"
                        >
                          {n.actorHandle}
                        </button>{' '}
                        {label}
                      </p>
                      {n.preview && (
                        <p className="text-gray-500 truncate">{n.preview}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Lîsteya Şopîner û Şopandî (Followers / Following) */}
      {followModalType && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 w-full max-w-sm shadow-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => setFollowModalType(null)}
              className="absolute top-4 end-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-amber-400 flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>
                {followModalType === 'followers'
                  ? dict.followersLabel
                  : dict.followingLabel}
              </span>
            </h2>
            {(followModalType === 'followers' ? followersList : followingList)
              .length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">
                {dict.noFollowList}
              </p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {(followModalType === 'followers'
                  ? followersList
                  : followingList
                ).map((handleItem) => {
                  const normalized = handleItem.toLowerCase();
                  const amFollowing = follows.some(
                    (f) =>
                      f.follower_handle.toLowerCase() === myHandle &&
                      f.following_handle.toLowerCase() === normalized
                  );
                  return (
                    <div
                      key={normalized}
                      className="flex items-center justify-between gap-2 bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setFollowModalType(null);
                          openHandleProfile(normalized);
                        }}
                        className="font-semibold text-amber-400 hover:underline"
                      >
                        {normalized}
                      </button>
                      {user && normalized !== myHandle && (
                        <button
                          type="button"
                          onClick={() => handleToggleFollow(normalized)}
                          className={`px-2.5 py-1 rounded-lg font-medium transition ${
                            amFollowing
                              ? 'bg-gray-800 text-amber-400 border border-amber-500/30'
                              : 'bg-amber-500 text-gray-950'
                          }`}
                        >
                          {amFollowing ? dict.followingBtn : dict.followBtn}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Têketin / Tomarkirin */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 end-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
              {isRegisterMode ? (
                <UserPlus className="w-5 h-5" />
              ) : (
                <LogIn className="w-5 h-5" />
              )}
              {isRegisterMode ? dict.registerTitle : dict.loginTitle}
            </h2>

            <form onSubmit={handleAuth} className="space-y-4">
              {isRegisterMode && (
                <>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      {dict.fullNameLabel}
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Zana Ibrahim"
                      className="w-full bg-gray-950 border border-gray-800 p-3 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      {dict.usernameLabel}
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ''))}
                      placeholder="zana2ibrahim"
                      className="w-full bg-gray-950 border border-gray-800 p-3 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                      dir="ltr"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  {dict.emailLabel}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={dict.emailPlaceholder}
                  className="w-full bg-gray-950 border border-gray-800 p-3 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  {dict.passwordLabel}
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={dict.passPlaceholder}
                  className="w-full bg-gray-950 border border-gray-800 p-3 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                  dir="ltr"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-amber-500 hover:bg-amber-400 text-gray-950 p-3 rounded-xl font-semibold text-sm transition disabled:opacity-50"
              >
                {authLoading ? '...' : isRegisterMode ? dict.registerBtn : dict.loginBtn}
              </button>
            </form>

            <button
              type="button"
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              className="w-full mt-4 text-xs text-gray-400 hover:text-amber-400 text-center transition"
            >
              {isRegisterMode ? dict.hasAccount : dict.noAccount}
            </button>
          </div>
        </div>
      )}

      {/* Naveroka Sereke (Feed / Bookmarks / Profîl / Mîheng) */}
      <div className="max-w-2xl mx-auto px-4 pb-12 space-y-6">
        {activeSection === 'feed' && (
          <>
            {selectedTag && (
              <div className="flex sm:hidden items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-amber-400">
                <span>#{selectedTag}</span>
                <button
                  type="button"
                  onClick={() => setSelectedTag('')}
                  className="font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            {user ? (
              <form
                onSubmit={handlePost}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-lg"
              >
                <div className="text-xs text-amber-400 mb-2 font-medium">
                  @{getUsername(user)}
                </div>
                <textarea
                  ref={postTextareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={MAX_POST_LENGTH}
                  placeholder={dict.placeholder}
                  rows={2} onInput={(e) => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = `${Math.min(el.scrollHeight, 160)}px`; }} className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none resize-none min-h-[56px] max-h-40 mb-1.5 text-sm"
                  dir={lang === 'so' ? 'rtl' : 'ltr'}
                />
                {showImageInput && (
                  <>
              <div className="mb-3 flex items-center gap-2">
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs text-amber-400 transition">
                  <span>{uploadingPostImage ? (dict.uploadingLabel || "...") : (dict.uploadPostImage || "Upload from device")}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingPostImage}
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (!f) return;
                      try {
                        setUploadingPostImage(true);
                        const url = await uploadImageToBucket(f, "posts");
                        setImageUrl(url);
                      } catch (err: any) {
                        alert((dict.error || "Error: ") + (err?.message || String(err)));
                      } finally {
                        setUploadingPostImage(false);
                      }
                    }}
                  />
                </label>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="text-xs text-gray-400 hover:text-red-400"
                  >
                    ×
                  </button>
                )}
              </div>
              {imageUrl && (
                <div className="mb-3 rounded-xl overflow-hidden border border-gray-800 bg-gray-950 max-h-48 flex items-center justify-center">
                  <img src={imageUrl} alt="Post preview" className="max-h-48 w-auto object-contain" />
                </div>
              )}
            </>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowImageInput(!showImageInput)}
                      className={`p-1.5 rounded-lg border transition ${
                        showImageInput
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                          : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-amber-400'
                      }`}
                      aria-label="Add image"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                    <span
                      className={`text-xs ${
                        content.length > MAX_POST_LENGTH - 40
                          ? 'text-amber-400'
                          : 'text-gray-500'
                      }`}
                    >
                      {content.length}/{MAX_POST_LENGTH}
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={!content.trim()}
                    className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-gray-950 text-sm font-semibold px-5 py-2 rounded-xl flex items-center gap-2 transition"
                  >
                    <Send className="w-4 h-4" />
                    <span>{dict.publish}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4 flex items-center justify-between gap-3">
                <p className="text-xs sm:text-sm text-gray-400">
                  {dict.loginPrompt}
                </p>
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="bg-amber-500/15 border border-amber-500/40 text-amber-400 text-xs font-medium px-3.5 py-2 rounded-xl hover:bg-amber-500/25 transition whitespace-nowrap"
                >
                  {dict.loginBtn}
                </button>
              </div>
            )}

            {/* All / Following Feed Switch */}
            <div className="grid grid-cols-2 bg-gray-900 border border-gray-800 rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={() => setFeedMode('all')}
                className={`py-2 rounded-lg text-xs font-semibold transition ${
                  feedMode === 'all'
                    ? 'bg-amber-500 text-gray-950'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {dict.allTab}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    setShowAuthModal(true);
                    return;
                  }
                  setFeedMode('following');
                }}
                className={`py-2 rounded-lg text-xs font-semibold transition ${
                  feedMode === 'following'
                    ? 'bg-amber-500 text-gray-950'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {dict.followingTab}
              </button>
            </div>

            <div className="space-y-3">
              <div style={{ display: "none" }} className="relative">
                <Search className="w-4 h-4 text-gray-500 absolute top-1/2 -translate-y-1/2 start-3.5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ display: "none" }} placeholder={dict.searchPlaceholder}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl ps-10 pe-9 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute top-1/2 -translate-y-1/2 end-3 text-gray-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {false && trendingTags.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {trendingTags.map((tag) => {
                    const active = selectedTag.toLowerCase() === tag;
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSelectedTag(active ? '' : tag)}
                        className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition ${
                          active
                            ? 'bg-amber-500 text-gray-950 border-amber-500 font-semibold'
                            : 'bg-gray-900 text-gray-300 border-gray-800 hover:border-amber-500/40 hover:text-amber-400'
                        }`}
                      >
                        #{tag}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {filteredPosts.length === 0 ? (
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 text-center text-sm text-gray-400">
                {selectedTag || searchQuery
                  ? dict.noTagPosts
                  : feedMode === 'following'
                    ? dict.noFollowingPosts
                    : dict.noPosts}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPosts.map((post, index) => (
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
                      
              limit={SUGGESTED_LIMITS.feed}
            />
                    )}
                  </Fragment>
                ))}
              </div>
            )}
          </>
        )}

        {activeSection === 'bookmarks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveSection('feed')}
                className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{dict.backToFeed}</span>
              </button>
              <h2 className="text-sm font-bold text-amber-400">
                {dict.savedPostsTitle} ({bookmarkedPosts.length})
              </h2>
            </div>

            {bookmarkedPosts.length === 0 ? (
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 text-center text-sm text-gray-400">
                {dict.noSavedPosts}
              </div>
            ) : (
              <div className="space-y-4">
                {bookmarkedPosts.map((post) => renderPostCard(post))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'profile' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setViewedAuthor(null);
                  setActiveSection('feed');
                }}
                className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{dict.backToFeed}</span>
              </button>
            </div>

            <section className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg space-y-4">
              {viewedAuthor ? (() => {
  const va: any = viewedAuthor;
  const cleanTargetHandle = String(va.handle || "").replace(/^@/, "").toLowerCase();
              const targetId = String(va.userId || va.user_id || va.id || "");
              const matchedProfile = (allProfiles || []).find((p: any) =>
                (targetId && (String(p.id) === targetId || String(p.user_id || p.userId || "") === targetId)) ||
                (cleanTargetHandle && String(p.username || p.handle || "").replace(/^@/, "").toLowerCase() === cleanTargetHandle)
              );
              const viewedAvatar = va.avatar_url || va.avatarUrl || matchedProfile?.avatar_url || matchedProfile?.avatarUrl || "";
              const viewedBio = va.bio || matchedProfile?.bio || "";
              const viewedLocation = va.location || matchedProfile?.location || "";
              const viewedDisplayName = matchedProfile?.full_name || matchedProfile?.fullName || va.name || va.full_name || "";

              const viewedUserId = String(matchedProfile?.id || targetId || "");
              const viewedFollowersCount = viewedUserId ? (follows || []).filter((f: any) => String(f.following_id || "") === viewedUserId).length : 0;
              const viewedFollowingCount = viewedUserId ? (follows || []).filter((f: any) => String(f.follower_id || "") === viewedUserId).length : 0;
              const rawJoined = matchedProfile?.created_at || va.created_at || "";
              const viewedJoinedDate = rawJoined ? new Date(rawJoined).toLocaleDateString() : "";
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3.5">
        <div className="w-14 h-14 bg-amber-500/15 border border-amber-500/40 rounded-full flex items-center justify-center text-lg font-bold text-amber-400 overflow-hidden shrink-0">
          {viewedAvatar ? (
            <img src={viewedAvatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span>{(viewedDisplayName || "U").charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div>
          <h2 className="text-base font-bold text-white">{viewedDisplayName}</h2>
          <p className="text-xs text-amber-400">{va.handle}</p>
          {viewedBio && <p className="text-sm text-gray-300 mt-1.5">{viewedBio}</p>}
          {viewedLocation && <p className="text-xs text-gray-400 mt-1">📍 {viewedLocation}</p>}
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-400">
                        <span><strong className="text-amber-400">{viewedFollowersCount}</strong> {dict.followersLabel}</span>
                        <span><strong className="text-amber-400">{viewedFollowingCount}</strong> {dict.followingLabel}</span>
                        {viewedJoinedDate && <span>{viewedJoinedDate}</span>}
                      </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => handleToggleFollow(viewedAuthor.handle, viewedUserId || undefined)}
        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
          isFollowingViewed
            ? "bg-gray-800 text-amber-400 border border-amber-500/40 hover:bg-gray-700"
            : "bg-amber-500 text-gray-950 hover:bg-amber-400"
        }`}
      >
        {isFollowingViewed ? (
          <>
            <UserCheck className="w-3.5 h-3.5" />
            <span>{dict.followingBtn}</span>
          </>
        ) : (
          <>
            <UserPlus2 className="w-3.5 h-3.5" />
            <span>{dict.followBtn}</span>
          </>
        )}
      </button>
    </div>
      );
      })() : isEditingProfile ? (

                <div className="space-y-3">
                  <h2 className="text-base font-bold text-amber-400">
                    {dict.editProfileTitle}
                  </h2>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">
                      {dict.fullNameLabel}
                    </label>
                    <input
                      type="text"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">
                      {dict.avatarLabel}
                    </label>
                    <div className="mt-2 flex items-center gap-2">
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs text-amber-400 transition">
                  <span>{uploadingAvatar ? (dict.uploadingLabel || "...") : (dict.uploadAvatarImage || "Upload avatar from device")}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingAvatar}
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (!f) return;
                      try {
                        setUploadingAvatar(true);
                        const url = await uploadImageToBucket(f, "avatars");
                        setAvatarUrl(url);
                      } catch (err: any) {
                        alert((dict.error || "Error: ") + (err?.message || String(err)));
                      } finally {
                        setUploadingAvatar(false);
                      }
                    }}
                  />
                </label>
              </div>
              {avatarUrl && (
                <div className="mt-2 flex items-center gap-3">
                  <img src={avatarUrl} alt="Avatar preview" className="w-12 h-12 rounded-full object-cover border border-gray-700" />
                </div>
              )}
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">
                      {dict.bioLabel}
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">
                      {dict.locationLabel}
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl p-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-xl transition"
                    >
                      {dict.cancel}
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-gray-950 text-xs font-semibold rounded-xl transition"
                    >
                      {dict.save}
                    </button>
                  </div>
                </div>
              ) : (
      <>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 bg-amber-500/15 border border-amber-500/40 rounded-full flex items-center justify-center text-lg font-bold text-amber-400 overflow-hidden shrink-0">
                      {(profile?.avatar_url || (profile?.id === user?.id ? avatarUrl : "")) ? (
                  <img
                    src={profile?.avatar_url || (profile?.id === user?.id ? avatarUrl : "")}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>
                          {(profile?.full_name || 'Zana Ibrahim').charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">
                        {profile?.full_name || 'Zana Ibrahim'}
                      </h2>
                      <p className="text-xs text-amber-400">
                        @{profile?.username || getUsername(user)}
                      </p>
                      <p className="text-sm text-gray-300 mt-1.5">
                        {profile?.bio || dict.defaultBio}
                      </p>
                      {profile?.location && (
                        <p className="text-xs text-gray-400 mt-1">
                          📍 {profile.location}
                        </p>
                      )}
                    </div>
                  </div>

                  {user && (
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(true)}
                      className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-amber-400 border border-gray-700 text-xs font-medium rounded-xl transition shrink-0"
                    >
                      {dict.editProfile}
                    </button>
      )}

              <div className="flex items-center gap-6 pt-3 border-t border-gray-800 text-xs">
                <div>
                  <span className="font-bold text-white">{profilePosts.length}</span>{' '}
                  <span className="text-gray-400">{dict.postsCountLabel}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFollowModalType('followers')}
                  className="hover:underline"
                >
                  <span className="font-bold text-amber-400">{followersCount}</span>{' '}
                  <span className="text-gray-400">{dict.followersLabel}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFollowModalType('following')}
                  className="hover:underline"
                >
                  <span className="font-bold text-amber-400">{followingCount}</span>{' '}
                  <span className="text-gray-400">{dict.followingLabel}</span>
                </button>
              </div>
          </div>
      </>
    )
  }
            </section>

            {user &&
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
                  
              limit={SUGGESTED_LIMITS.profile}
            />
                );
              })()}

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-amber-400 px-1">
                {dict.userPostsTitle} ({profilePosts.length})
              </h3>
              {profilePosts.length === 0 ? (
                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 text-center text-sm text-gray-400">
                  {dict.noUserPosts}
                </div>
              ) : (
                <div className="space-y-4">
                  {profilePosts.map((post) => renderPostCard(post))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'settings' && (
          <section className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4 shadow-lg">
            <h2 className="text-base font-bold text-amber-400">
              {dict.settingsTitle}
            </h2>
            <div className="flex items-center justify-between pt-2 border-t border-gray-800">
              <div>
                <p className="text-sm font-medium text-white">
                  {dict.interfaceLangLabel}
                </p>
                <p className="text-xs text-gray-400">
                  {dict.interfaceLangDesc}
                </p>
              </div>
              <button
                type="button"
                onClick={() => changeLanguage(lang === 'ku' ? 'so' : 'ku')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs text-amber-400 rounded-xl transition"
              >
                <Languages className="w-3.5 h-3.5" />
                <span>{dict.switchLang}</span>
              </button>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-800">
              <div>
                <p className="text-sm font-medium text-white">
                  {dict.themeLabel}
                </p>
                <p className="text-xs text-gray-400">
                  {dict.themeDesc}
                </p>
              </div>
              <button
                type="button"
                onClick={() => applyTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-pressed={theme === 'light'}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs text-amber-400 rounded-xl transition"
              >
                {theme === 'dark' ? (
                  <Sun className="w-3.5 h-3.5" />
                ) : (
                  <Moon className="w-3.5 h-3.5" />
                )}
                <span>{theme === 'dark' ? dict.themeLight : dict.themeDark}</span>
              </button>
            </div>
          </section>
        )}
      </div>
    
      {/* Fixed Bottom Navigation Bar */}
      <nav
        aria-label={dict.mainFeed}
        className="fixed bottom-0 inset-x-0 z-40 bg-gray-900/95 backdrop-blur border-t border-gray-800"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="max-w-2xl mx-auto grid grid-cols-3 items-center h-14 px-2">
          <button
            type="button"
            onClick={() => {
              if (!user) {
                setShowAuthModal(true);
                return;
              }
              (() => { const nextCleared = myNotifications.length; setClearedNotifCount(nextCleared); if (typeof window !== "undefined") { try { window.localStorage.setItem(getNotifClearKey(user), String(nextCleared)); } catch {} } })()
              setShowNotificationsModal(true);
            }}
            className="relative flex flex-col w-full items-center justify-center gap-0.5 py-1 text-gray-400 hover:text-amber-400 transition"
          >
            <span className="relative inline-flex items-center justify-center text-base">
              🔔
              {user && unreadNotifCount > 0 && (
                <span className="ms-1 px-1.5 py-0.2 bg-amber-400 text-gray-950 rounded-full text-[10px] font-bold">
                  {unreadNotifCount}
                </span>
              )}
            </span>
            <span className="text-[11px] font-medium truncate max-w-[92px]">{dict.notificationsTitle}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setViewedAuthor(null);
              setActiveSection('feed');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex flex-col w-full items-center justify-center gap-0.5 py-1 transition ${
              activeSection === 'feed' && !viewedAuthor ? 'text-amber-400' : 'text-gray-400 hover:text-amber-400'
            }`}
          >
            <span className="text-base">🏠</span>
            <span className="text-[11px] font-medium truncate max-w-[92px]">{dict.mainFeed}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSuggestedModal(true)}
            className="flex flex-col w-full items-center justify-center gap-0.5 py-1 text-gray-400 hover:text-amber-400 transition"
          >
            <span className="text-base">👥</span>
            <span className="text-[11px] font-medium truncate max-w-[92px]">{dict.exploreNav}</span>
          </button>

        </div>
      </nav>

      {/* Comprehensive Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-start justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-xl bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={dict.searchPlaceholder}
                className="flex-1 bg-gray-950 border border-gray-800 focus:border-amber-400 rounded-xl px-3.5 py-2 text-sm text-white placeholder-gray-500 focus:outline-none"
              />
              {(searchQuery || selectedTag) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTag('');
                  }}
                  className="px-2.5 py-2 text-xs text-gray-400 hover:text-white bg-gray-800 rounded-xl"
                >
                  ✕
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowSearchModal(false)}
                className="px-3 py-2 text-xs font-semibold bg-amber-400 text-gray-950 rounded-xl"
              >
                {dict.cancel}
              </button>
            </div>

            {!searchQuery.trim() && !selectedTag && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-amber-400">#{dict.exploreNav}</div>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(
                    (posts as Array<{ content?: string }>).reduce(
                      (acc: Map<string, number>, item: { content?: string }) => {
                      const matches = (item.content || '').match(/#[^\s#]+/g) || [];
                      for (const m of matches) {
                        const clean = m.slice(1).toLowerCase();
                        if (clean) acc.set(clean, (acc.get(clean) || 0) + 1);
                      }
                      return acc;
                    }, new Map<string, number>())
                  )
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 7)
                    .map(([tag]) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setSelectedTag(tag);
                          setSearchQuery('#' + tag);
                        }}
                        className="text-xs px-3 py-1.5 rounded-full bg-gray-950 border border-gray-800 hover:border-amber-400/50 text-amber-400 transition"
                      >
                        #{tag}
                      </button>
                    ))}
                </div>
              </div>
            )}

            <div className="flex gap-1.5 border-b border-gray-800 pb-2 text-xs overflow-x-auto">
              {(['all', 'posts', 'people', 'tags'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSearchTab(tab)}
                  className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap ${
                    searchTab === tab ? 'bg-amber-400 text-gray-950' : 'bg-gray-950 text-gray-400 hover:text-white'
                  }`}
                >
                  {tab === 'all'
                    ? dict.exploreNav
                    : tab === 'posts'
                    ? dict.mainFeed
                    : tab === 'people'
                    ? dict.followersLabel
                    : '#'}
                </button>
              ))}
            </div>

            <div className="max-h-[55vh] overflow-y-auto space-y-3">
              {(searchTab === 'all' || searchTab === 'people') && searchQuery.trim() && (
                <div className="space-y-1.5">
                  {Object.values(allProfiles || {})
                    .filter((prof) => {
                      const q = searchQuery.replace(/^[@#]/, '').toLowerCase();
                      return (prof.name || '').toLowerCase().includes(q) || (prof.handle || '').toLowerCase().includes(q);
                    })
                    .slice(0, 6)
                    .map((prof) => (
                      <button
                        key={prof.handle}
                        type="button"
                        onClick={() => {
                          openHandleProfile(prof.handle, prof.name);
                          setShowSearchModal(false);
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gray-950 border border-gray-800 hover:border-amber-400/40 text-left"
                      >
                        <div>
                          <div className="text-sm font-semibold text-white">{prof.name || prof.handle}</div>
                          <div className="text-xs text-gray-400">@{prof.handle}</div>
                        </div>
                        <span className="text-xs text-amber-400">→</span>
                      </button>
                    ))}
                </div>
              )}

              {(searchTab === 'all' || searchTab === 'posts' || searchTab === 'tags') && (
                <div className="space-y-2">
                  {filteredPosts.length === 0 ? (
                    <div className="text-center text-xs text-gray-400 py-6">
                      {selectedTag || searchQuery ? dict.noTagPosts : dict.noPosts}
                    </div>
                  ) : (
                    filteredPosts.slice(0, 10).map((post) => (
                      <div
                        key={post.id}
                        onClick={() => {
                          setViewedAuthor(null);
                          setActiveSection('feed');
                          setShowSearchModal(false);
                        }}
                        className="p-3 rounded-xl bg-gray-950 border border-gray-800 hover:border-amber-400/40 cursor-pointer space-y-1"
                      >
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span className="font-semibold text-amber-400">@{post.author_handle}</span>
                        </div>
                        <p className="text-sm text-gray-200 line-clamp-3">{post.content}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Suggested Users Modal */}
      {showSuggestedModal && user && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <span className="text-sm font-bold text-amber-400">{dict.exploreNav}</span>
              <button
                type="button"
                onClick={() => setShowSuggestedModal(false)}
                className="px-2.5 py-1 text-xs bg-gray-800 text-gray-200 rounded-lg"
              >
                {dict.cancel}
              </button>
            </div>
            <SuggestedUsersCard
              dict={dict}
              profiles={allProfiles}
              follows={follows}
              currentUserId={user.id}
              myHandle={myHandle}
              onFollow={(handle, id) => handleToggleFollow(handle, id)}
              onOpenProfile={(handle, name) => {
                setShowSuggestedModal(false);
                openHandleProfile(handle, name);
              }}
            
              limit={SUGGESTED_LIMITS.feed}
            />
          </div>
        </div>
      )}

      
{quoteModalOpen && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
    onClick={() => {
      if (!quoteSubmitting) setQuoteModalOpen(false);
    }}
  >
    <div
      className="w-full max-w-lg rounded-2xl border border-gray-700 bg-gray-900 p-4 shadow-2xl space-y-3"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-gray-800 pb-2">
        <span className="text-sm font-bold text-amber-400">
          {lang === 'so' ? 'دووبارە بڵاوکردنەوە بە وەرگرتن' : 'Ji nû ve biweşîne bi jêgirtin'}
        </span>
        <button
          type="button"
          onClick={() => setQuoteModalOpen(false)}
          className="text-xs px-2.5 py-1 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 cursor-pointer"
        >
          ✕
        </button>
      </div>
      <textarea
        value={quoteDraft}
        onChange={(e) => setQuoteDraft(e.target.value)}
        rows={5}
        maxLength={MAX_POST_LENGTH}
        autoFocus
        dir="auto"
        className="w-full rounded-xl bg-gray-950 border border-gray-700 p-3 text-sm text-white focus:outline-none focus:border-amber-500"
      />
        {(() => {
          const tp: any = ((() => { const w: any = typeof window !== "undefined" ? window : {}; for (const k of ["__RUL_QUOTE_POST__", "quoteTargetPost", "quotingPost", "quotePost", "quotedPost", "selectedPost"]) { if (w[k]) return w[k]; } return null; })());
          if (!tp) return null;
          const rawQ = String(tp.content_ku || tp.content || "").trim();
          const parsedQ = typeof renderEmbeddedPostCard === "function" ? renderEmbeddedPostCard(rawQ) : null;
          const bodyQ = (parsedQ ? parsedQ.quotedBody : rawQ.replace(/^[❝“]|[❞”]s*$/g, "").replace(/@[A-Za-z0-9_.-]+s*$/g, "").trim()).replace(/[❝❞“”]/g, "").trim();
          const handleQ = (parsedQ ? parsedQ.quotedHandle : ((rawQ.match(/@([A-Za-z0-9_.-]+)s*[❞”s]*$/) || [])[1] || String(tp.author_handle || tp.handle || tp.username || ""))).replace(/^@/, "").trim();
          if (!bodyQ && !handleQ) return null;
          return (
            <div className="rounded-xl border border-gray-700/80 bg-gray-900/75 p-3 space-y-1.5 select-none">
              <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap" dir="auto">{bodyQ}</div>
              {handleQ && (<div className="text-xs font-semibold text-amber-400">@{handleQ}</div>)}
            </div>
          );
        })()}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{quoteDraft.length}/{MAX_POST_LENGTH}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setQuoteModalOpen(false)}
            className="px-3 py-1.5 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 cursor-pointer"
          >
            {lang === 'so' ? 'پاشگەزبوونەوە' : 'Betal bike'}
          </button>
          <button
            type="button"
            disabled={quoteSubmitting || !quoteDraft.trim()}
            onClick={async () => {
              const commentText = quoteDraft.trim();
                if (!commentText || quoteSubmitting) return;
                setQuoteSubmitting(true);
                try {
                  const tp: any = ((() => { const w: any = typeof window !== "undefined" ? window : {}; for (const k of ["__RUL_QUOTE_POST__", "quoteTargetPost", "quotingPost", "quotePost", "quotedPost", "selectedPost"]) { if (w[k]) return w[k]; } return null; })());
                  const rawQ = String(tp?.content_ku || tp?.content || "").trim();
                  const parsedQ = typeof renderEmbeddedPostCard === "function" ? renderEmbeddedPostCard(rawQ) : null;
                  const bodyQ = (parsedQ ? parsedQ.quotedBody : rawQ.replace(/^[❝“]|[❞”]s*$/g, "").replace(/@[A-Za-z0-9_.-]+s*$/g, "").trim()).replace(/[❝❞“”]/g, "").trim();
                  const handleQ = (parsedQ ? parsedQ.quotedHandle : ((rawQ.match(/@([A-Za-z0-9_.-]+)s*[❞”s]*$/) || [])[1] || String(tp?.author_handle || tp?.handle || tp?.username || ""))).replace(/^@/, "").trim();
                  const composed = rawQ
                    ? `${commentText} ❝${bodyQ}${handleQ ? ` @${handleQ}` : ""} ❞`.trim()
                    : commentText;
                  if (composed.length > MAX_POST_LENGTH) return;
                      const authorName = String((typeof profile !== "undefined" && (profile?.full_name || profile?.name || profile?.display_name || profile?.username)) || (typeof user !== "undefined" && (user?.user_metadata?.full_name || user?.user_metadata?.name || user?.user_metadata?.username || user?.email?.split("@")[0])) || "Zana").trim();
                      const authorHandle = String((typeof profile !== "undefined" && (profile?.handle || profile?.username)) || (typeof user !== "undefined" && (user?.user_metadata?.handle || user?.user_metadata?.username || user?.email?.split("@")[0])) || "").replace(/^@/, "").trim();
                      const payload: any = {
                        content_ku: composed,
                        author_name: authorName || "Zana",
                      };
                      if (authorHandle) payload.author_handle = authorHandle;
                      if (typeof user !== "undefined" && user?.id) payload.user_id = user.id;
                  const { error } = await supabase.from("posts").insert([payload]);
                  if (error) {
                    alert(dict.error + error.message);
                  } else {
                    setQuoteModalOpen(false);
                    setQuoteDraft('');
                    if (typeof fetchPosts === "function") await fetchPosts();
                  }
                } finally {
                  setQuoteSubmitting(false);
                }
            }}
            className="px-4 py-1.5 rounded-xl bg-amber-500 font-semibold text-gray-950 hover:bg-amber-400 disabled:opacity-50 cursor-pointer"
          >
            {quoteSubmitting ? "..." : (lang === 'so' ? 'بڵاوکردنەوە' : 'Weşandin')}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

</main>
  );
}







