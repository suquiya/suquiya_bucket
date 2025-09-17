import { encodeHex } from "@std/encoding/hex";

if (import.meta.main) {
  for (let i = 0; i < Deno.args.length; i++) {
    const url = Deno.args[i];
    if (url.startsWith("http://") || url.startsWith("https://")) {
      await calc_url_body_hash(Deno.args[i]);
    }
  }
}

async function calc_url_body_hash(url: string) {
  const res = await fetch(url);

  const body = await res.arrayBuffer();

  const hashBuffer = await crypto.subtle.digest("SHA-256", body);

  const hash = encodeHex(hashBuffer);

  console.log(`${url} => ${hash}`);
}
