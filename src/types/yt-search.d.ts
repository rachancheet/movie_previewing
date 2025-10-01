declare module 'yt-search' {
  interface YtVideo {
    videoId?: string;
    title?: string;
  }
  interface YtSearchResult {
    videos?: YtVideo[];
  }
  function yts(query: string): Promise<YtSearchResult>;
  export = yts;
}


