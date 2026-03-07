import { graphql } from "@octokit/graphql";
import { Repository } from "@octokit/graphql-schema";

export type RepoIds = {
  user_name: string;
  repository_name: string;
};

function resolve(relative_path: string): URL {
  return new URL(relative_path, import.meta.url);
}

export const query =
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

export const fallback_query = `
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
  const data = await client<{ repository: Repository }>(query, params)
    .then((res) => res.repository);
  return data;
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
