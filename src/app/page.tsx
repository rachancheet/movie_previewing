"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ── Types ─────────────────────────────────────────────────────────── */
type MovieItem = {
  name: string;
  hasTrailer: boolean;
  embedUrl: string | null;
  videoId: string | null;
};

type TrailerResponse = {
  movie: string;
  videoId: string;
  embedUrl: string;
};

type WatchedMovie = {
  name: string;
  embedUrl: string;
  watchedAt: number;
};

/* ── Component ─────────────────────────────────────────────────────── */
export default function Home() {
  // Player state
  const [currentMovie, setCurrentMovie] = useState<string | null>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Movie list dropdown
  const [allMovies, setAllMovies] = useState<MovieItem[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Session watch history
  const [watchHistory, setWatchHistory] = useState<WatchedMovie[]>([]);

  /* ── Fetch movies list ───────────────────────────────────────────── */
  const fetchMoviesList = useCallback(async () => {
    try {
      const res = await fetch("/api/movies", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setAllMovies(data.movies ?? []);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchMoviesList();
  }, [fetchMoviesList]);

  /* ── Load random trailer ─────────────────────────────────────────── */
  const loadRandomTrailer = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/trailer", { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "No trailers available");
      }
      const data: TrailerResponse = await res.json();
      setCurrentMovie(data.movie);
      setEmbedUrl(data.embedUrl);
      addToHistory(data.movie, data.embedUrl);
    } catch (e: unknown) {
      setCurrentMovie(null);
      setEmbedUrl(null);
      setError(e instanceof Error ? e.message : "Failed to load trailer");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Play specific movie ─────────────────────────────────────────── */
  const playMovie = useCallback(
    (movie: MovieItem) => {
      if (!movie.embedUrl) return;
      setCurrentMovie(movie.name);
      setEmbedUrl(movie.embedUrl);
      setDropdownOpen(false);
      setSearchQuery("");
      addToHistory(movie.name, movie.embedUrl);
    },
    []
  );

  const playFromHistory = useCallback((item: WatchedMovie) => {
    setCurrentMovie(item.name);
    setEmbedUrl(item.embedUrl);
  }, []);

  /* ── Mark as watched ─────────────────────────────────────────────── */
  const markAsWatched = useCallback(async () => {
    if (!currentMovie) return;
    try {
      // Optimistic update
      const movieToHide = currentMovie;
      setAllMovies((prev) => prev.filter((m) => m.name !== movieToHide));

      // If the currently playing movie is the one we just watched, load a new one
      loadRandomTrailer();

      await fetch("/api/mark_watched", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: movieToHide }),
      });
    } catch (e) {
      console.error("Failed to mark as watched", e);
    }
  }, [currentMovie, loadRandomTrailer]);

  /* ── Watch history tracker ───────────────────────────────────────── */
  const addToHistory = (name: string, url: string) => {
    setWatchHistory((prev) => {
      const filtered = prev.filter((h) => h.name !== name);
      return [{ name, embedUrl: url, watchedAt: Date.now() }, ...filtered];
    });
  };

  /* ── Keyboard shortcut ───────────────────────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !dropdownOpen) loadRandomTrailer();
      if (e.key === "Escape") setDropdownOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [loadRandomTrailer, dropdownOpen]);

  /* ── Click outside to close dropdown ─────────────────────────────── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── Filtered movies ─────────────────────────────────────────────── */
  const filteredMovies = allMovies.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <main className="main-wrapper" style={styles.main}>
      {/* Background gradient orbs */}
      <div style={styles.bgOrb1} />
      <div style={styles.bgOrb2} />



      {/* ── Content Grid ─────────────────────────────────────────── */}
      <div className="content-grid" style={styles.contentGrid}>
        {/* Left: Player + Controls */}
        <div className="player-column" style={styles.playerColumn}>
          {/* Movie selector dropdown */}
          <div ref={dropdownRef} style={styles.dropdownWrapper}>
            <button
              id="movie-dropdown-toggle"
              onClick={() => {
                setDropdownOpen(!dropdownOpen);
                fetchMoviesList();
              }}
              style={{
                ...styles.dropdownButton,
                ...(dropdownOpen ? styles.dropdownButtonActive : {}),
              }}
            >
              <span style={styles.dropdownLabel}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0 }}
                >
                  <rect x="2" y="2" width="20" height="20" rx="2" />
                  <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 7h5M17 17h5" />
                </svg>
                Browse Movies
                <span style={styles.badge}>{allMovies.length}</span>
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  transition: "transform var(--transition-fast)",
                  transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="dropdown-backdrop"
                  onClick={() => setDropdownOpen(false)}
                  style={{
                    display: "none",
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.5)",
                    zIndex: 99,
                  }}
                />
                <div className="dropdown-panel" style={styles.dropdownPanel}>
                  <div style={styles.searchWrapper}>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--text-tertiary)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ flexShrink: 0 }}
                    >
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      id="movie-search-input"
                      type="text"
                      placeholder="Search movies…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={styles.searchInput}
                      autoFocus
                    />
                  </div>

                  <div className="dropdown-list" style={styles.dropdownList}>
                    {filteredMovies.length === 0 ? (
                      <div style={styles.emptyState}>No movies found</div>
                    ) : (
                      filteredMovies.map((m, i) => (
                        <button
                          key={m.name}
                          id={`movie-item-${i}`}
                          onClick={() => playMovie(m)}
                          disabled={!m.hasTrailer}
                          style={{
                            ...styles.dropdownItem,
                            ...(currentMovie === m.name
                              ? styles.dropdownItemActive
                              : {}),
                            ...(!m.hasTrailer ? styles.dropdownItemDisabled : {}),
                            animationDelay: `${i * 30}ms`,
                          }}
                        >
                          <span style={styles.movieItemName}>
                            <span
                              style={{
                                ...styles.statusDot,
                                background: m.hasTrailer
                                  ? "var(--success)"
                                  : "var(--text-tertiary)",
                              }}
                            />
                            {m.name}
                          </span>
                          {m.hasTrailer ? (
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              style={{ opacity: 0.5, flexShrink: 0 }}
                            >
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                          ) : (
                            <span
                              style={{
                                fontSize: 11,
                                color: "var(--text-tertiary)",
                              }}
                            >
                              No trailer
                            </span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Video Player */}
          <div style={styles.playerCard}>
            {currentMovie && (
              <div className="now-playing-bar" style={styles.nowPlaying}>
                <span style={styles.nowPlayingDot} />
                <span style={styles.nowPlayingText}>Now Playing</span>
                <span style={styles.nowPlayingMovie}>{currentMovie}</span>
              </div>
            )}

            <div style={styles.playerFrame}>
              {embedUrl ? (
                <iframe
                  key={embedUrl}
                  src={`${embedUrl}?autoplay=1&rel=0`}
                  style={styles.iframe}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div style={styles.emptyPlayer}>
                  {loading ? (
                    <div style={styles.loadingState}>
                      <div style={styles.spinner} />
                      <span>Finding a trailer…</span>
                    </div>
                  ) : error ? (
                    <div style={styles.errorState}>
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--error)"
                        strokeWidth="1.5"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  ) : (
                    <div style={styles.placeholderState}>
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--text-tertiary)"
                        strokeWidth="1"
                      >
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      <span>Select a movie or hit shuffle</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="controls-row" style={styles.controls}>
            <button
              id="shuffle-button"
              onClick={loadRandomTrailer}
              disabled={loading}
              style={{
                ...styles.primaryButton,
                ...(loading ? styles.buttonDisabled : {}),
              }}
            >
              {loading ? (
                <>
                  <div style={styles.spinnerSmall} />
                  Finding…
                </>
              ) : (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="16 3 21 3 21 8" />
                    <line x1="4" y1="20" x2="21" y2="3" />
                    <polyline points="21 16 21 21 16 21" />
                    <line x1="15" y1="15" x2="21" y2="21" />
                    <line x1="4" y1="4" x2="9" y2="9" />
                  </svg>
                  Shuffle
                </>
              )}
            </button>

            <button
              id="mark-watched-button"
              onClick={markAsWatched}
              disabled={!currentMovie || loading}
              style={{
                ...styles.secondaryButton,
                ...(!currentMovie || loading ? styles.buttonDisabled : {}),
              }}
              title="Mark as watched (won't show again)"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
              Mark Watched
            </button>
          </div>
          <div style={{ marginTop: 8, display: "flex", justifyContent: "center" }}>
            <span className="hint-text" style={styles.hint}>
              Press <kbd style={styles.kbd}>↵</kbd> to shuffle
            </span>
          </div>
        </div>

        {/* Right: Watch History sidebar */}
        <aside className="sidebar" style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <h2 style={styles.sidebarTitle}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Watch History
            </h2>
            <span style={styles.historyBadge}>
              {watchHistory.length}
            </span>
          </div>

          <div style={styles.historyList}>
            {watchHistory.length === 0 ? (
              <div style={styles.emptyHistory}>
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-tertiary)"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>Movies you watch will appear here</span>
              </div>
            ) : (
              watchHistory.map((item, i) => {
                const isPlaying = currentMovie === item.name && embedUrl === item.embedUrl;
                return (
                  <button
                    key={`${item.name}-${item.watchedAt}`}
                    id={`history-item-${i}`}
                    onClick={() => playFromHistory(item)}
                    style={{
                      ...styles.historyItem,
                      ...(isPlaying ? styles.historyItemPlaying : {}),
                      animationDelay: `${i * 40}ms`,
                    }}
                  >
                    <div style={styles.historyItemContent}>
                      <div className="history-thumb" style={styles.historyThumb}>
                        <img
                          src={`https://img.youtube.com/vi/${item.embedUrl.split("/embed/")[1]?.split("?")[0]}/mqdefault.jpg`}
                          alt=""
                          style={styles.historyThumbImg}
                        />
                        <div style={styles.historyPlayOverlay}>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="white"
                          >
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </div>
                      </div>
                      <div style={styles.historyInfo}>
                        <span style={styles.historyMovieName}>{item.name}</span>
                        <span style={styles.historyTime}>
                          {formatTimeAgo(item.watchedAt)}
                        </span>
                      </div>
                    </div>
                    {isPlaying && (
                      <div style={styles.playingIndicator}>
                        <div style={styles.playingBar} />
                        <div style={{ ...styles.playingBar, animationDelay: "0.2s", height: 12 }} />
                        <div style={{ ...styles.playingBar, animationDelay: "0.4s" }} />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="footer-bar" style={styles.footer}>
        <span style={styles.footerText}>
          Built with Next.js · {allMovies.length} movies loaded
        </span>
      </footer>
    </main>
  );
}

/* ── Time formatter ────────────────────────────────────────────────── */
function formatTimeAgo(timestamp: number): string {
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 5) return "Just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

/* ── Styles ────────────────────────────────────────────────────────── */
const styles: Record<string, React.CSSProperties> = {
  /* Layout */
  main: {
    /* layout props (padding, gap, etc.) are in .main-wrapper CSS class for responsive overrides */
    overflow: "hidden",
  },

  bgOrb1: {
    position: "fixed",
    top: -200,
    right: -200,
    width: 600,
    height: 600,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(0,112,243,0.08) 0%, transparent 70%)",
    pointerEvents: "none",
    zIndex: 0,
  },

  bgOrb2: {
    position: "fixed",
    bottom: -300,
    left: -200,
    width: 700,
    height: 700,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(130,80,223,0.06) 0%, transparent 70%)",
    pointerEvents: "none",
    zIndex: 0,
  },



  kbd: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 22,
    height: 20,
    padding: "0 6px",
    borderRadius: 4,
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-default)",
    fontSize: 11,
    fontFamily: "var(--font-mono)",
    color: "var(--text-secondary)",
    lineHeight: 1,
  },

  /* Content Grid */
  contentGrid: {
    /* layout props are in .content-grid CSS class for responsive overrides */
  },

  playerColumn: {
    /* layout props are in .player-column CSS class */
    minWidth: 0,
  },

  /* ── Dropdown ──────────────────────────────────────── */
  dropdownWrapper: {
    position: "relative" as const,
  },

  dropdownButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 14px",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-default)",
    background: "var(--bg-card)",
    color: "var(--text-primary)",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all var(--transition-fast)",
  },

  dropdownButtonActive: {
    borderColor: "var(--accent)",
    boxShadow: "0 0 0 2px var(--accent-soft)",
  },

  dropdownLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 20,
    height: 20,
    padding: "0 6px",
    borderRadius: 10,
    background: "var(--accent-soft)",
    color: "var(--accent)",
    fontSize: 11,
    fontWeight: 600,
    fontFamily: "var(--font-mono)",
  },

  dropdownPanel: {
    position: "absolute" as const,
    top: "calc(100% + 4px)",
    left: 0,
    right: 0,
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-default)",
    background: "var(--bg-card)",
    boxShadow: "var(--glass-shadow)",
    zIndex: 50,
    animation: "slideDown 0.2s ease-out",
    overflow: "hidden",
  },

  searchWrapper: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderBottom: "1px solid var(--border-default)",
  },

  searchInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "var(--text-primary)",
    fontSize: 13,
    fontFamily: "inherit",
  },

  dropdownList: {
    maxHeight: 280,
    overflowY: "auto" as const,
    padding: 4,
  },

  dropdownItem: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 10px",
    borderRadius: "var(--radius-sm)",
    border: "none",
    background: "transparent",
    color: "var(--text-primary)",
    fontSize: 13,
    cursor: "pointer",
    transition: "all var(--transition-fast)",
    animation: "slideDown 0.2s ease-out both",
    textAlign: "left" as const,
  },

  dropdownItemActive: {
    background: "var(--accent-soft)",
    color: "var(--accent)",
  },

  dropdownItemDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },

  movieItemName: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    flexShrink: 0,
  },

  emptyState: {
    padding: "24px 16px",
    textAlign: "center" as const,
    color: "var(--text-tertiary)",
    fontSize: 13,
  },

  /* ── Player ────────────────────────────────────────── */
  playerCard: {
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border-default)",
    background: "var(--bg-card)",
    overflow: "hidden",
    animation: "fadeInScale 0.5s ease-out",
  },

  nowPlaying: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 16px",
    borderBottom: "1px solid var(--border-default)",
    background: "var(--bg-secondary)",
  },

  nowPlayingDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "var(--success)",
    animation: "pulse-ring 2s ease-in-out infinite",
  },

  nowPlayingText: {
    fontSize: 12,
    fontWeight: 500,
    color: "var(--text-tertiary)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },

  nowPlayingMovie: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text-primary)",
  },

  playerFrame: {
    aspectRatio: "16 / 9",
    background: "#000",
    position: "relative" as const,
  },

  iframe: {
    width: "100%",
    height: "100%",
    border: "none",
  },

  emptyPlayer: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--text-tertiary)",
  },

  loadingState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 16,
    fontSize: 14,
  },

  errorState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 12,
    fontSize: 13,
    color: "var(--error)",
  },

  placeholderState: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 12,
    fontSize: 13,
    opacity: 0.6,
  },

  spinner: {
    width: 32,
    height: 32,
    border: "3px solid var(--border-default)",
    borderTopColor: "var(--accent)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },

  spinnerSmall: {
    width: 14,
    height: 14,
    border: "2px solid rgba(255,255,255,0.2)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },

  /* Controls */
  controls: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  primaryButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 20px",
    borderRadius: "var(--radius-md)",
    border: "none",
    background: "var(--accent)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all var(--transition-fast)",
    boxShadow: "0 0 20px var(--accent-glow)",
  },

  secondaryButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 16px",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-default)",
    background: "var(--bg-elevated)",
    color: "var(--text-secondary)",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all var(--transition-fast)",
  },

  buttonDisabled: {
    opacity: 0.6,
    cursor: "wait",
  },

  hint: {
    fontSize: 13,
    color: "var(--text-tertiary)",
    display: "flex",
    alignItems: "center",
    gap: 4,
  },

  /* ── Sidebar ───────────────────────────────────────── */
  sidebar: {
    /* layout props (maxHeight, etc.) are in .sidebar CSS class for responsive overrides */
  },

  sidebarHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    borderBottom: "1px solid var(--border-default)",
    background: "var(--bg-secondary)",
  },

  sidebarTitle: {
    fontSize: 14,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "var(--text-secondary)",
  },

  historyBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 22,
    height: 22,
    padding: "0 8px",
    borderRadius: 11,
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-default)",
    color: "var(--text-secondary)",
    fontSize: 12,
    fontFamily: "var(--font-mono)",
    fontWeight: 600,
  },

  historyList: {
    flex: 1,
    overflowY: "auto" as const,
    padding: 8,
  },

  emptyHistory: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: "48px 16px",
    color: "var(--text-tertiary)",
    fontSize: 13,
    textAlign: "center" as const,
  },

  historyItem: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
    borderRadius: "var(--radius-sm)",
    border: "none",
    background: "transparent",
    color: "var(--text-primary)",
    cursor: "pointer",
    transition: "all var(--transition-fast)",
    animation: "slideUp 0.3s ease-out both",
    textAlign: "left" as const,
    marginBottom: 2,
  },

  historyItemPlaying: {
    background: "var(--accent-soft)",
  },

  historyItemContent: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
    flex: 1,
  },

  historyThumb: {
    position: "relative" as const,
    width: 64,
    height: 36,
    borderRadius: 4,
    overflow: "hidden",
    flexShrink: 0,
    background: "var(--bg-elevated)",
  },

  historyThumbImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  },

  historyPlayOverlay: {
    position: "absolute" as const,
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,0.4)",
    opacity: 0,
    transition: "opacity var(--transition-fast)",
  },

  historyInfo: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 2,
    minWidth: 0,
  },

  historyMovieName: {
    fontSize: 13,
    fontWeight: 500,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },

  historyTime: {
    fontSize: 11,
    color: "var(--text-tertiary)",
    fontFamily: "var(--font-mono)",
  },

  playingIndicator: {
    display: "flex",
    alignItems: "flex-end",
    gap: 2,
    height: 16,
    flexShrink: 0,
  },

  playingBar: {
    width: 3,
    height: 8,
    borderRadius: 1.5,
    background: "var(--accent)",
    animation: "pulse-ring 1s ease-in-out infinite",
  },

  /* Footer */
  footer: {
    zIndex: 1,
    padding: "16px 0",
    borderTop: "1px solid var(--border-default)",
    width: "100%",
    maxWidth: 1200,
    textAlign: "center" as const,
  },

  footerText: {
    fontSize: 12,
    color: "var(--text-tertiary)",
  },
};
