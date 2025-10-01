declare module 'yt-search' {
  interface YtVideo {
    videoId?: string;
    title?: string;
    [key: string]: any;
  }
  interface YtSearchResult {
    videos?: YtVideo[];
    [key: string]: any;
  }
  function yts(query: string): Promise<YtSearchResult>;
  export = yts;
}


