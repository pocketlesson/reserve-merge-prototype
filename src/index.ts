import axios from "axios";
import Auth from "types/auth";
import { PR, Comment } from "./types/pr";

const getPR = async (auth: Auth, prURL: string): Promise<PR> => {
  const prResponse = await axios.get(prURL, {
    auth,
  });
  if (prResponse.status !== 200) {
    console.error(prResponse.data);
    throw new Error(prResponse.statusText);
  }

  return prResponse.data;
};

const getPRComments = async (auth: Auth, pr: PR): Promise<Comment[]> => {
  const commentsResponse = await axios.get(pr._links.comments.href, { auth });
  if (commentsResponse.status !== 200) {
    throw new Error(commentsResponse.statusText);
  }
  const comments: Comment[] = commentsResponse.data;
  return comments;
};

const isMergeReserved = async (auth: Auth, pr: PR, keyword: string) => {
  if (!pr.mergeable) {
    return false;
  }
  if (pr.mergeable_state !== "clean") {
    return false;
  }
  if (pr.comments === 0) {
    return false;
  }

  const comments = await getPRComments(auth, pr);
  const commentsBody = comments.map((comment) => comment.body);

  return commentsBody.includes(keyword);
};

const main = async () => {
  const env = process.env;
  const auth = {
    username: env.GITHUB_USERNAME || "",
    password: env.GITHUB_PASSWORD || "",
  };
  const keyword = "reserve merge";

  const githubAPIURL = `https://api.github.com`;
  const prURL = `${githubAPIURL}/repos/${env.REPOSITORY_OWNER}/${env.REPOSITORY_NAME}/pulls/${env.PR_NUMBER}`;
  const prMergeURL = `${prURL}/merge`;

  const pr = await getPR(auth, prURL);

  const mergeable = await isMergeReserved(auth, pr, keyword);
  if (!mergeable) {
    console.log("Merging is not reserved.");
    return;
  }

  axios.put(prMergeURL, {}, { auth });
  console.log(`PR #${env.PR_NUMBER} merged.`);
};

main();
