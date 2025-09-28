type ArchSpec = {
  [key: string]: string;
};
type ArchType = "32bit" | "64bit" | "arm64";
type Architecture = {
  [key in ArchType]?: ArchSpec;
};

export type Manifest = {
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
