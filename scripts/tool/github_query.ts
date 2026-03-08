import { graphql } from "@octokit/graphql";
import { Release, Repository } from "@octokit/graphql-schema";

export type RepoIds = {
  user_name: string;
  repository_name: string;
};

export const get_repo_and_latest_release_query =
  `query getRepoAndLatestRelease($owner: String!, $name: String!){
      repository(owner: $owner, name: $name){
              name,
              description,
              licenseInfo {
              spdxId,
              },
              latestRelease{
              tagName,
              description,
              id,
              resourcePath,
              releaseAssets(first: 10) {
                  nodes{
                      contentType,
                      downloadUrl,
                      id,
                      name,
                      size,
                      digest
                  }
              }
          }
      }
  }`;

export const get_last_release_query = `
  query getLastRelease($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
          releases(first: 1, orderBy: {field: CREATED_AT, direction: DESC}) {
              nodes {
                  tagName
                  description
                  id
                  resourcePath
                  releaseAssets(first: 10) {
                      nodes {
                          contentType
                          downloadUrl
                          id
                          name
                          size
                          digest
                      }
                  }
              }
          }
      }
  }
`;

export type GithubGQLClient = typeof graphql;
export function createGithubGQL(): GithubGQLClient {
  return graphql.defaults({
    headers: {
      authorization: `token ${Deno.env.get("GITHUB_TOKEN")}`,
    },
  });
}

export async function getRepositoryData(
  client: typeof graphql,
  params: { owner: string; name: string },
): Promise<Repository> {
  const data = await client<{ repository: Repository }>(
    get_repo_and_latest_release_query,
    params,
  )
    .then((res) => res.repository);
  return data;
}

export function getLicenseFromRepoData(
  repo: Repository,
): string | null {
  if (
    repo.licenseInfo === undefined || repo.licenseInfo === null ||
    repo.licenseInfo.spdxId === undefined
  ) {
    return null;
  }
  const license = repo.licenseInfo.spdxId;
  if (
    license === null || license.length === 0 || license === "NOASSERTION"
  ) {
    return null;
  }
  return license;
}

export async function getLatestRelease(
  repo: Repository,
  client: typeof graphql,
  params: { owner: string; name: string },
): Promise<Release | null> {
  let latestRelease = repo.latestRelease;
  if (latestRelease === null) {
    const data = await client<{ repository: Repository }>(
      get_last_release_query,
      params,
    );
    latestRelease = data.repository.releases?.nodes?.at(0);
  }
  if (latestRelease === undefined) {
    return null;
  }
  return latestRelease;
}

if (import.meta.main) {
  main();
}

async function main() {
  // graphQLのテスト
  const client = createGithubGQL();
  const params = { owner: "githubnext", name: "monaspace" };
  const data = await getRepositoryData(client, params);
  console.log(data);
}
