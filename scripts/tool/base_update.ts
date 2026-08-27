function resolve(relative_path: string): URL {
    return new URL(relative_path, import.meta.url);
}

function main() {
    const root_dir_path = resolve("../../");
    const git_dir_path = new URL("template_base", root_dir_path);
    const template_url = "https://github.com/ScoopInstaller/BucketTemplate.git"
    if (!existsDir(git_dir_path)) {
        console.log(`Directory not found: ${git_dir_path}`);
        const args = ["clone", template_url, "template_base"];
        if (!execCommand("git", args, root_dir_path)) {
            return;
        }
    }

    // 更新
    if (!execCommand("git", ["pull"], git_dir_path)) {
        return;
    }

    // コピー
    const src = ".\\template_base\\.github\\workflows\\*.yml";
    const dest = ".\\.github\\workflows\\";
    if (!execShellCommand(["cp", src, dest], root_dir_path)) {
        return;
    }

}

function execShellCommand(args: string[], cwd?: URL): boolean {
    if (Deno.env.get("IS_WINDOWS") === "true") {
        return execCommand("pwsh", ["-c", ...args], cwd);
    }
    return execCommand("bash", ["-c", ...args], cwd);
}

function execCommand(cmd: string, args: string[], cwd?: URL): boolean {
    const command = new Deno.Command(cmd, {
        args,
        cwd,
    });
    console.log(`executeing: ${cmd} ${args.join(" ")}`);
    const { code } = command.outputSync();
    if (code !== 0) {
        console.error(` ${cmd} ${args.join(" ")} failed with code ${code}`);
        return false;
    }
    return true;
}

function existsDir(path: URL): boolean {
    try {
        const stats = Deno.statSync(path);
        return stats.isDirectory;
    } catch {
        return false;
    }
}

main();
