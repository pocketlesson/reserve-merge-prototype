export interface Href {
  href: string;
}

export interface PRLinks {
  self: Href;
  html: Href;
  issue: Href;
  comments: Href;
  review_comments: Href;
  review_comment: Href;
  commits: Href;
  statuses: Href;
}

export interface PR {
  mergeable: boolean;
  mergeable_state: "clean" | "dirty" | "unstable";
  comments: number;
  _links: PRLinks;
}

export interface Comment {
  url: string;
  html_url: string;
  issue_url: string;
  user: {
    login: string;
  };
  body: string;
}
