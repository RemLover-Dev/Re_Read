import React, { useState, useEffect } from 'react';
import { useThemeStore } from '../../stores/useThemeStore';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { getCleanCharacterTag, BooruProvider } from '../../core/booru/query-builder';
import { fetchBooruPosts, downloadWallpaperToDisk, BooruPost } from '../../core/booru/booru-client';
import {
  Search,
  Image as ImageIcon,
  ExternalLink,
  Download,
  Check,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Columns,
  BookOpen,
  KeyRound,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Save,
} from 'lucide-react';

export const BooruBrowser: React.FC = () => {
  const { currentCharacter, setCustomWallpaper } = useThemeStore();
  const { setActiveMode } = useWorkspaceStore();

  const [provider, setProvider] = useState<BooruProvider>('safebooru');
  const [tagQuery, setTagQuery] = useState<string>('');
  const [posts, setPosts] = useState<BooruPost[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<BooruPost | null>(null);
  const [appliedPostId, setAppliedPostId] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);

  // Zerochan Credentials & Tutorial state
  const [zerochanUser, setZerochanUser] = useState<string>(() => {
    return localStorage.getItem('reread_zerochan_user') || 'lovermover';
  });
  const [zerochanPass, setZerochanPass] = useState<string>(() => {
    return localStorage.getItem('reread_zerochan_pass') || 'l123454321l';
  });
  const [isZerochanBoxOpen, setIsZerochanBoxOpen] = useState<boolean>(false);
  const [credentialsSavedMsg, setCredentialsSavedMsg] = useState<string | null>(null);

  // Initialize query from current active character
  useEffect(() => {
    const cleanTag = getCleanCharacterTag(currentCharacter.id, currentCharacter.name.en, provider);
    setTagQuery(cleanTag);
    executeSearch(provider, cleanTag, 0);
  }, [currentCharacter]);

  const handleProviderChange = (newProvider: BooruProvider) => {
    setProvider(newProvider);
    const cleanTag = getCleanCharacterTag(currentCharacter.id, currentCharacter.name.en, newProvider);
    setTagQuery(cleanTag);
    executeSearch(newProvider, cleanTag, 0);
  };

  const executeSearch = async (
    targetProvider: BooruProvider,
    query: string,
    targetPage: number = 0
  ) => {
    setIsLoading(true);
    setMessage(null);

    const result = await fetchBooruPosts(targetProvider, query, targetPage, 35);
    setPosts(result.posts);
    if (result.message) {
      setMessage(result.message);
    }
    setPage(targetPage);
    setIsLoading(false);
  };

  const handleSaveZerochanCredentials = () => {
    localStorage.setItem('reread_zerochan_user', zerochanUser.trim());
    localStorage.setItem('reread_zerochan_pass', zerochanPass.trim());
    setCredentialsSavedMsg('✅ تنظیمات حساب ذخیره شد');
    setTimeout(() => setCredentialsSavedMsg(null), 3000);
  };

  const handleApplyWallpaper = (post: BooruPost) => {
    setAppliedPostId(post.id);
    const targetUrl = post.file_url || post.preview_url;

    // Apply immediately and permanently to the desktop background
    setCustomWallpaper(targetUrl);
    setMessage(`✨ تصویر #${post.id} با موفقیت به عنوان والپیپر پس‌زمینه ست شد! برای مشاهده به نمای Split یا Reader بروید.`);

    // Silently cache on disk in background for offline persistence (never overwrite targetUrl)
    try {
      const ext = post.file_url.includes('.png') ? 'png' : 'jpg';
      const filename = `${post.provider}_${post.id}.${ext}`;
      downloadWallpaperToDisk(post.file_url, filename).catch(() => {});
    } catch (_) {}

    setTimeout(() => setAppliedPostId(null), 3000);
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-black/25 backdrop-blur-md text-slate-100">
      {/* Search Header Bar */}
      <div className="p-6 border-b border-white/10 bg-black/40 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-primary/20 text-primary border border-primary/30">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center space-x-2">
                <span>Wallpaper & Art Browser</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-medium">
                  {currentCharacter.name.en}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-persian">
                  {currentCharacter.name.fa}
                </span>
              </h2>
              <p className="text-xs text-textMuted font-persian">
                مرورگر والپیپرهای انیمه با تفکیک برچسب‌های ری‌زیرو • Safebooru, Zerochan, E-shuushuu
              </p>
            </div>
          </div>

          {/* 3-Way Provider Toggle */}
          <div className="flex items-center bg-black/50 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => handleProviderChange('safebooru')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                provider === 'safebooru'
                  ? 'bg-primary text-black font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Safebooru
            </button>
            <button
              onClick={() => handleProviderChange('zerochan')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                provider === 'zerochan'
                  ? 'bg-primary text-black font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Zerochan
            </button>
            <button
              onClick={() => handleProviderChange('eshuushuu')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                provider === 'eshuushuu'
                  ? 'bg-primary text-black font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              E-shuushuu
            </button>
          </div>
        </div>

        {/* Zerochan Tutorial & Credentials Box */}
        {provider === 'zerochan' && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-3 transition-all">
            <div
              onClick={() => setIsZerochanBoxOpen(!isZerochanBoxOpen)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center space-x-2 text-xs font-semibold text-primary">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span className="font-persian">راهنمای فعال‌سازی Zerochan (دور زدن Cloudflare 503)</span>
                <span className="text-[11px] text-slate-400 font-mono">• Zerochan Access Setup</span>
              </div>
              <button className="text-slate-400 hover:text-white p-0.5">
                {isZerochanBoxOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Instruction body */}
            <div className={`space-y-3 ${isZerochanBoxOpen ? 'block' : 'hidden'}`}>
              <div className="text-xs text-slate-300 leading-relaxed font-persian space-y-1.5 bg-black/30 p-3 rounded-lg border border-white/5">
                <p>
                  سایت <strong className="text-white">Zerochan</strong> برای جلوگیری از درخواست‌های خودکار از لایه امنیتی Cloudflare استفاده می‌کند. برای جستجوی مستقیم و بدون محدودیت، فقط کافیست یک حساب کاربری رایگان داشته باشید:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-300">
                  <li>
                    وارد صفحه ثبت‌نام رایگان زیر شوید:
                    <a
                      href="https://www.zerochan.net/register"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 text-primary hover:underline font-mono text-[11px] ml-1.5"
                    >
                      <span>zerochan.net/register</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>نام کاربری و رمز عبور خود را در کادرهای زیر وارد کرده و دکمه ذخیره را بزنید.</li>
                  <li>اطلاعات شما به صورت امن در سیستم محلی ذخیره می‌شود و خطای 503 برطرف می‌گردد.</li>
                </ol>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex-1 w-full flex items-center space-x-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={zerochanUser}
                    onChange={(e) => setZerochanUser(e.target.value)}
                    placeholder="Zerochan Username (نام کاربری)"
                    className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
                  />
                </div>
                <div className="flex-1 w-full flex items-center space-x-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="password"
                    value={zerochanPass}
                    onChange={(e) => setZerochanPass(e.target.value)}
                    placeholder="Zerochan Password (رمز عبور)"
                    className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
                  />
                </div>
                <button
                  onClick={handleSaveZerochanCredentials}
                  className="px-4 py-1.5 rounded-lg bg-primary text-black font-semibold text-xs hover:opacity-90 transition-all flex items-center space-x-1.5 shrink-0"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span className="font-persian">ذخیره</span>
                </button>
              </div>

              {credentialsSavedMsg && (
                <p className="text-[11px] text-green-400 font-persian">{credentialsSavedMsg}</p>
              )}
            </div>
          </div>
        )}

        {/* Search Input Bar */}
        <div className="flex items-center space-x-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={tagQuery}
              onChange={(e) => setTagQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && executeSearch(provider, tagQuery, 0)}
              placeholder="Search Re:Zero character tag..."
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-black/50 border border-white/15 text-white placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono transition-all"
            />
          </div>

          <button
            onClick={() => executeSearch(provider, tagQuery, 0)}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-primary text-black font-semibold hover:opacity-90 disabled:opacity-50 transition-all flex items-center space-x-1.5"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Search</span>
          </button>
        </div>

        {/* Informational Toast Message with quick view switcher */}
        {message && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs animate-fade-in">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 shrink-0 text-primary" />
              <span className="font-medium text-slate-100">{message}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveMode('split')}
                className="px-2.5 py-1 rounded-lg bg-primary/20 hover:bg-primary hover:text-black border border-primary/40 text-primary text-[11px] font-semibold transition-all flex items-center space-x-1"
              >
                <Columns className="w-3 h-3" />
                <span>Split View</span>
              </button>
              <button
                onClick={() => setActiveMode('reader')}
                className="px-2.5 py-1 rounded-lg bg-primary/20 hover:bg-primary hover:text-black border border-primary/40 text-primary text-[11px] font-semibold transition-all flex items-center space-x-1"
              >
                <BookOpen className="w-3 h-3" />
                <span>Reader View</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Image Gallery Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono text-primary animate-pulse">Scanning Booru API...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-3 text-center">
            <div className="p-3 rounded-full bg-white/5 text-slate-400">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-semibold text-white">No Wallpapers Found</h3>
            <p className="text-xs text-textMuted max-w-sm">
              Try adjusting the search tag or switch between Safebooru, Zerochan, and E-shuushuu.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {posts.map((post) => (
              <div
                key={`${post.provider}_${post.id}`}
                className="group relative rounded-xl overflow-hidden glass-panel border border-white/10 hover:border-primary/50 transition-all duration-300 flex flex-col"
              >
                {/* Thumbnail Container */}
                <div
                  onClick={() => setSelectedPost(post)}
                  className="relative aspect-[3/4] bg-black/60 overflow-hidden cursor-pointer flex items-center justify-center"
                >
                  <img
                    src={post.preview_url}
                    alt={`Post #${post.id}`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== post.file_url) {
                        target.src = post.file_url;
                      }
                    }}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Resolution & Aspect Badges */}
                  <div className="absolute top-2 left-2 flex flex-col space-y-1 pointer-events-none">
                    <span className="px-2 py-0.5 rounded bg-black/80 backdrop-blur text-[10px] font-mono text-primary font-bold">
                      {post.resolution_badge}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-black/80 backdrop-blur text-[9px] font-mono text-slate-300">
                      {post.aspect_ratio}
                    </span>
                  </div>

                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur text-[9px] font-mono uppercase text-slate-300">
                    {post.provider}
                  </span>
                </div>

                {/* Card Action Bar */}
                <div className="p-3 bg-black/40 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400 truncate max-w-[120px]">
                    #{post.id}
                  </span>

                  <button
                    onClick={() => handleApplyWallpaper(post)}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      appliedPostId === post.id
                        ? 'bg-green-500 text-black'
                        : 'bg-primary text-black hover:opacity-90'
                    }`}
                    title="Apply as App Wallpaper"
                  >
                    {appliedPostId === post.id ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Applied!</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Apply</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {posts.length > 0 && (
          <div className="mt-8 flex items-center justify-center space-x-4">
            <button
              onClick={() => executeSearch(provider, tagQuery, Math.max(0, page - 1))}
              disabled={page === 0 || isLoading}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold hover:bg-white/10 disabled:opacity-30 transition-all"
            >
              Previous Page
            </button>
            <span className="text-xs font-mono text-slate-400">Page {page + 1}</span>
            <button
              onClick={() => executeSearch(provider, tagQuery, page + 1)}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold hover:bg-white/10 transition-all"
            >
              Next Page
            </button>
          </div>
        )}
      </div>

      {/* Modal Image Full-View */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-panel max-w-4xl w-full max-h-[90vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-white/20">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
              <span className="font-mono text-xs text-slate-300">
                {selectedPost.provider} #{selectedPost.id} ({selectedPost.width}x{selectedPost.height})
              </span>
              <button
                onClick={() => setSelectedPost(null)}
                className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/50">
              <img
                src={selectedPost.file_url}
                alt={selectedPost.id}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== selectedPost.preview_url) {
                    target.src = selectedPost.preview_url;
                  }
                }}
                className="max-h-[70vh] max-w-full rounded-lg object-contain shadow-2xl"
              />
            </div>

            <div className="p-4 border-t border-white/10 bg-black/40 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {selectedPost.source && (
                  <a
                    href={selectedPost.source}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Source Link</span>
                  </a>
                )}
                <a
                  href={selectedPost.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Full Resolution</span>
                </a>
              </div>

              <button
                onClick={() => {
                  handleApplyWallpaper(selectedPost);
                  setSelectedPost(null);
                }}
                className="px-4 py-2 rounded-xl bg-primary text-black font-semibold text-xs hover:opacity-90 transition-opacity flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Apply as Wallpaper</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
