import axios from "axios";
import { PR, Comment } from "./types/pr";

const getPR = async (token: string, prURL: string): Promise<PR> => {
  const prResponse = await axios.get(prURL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (prResponse.status !== 200) {
    console.error(prResponse.data);
    throw new Error(prResponse.statusText);
  }

  return prResponse.data;
};

const getPRComments = async (token: string, pr: PR): Promise<Comment[]> => {
  const commentsResponse = await axios.get(pr._links.comments.href, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (commentsResponse.status !== 200) {
    throw new Error(commentsResponse.statusText);
  }
  const comments: Comment[] = commentsResponse.data;
  return comments;
};

const isMergeReserved = async (token: string, pr: PR, keyword: string) => {
  if (!pr.mergeable) {
    return false;
  }
  if (pr.mergeable_state !== "clean") {
    return false;
  }
  if (pr.comments === 0) {
    return false;
  }

  const comments = await getPRComments(token, pr);
  const commentsBody = comments.map((comment) => comment.body);

  return commentsBody.includes(keyword);
};

const main = async () => {
  const env = process.env;
  const keyword = "reserve merge";

  const githubAPIURL = `https://api.github.com`;
  const prURL = `${githubAPIURL}/repos/${env.REPOSITORY_OWNER}/${env.REPOSITORY_NAME}/pulls/${env.PR_NUMBER}`;
  const prMergeURL = `${prURL}/merge`;

  const token = env.GITHUB_TOKEN || "";

  const pr = await getPR(token, prURL);

  const mergeable = await isMergeReserved(token, pr, keyword);
  if (!mergeable) {
    console.log("Merging is not reserved.");
    return;
  }

  axios.put(prMergeURL, {}, { headers: { Authorization: `Bearer ${token}` } });
  console.log(`PR #${env.PR_NUMBER} merged.`);
};

main();
