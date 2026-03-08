import { calc_url_body_hash } from "./ufh.ts";
import { createFontManifest, FontManifestParams } from "./font_manifest.ts";
import {
  createGithubGQL,
  getLatestRelease,
  getLicenseFromRepoData,
  getRepositoryData,
  RepoIds,
} from "./github_query.ts";

if (import.meta.main) {
  main();
}

function getRepos(): RepoIds[] {
  const github = "https://github.com/";
  const target_repos = [
    // "https://github.com/yuru7/HackGen",
    // "https://github.com/yuru7/PlemolJP",
    // "https://github.com/miiton/Cica",
    // "https://github.com/yuru7/udev-gothic",
    // "https://github.com/yuru7/moralerspace",
    // "https://github.com/yuru7/bizin-gothic",
    // "https://github.com/yuru7/NOTONOTO",
    // "https://github.com/yuru7/guguru-sans-code",
    // "https://github.com/yuru7/Firge",
    // "https://github.com/yuru7/BIZTER",
    // "https://github.com/yuru7/mint-mono",
    // "https://github.com/yuru7/Explex",
    // "https://github.com/yuru7/juisee",
    // "https://github.com/yuru7/pending-mono",
    "https://github.com/githubnext/monaspace",
  ].map((url) => {
    if (url.startsWith(github)) {
      return url.slice(github.length).split("/");
    } else {
      return url.split("/");
    }
  }).filter((url) => {
    // 念のためユーザーネームの誤りを排除
    return ["yuru7", "miiton", "githubnext"].includes(url[0]);
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

  const gql = createGithubGQL();

  const licenseMap = getLicenseMap();

  for (const repo of target_repos) {
    try {
      const gql_params = {
        owner: repo.user_name,
        name: repo.repository_name,
      };
      const data = await getRepositoryData(gql, gql_params);

      let license = getLicenseFromRepoData(data);
      if (license === null) {
        const l = licenseMap.get(repo.repository_name);
        if (l === undefined) {
          console.log(`no license for ${repo.repository_name}`);
        } else {
          license = l;
        }
      }

      const filterStr = data.name.replaceAll("-", "");

      const latestRelease = await getLatestRelease(data, gql, gql_params);

      const tagName = latestRelease!.tagName!;
      const description = data.description!;

      const version = tagName.replace("v", "");

      const assets = latestRelease!.releaseAssets!.nodes!.filter(
        (asset) => {
          return asset !== null;
        },
      ).filter((asset) => {
        return asset.name.toUpperCase().includes(filterStr.toUpperCase());
      });

      const bucketDirPath = "../../bucket/";

      for (const asset of assets) {
        const downloadUrl = asset.downloadUrl!;
        const hash = ("digest" in asset && typeof asset.digest === "string")
          ? formatDigest(asset.digest)
          : await calc_url_body_hash(downloadUrl);

        const file_name = getFileName(downloadUrl);
        const autoupdate_file_name = file_name.replaceAll(version, "\$version");

        const params: FontManifestParams = {
          version: version,
          description: description,
          user_name: repo.user_name,
          repository_name: repo.repository_name,
          license: license!,
          file_name,
          hash: hash,
          filter_str: filterStr,
          autoupdate_file_name,
        };

        const manifest = createFontManifest(params);

        const manifest_name = getManifestName(asset.name, version);
        const manifest_url = resolve(`${bucketDirPath}${manifest_name}.json`);

        if (existsFile(manifest_url)) {
          Deno.removeSync(manifest_url);
        }

        Deno.writeTextFileSync(
          manifest_url,
          JSON.stringify(manifest, null, 2) + "\r\n",
        );
      }
      console.log(
        `${repo.user_name}/${repo.repository_name}: created ${assets.length} manifests`,
      );
    } catch (e) {
      console.log(`error: ${repo.user_name}/${repo.repository_name}`);
      console.log(e);
    }
  }
}

function getManifestName(assetName: string, version: string): string {
  const name = assetName.replaceAll(`_v${version}`, "").replaceAll(
    `-v${version}`,
    "",
  )
    .replaceAll(`v${version}`, "").replaceAll(version, "");

  if (name.endsWith(".zip")) {
    return name.slice(0, name.length - 4).replaceAll("_", "-");
  } else {
    return name.replaceAll("_", "-");
  }
}

function getFileName(url_str: string): string {
  const pathname = (new URL(url_str)).pathname;
  const sIndex = pathname.lastIndexOf("/");
  return sIndex < 0 ? pathname : pathname.slice(sIndex + 1);
}

function existsFile(url: URL): boolean {
  try {
    const stat = Deno.statSync(url);
    return stat.isFile;
  } catch (_e) {
    return false;
  }
}

function formatDigest(digest: string): string {
  if (digest.startsWith("sha256:")) {
    return digest.slice(7);
  } else {
    return digest;
  }
}
