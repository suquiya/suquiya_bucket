export type FontManifestParams = {
  version: string;
  description: string;
  user_name: string;
  repository_name: string;
  license: string;
  file_name: string;
  hash: string;
  filter_str: string;
  autoupdate_file_name: string;
};

type ArchSpec = {
  [key: string]: string;
};
type ArchType = "32bit" | "64bit" | "arm64";
type Architecture = {
  [key in ArchType]?: ArchSpec;
};

type Manifest = {
  version: string;
  description: string;
  homepage: string;
  license: string;
  url?: string;
  hash?: string;
  architecture?: Architecture;
  installer?: {
    script?: string[];
  };
  uninstaller?: {
    script?: string[];
  };
  pre_uninstall?: string[];
  checkver?: string;
  autoupdate?: {
    url?: string;
  };
};
