// Learn more at https://docs.deno.com/runtime/manual/examples/module_metadata#concepts
if (import.meta.main) {
  main();
}

async function main() {
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
  }).filter((url)=>{
    // 念のためユーザーネームの誤りを排除
    return ["yuru7", "miiton"].includes(url[0]);
  });


}
