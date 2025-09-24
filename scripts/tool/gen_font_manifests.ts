import { graphql } from "@octokit/graphql";
import { Repository } from "@octokit/graphql-schema";
import { createTemplaterFromUrl, ManifestParams } from "./manifest.ts";
import { calc_url_body_hash } from "./ufh.ts";

if (import.meta.main) {
  main();
}

type RepoIds = {
  user_name: string;
  repository_name: string;
};

function getRepos(): RepoIds[] {
  const github = "https://github.com/";
  const target_repos = [
    "https://github.com/yuru7/HackGen",
    "https://github.com/yuru7/PlemolJP",
    "https://github.com/miiton/Cica",
    "https://github.com/yuru7/udev-gothic",
    "https://github.com/yuru7/moralerspace",
    "https://github.com/yuru7/bizin-gothic",
    "https://github.com/yuru7/NOTONOTO",
    "https://github.com/yuru7/guguru-sans-code",
    "https://github.com/yuru7/Firge",
    "https://github.com/yuru7/BIZTER",
    "https://github.com/yuru7/mint-mono",
    "https://github.com/yuru7/Explex",
    "https://github.com/yuru7/juisee",
    "https://github.com/yuru7/pending-mono",
  ].map((url) => {
    if (url.startsWith(github)) {
      return url.slice(github.length).split("/");
    } else {
      return url.split("/");
    }
  }).filter((url) => {
    // 念のためユーザーネームの誤りを排除
    return ["yuru7", "miiton"].includes(url[0]);
  }).map((value) => {
    return {
      user_name: value[0],
      repository_name: value[1],
    };
  });

  return target_repos;
}

function getLicenseMap(): Map<string, string> {
  return new Map(Object.entries({
    "Cica": "OFL-1.1",
    "HackGen": "OFL-1.1",
    "PlemolJP": "OFL-1.1",
    "udev-gothic": "OFL-1.1",
    "Firge": "OFL-1.1",
    "BIZTER": "OFL-1.1",
  }));
}

function resolve(relative_path: string): URL {
  return new URL(relative_path, import.meta.url);
}

async function main() {
  const target_repos = getRepos();

  const gql = graphql.defaults({
    headers: {
      authorization: `token ${Deno.env.get("GITHUB_TOKEN")}`,
    },
  });

  const template_url = resolve("../../bucket/font-install.json.template");

  const query = `query getRepoAndLatestRelease($owner: String!, $name: String!){
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

  const templater = await createTemplaterFromUrl(template_url);

  const licenseMap = getLicenseMap();

  for (const repo of target_repos.slice(0, 1)) {
    const data = await gql<{ repository: Repository }>(query, {
      owner: repo.user_name,
      name: repo.repository_name,
    }).then((res) => res.repository);

    let license = data.licenseInfo!.spdxId!;
    if (license.length === 0 || license === "NOASSERTION") {
      const l = licenseMap.get(repo.repository_name);
      if (l === undefined) {
        console.log(`no license for ${repo.repository_name}`);
      } else {
        license = l;
      }
    }

    const filterStr = data.name.replaceAll("-", "");

    const tagName = data.latestRelease!.tagName!;
    const description = data.description!;

    const version = tagName.replace("v", "");

    const assets = data.latestRelease!.releaseAssets!.nodes!.filter((asset) => {
      return asset !== null;
    }).filter((asset) => {
      return asset.name.toUpperCase().includes(filterStr.toUpperCase());
    });

    const bucketDirPath = "../../bucket/";

    for (const asset of assets) {
      const downloadUrl = asset.downloadUrl!;
      const hash = ("digest" in asset && typeof asset.digest === "string")
        ? asset.digest
        : await calc_url_body_hash(downloadUrl);

      const file_name = getFileName(downloadUrl);
      const autoupdate_file_name = file_name.replaceAll(version, "\$version");

      const manifest_name = asset.name.replaceAll(`_v${version}`, "")
        .replaceAll(`v${version}`, "").replaceAll(version, "");
      const params: ManifestParams = {
        version: version,
        description: description,
        user_name: repo.user_name,
        repository_name: repo.repository_name,
        license: license,
        file_name,
        hash: hash,
        filter_str: filterStr,
        autoupdate_file_name,
      };

      const manifest_url = resolve(`${bucketDirPath}${manifest_name}.json`);

      await templater.writeToUrl(manifest_url, params);
    }
  }
}

function getFileName(url_str: string): string {
  const pathname = (new URL(url_str)).pathname;
  const sIndex = pathname.lastIndexOf("/");
  return sIndex < 0 ? pathname : pathname.slice(sIndex + 1);
}
