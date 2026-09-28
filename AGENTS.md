<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

- Keep Pineapple Note as a responsive single-screen study dashboard; it keeps the primary learning workflow immediately accessible.
- Use the uploaded Pineapple Note logo as the canonical brand asset and derive the favicon from it; this preserves brand consistency.
- Keep PWA support manifest-only unless offline behavior is explicitly requested; this avoids stale preview caches.
- Keep the study dashboard at `/dashboard` behind the managed authenticated layout; public account flows live at `/auth` and `/reset-password`.
