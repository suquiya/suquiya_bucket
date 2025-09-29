import { Manifest } from "./manifest.ts";

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

const github_url = "https://github.com/";

const checkver = "github";

const extList = [".ttf", ".otf", ".ttc"].map((ext) => `"${ext}"`).join(", ");

function genGetFilesLine(filter_str: string, recursive = true): string {
  const recursiveStr = recursive ? " -Recurse" : "";
  return filter_str === ""
    ? `Get-ChildItem $dir -File${recursiveStr}`
    : `Get-ChildItem $dir -File -Filter '*${filter_str}*'${recursiveStr}`;
}

const fontTypeDefLine =
  "    $fontType = if ($_.Extension -eq '.otf') { ' (OpenType)' } else { ' (TrueType)' }";
function createInstallerScript(filter_str: string): string[] {
  const getFilesLine = genGetFilesLine(filter_str);
  return [
    '$currentBuildNumber = [int] (Get-ItemProperty "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion").CurrentBuildNumber',
    "$windows10Version1809BuildNumber = 17763",
    "$isPerUserFontInstallationSupported = $currentBuildNumber -ge $windows10Version1809BuildNumber",
    "if (!$isPerUserFontInstallationSupported -and !$global) {",
    "    scoop uninstall $app",
    '    Write-Host ""',
    '    Write-Host "For Windows version before Windows 10 Version 1809 (OS Build 17763)," -Foreground DarkRed',
    '    Write-Host "Font can only be installed for all users." -Foreground DarkRed',
    '    Write-Host ""',
    "    Write-Host \"Please use following commands to install '$app' Font for all users.\" -Foreground DarkRed",
    '    Write-Host ""',
    '    Write-Host "        scoop install sudo"',
    '    Write-Host "        sudo scoop install -g $app"',
    '    Write-Host ""',
    "    exit 1",
    "}",
    '$fontInstallDir = if ($global) { "$env:windir\\Fonts" } else { "$env:LOCALAPPDATA\\Microsoft\\Windows\\Fonts" }',
    "if (-not $global) {",
    "    # Ensure user font install directory exists and has correct permission settings",
    "    # See https://github.com/matthewjberger/scoop-nerd-fonts/issues/198#issuecomment-1488996737",
    "    New-Item $fontInstallDir -ItemType Directory -ErrorAction SilentlyContinue | Out-Null",
    "    $accessControlList = Get-Acl $fontInstallDir",
    '    $allApplicationPackagesAccessRule = New-Object System.Security.AccessControl.FileSystemAccessRule([System.Security.Principal.SecurityIdentifier]::new("S-1-15-2-1"), "ReadAndExecute", "ContainerInherit,ObjectInherit", "None", "Allow")',
    '    $allRestrictedApplicationPackagesAccessRule = New-Object System.Security.AccessControl.FileSystemAccessRule([System.Security.Principal.SecurityIdentifier]::new("S-1-15-2-2"), "ReadAndExecute", "ContainerInherit,ObjectInherit", "None", "Allow")',
    "    $accessControlList.SetAccessRule($allApplicationPackagesAccessRule)",
    "    $accessControlList.SetAccessRule($allRestrictedApplicationPackagesAccessRule)",
    "    Set-Acl -AclObject $accessControlList $fontInstallDir",
    "}",
    '$registryRoot = if ($global) { "HKLM" } else { "HKCU" }',
    '$registryKey = "${registryRoot}:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts"',
    `${getFilesLine} | Where-Object { @(${extList}) -contains $_.Extension } | ForEach-Object {`,
    '    $value = if ($global) { $_.Name } else { "$fontInstallDir\\$($_.Name)" }',
    fontTypeDefLine,
    "    New-ItemProperty -Path $registryKey -Name $_.Name.Replace($_.Extension, $fontType) -Value $value -Force | Out-Null",
    "    Copy-Item -LiteralPath $_.FullName -Destination $fontInstallDir",
    "}",
  ];
}

function createPreUninstallerScript(filter_str: string): string[] {
  const getFilesLine = genGetFilesLine(filter_str, false);
  return [
    '$fontInstallDir = if ($global) { "$env:windir\\Fonts" } else { "$env:LOCALAPPDATA\\Microsoft\\Windows\\Fonts" }',
    `${getFilesLine} | ForEach-Object {`,
    "    Get-ChildItem $fontInstallDir -Filter $_.Name | ForEach-Object {",
    "        try {",
    "            Rename-Item $_.FullName $_.FullName -ErrorVariable LockError -ErrorAction Stop",
    "        } catch {",
    '            Write-Host ""',
    '            Write-Host " Error " -Background DarkRed -Foreground White -NoNewline',
    '            Write-Host ""',
    "            Write-Host \" Cannot uninstall '$app' font.\" -Foreground DarkRed",
    '            Write-Host ""',
    '            Write-Host " Reason " -Background DarkCyan -Foreground White -NoNewline',
    '            Write-Host ""',
    "            Write-Host \" The '$app' font is currently being used by another application,\" -Foreground DarkCyan",
    '            Write-Host " so it cannot be deleted." -Foreground DarkCyan',
    '            Write-Host ""',
    '            Write-Host " Suggestion " -Background Magenta -Foreground White -NoNewline',
    '            Write-Host ""',
    "            Write-Host \" Close all applications that are using '$app' font (e.g. vscode),\" -Foreground Magenta",
    '            Write-Host " and then try again." -Foreground Magenta',
    '            Write-Host ""',
    "            exit 1",
    "        }",
    "    }",
    "}",
  ];
}

function createUninstallerScript(filter_str: string): string[] {
  const getFilesLine = genGetFilesLine(filter_str);
  return [
    '$fontInstallDir = if ($global) { "$env:windir\\Fonts" } else { "$env:LOCALAPPDATA\\Microsoft\\Windows\\Fonts" }',
    '$registryRoot = if ($global) { "HKLM" } else { "HKCU" }',
    '$registryKey = "${registryRoot}:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts"',
    `${getFilesLine} | ForEach-Object {`,
    fontTypeDefLine,
    "    Remove-ItemProperty -Path $registryKey -Name $_.Name.Replace($_.Extension, $fontType) -Force -ErrorAction SilentlyContinue",
    '    Remove-Item "$fontInstallDir\\$($_.Name)" -Force -ErrorAction SilentlyContinue',
    "}",
    'if ($cmd -eq "uninstall") {',
    "    Write-Host \"The '$app' Font family has been uninstalled and will not be present after restarting your computer.\" -Foreground Magenta",
    "}",
  ];
}

export function createFontManifest(params: FontManifestParams): Manifest {
  return {
    version: params.version,
    description: params.description,
    homepage: `${github_url}${params.user_name}/${params.repository_name}`,
    license: params.license,
    url:
      `${github_url}${params.user_name}/${params.repository_name}/releases/download/v${params.version}/${params.file_name}`,
    hash: params.hash,
    checkver,
    autoupdate: {
      url:
        `${github_url}${params.user_name}/${params.repository_name}/releases/download/v$version/${params.autoupdate_file_name}`,
    },
    installer: {
      script: createInstallerScript(params.filter_str),
    },
    uninstaller: {
      script: createUninstallerScript(params.filter_str),
    },
    pre_uninstall: createPreUninstallerScript(params.filter_str),
  };
}
