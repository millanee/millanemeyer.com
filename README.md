# millanemeyer.com

Personal portfolio of Millane Meyer, software engineer (M.Sc. Computer Science). Static HTML, CSS, and vanilla JavaScript. English is the default; German lives at `/de/`. The language toggle stores the choice in `localStorage` and sets `lang` on the document.

## Deploy on GitHub Pages

1. Settings → Pages → Build and deployment → Source: **Deploy from a branch**.
2. Branch: **main**, folder: **/ (root)**.
3. The `CNAME` file sets the custom domain to `millanemeyer.com`. `.nojekyll` keeps GitHub Pages from running Jekyll.

## Cloudflare DNS

Until the certificate is issued, leave the records on **DNS only** (grey cloud).

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `millanee.github.io` |

After GitHub reports the HTTPS certificate as issued, turn on **Enforce HTTPS** in the Pages settings.

## Local preview

From the repository root:

```bash
python3 -m http.server 8080
```

Open `http://127.0.0.1:8080/` and `http://127.0.0.1:8080/de/`.
