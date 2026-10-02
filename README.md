# Drovexis Studios Website

A static, mobile-friendly first version of **drovexis.com** built for GitHub Pages.

## Included

- Cinematic Drovexis Studios homepage
- Gridline Empire feature with App Store link
-  and Online RPG development cards
- About / studio values
- Latest updates section
- Facebook + Instagram + email links
- Support page
- Website privacy page
- Responsive mobile navigation
- Basic SEO / Open Graph metadata
- `CNAME`, `robots.txt`, `sitemap.xml`, and `404.html`

## Before publishing

1. **Confirm your business email aliases.** The site currently uses:
   - `contact@drovexis.com`
   - `support@drovexis.com`
   If you use different addresses, replace them in `index.html`, `support.html`, and `privacy.html`.

2. **Add your X profile.** Search `index.html` for the sentence about X and replace it with a button once your final X username is confirmed.

3. **Review the privacy page.** It is a basic website privacy notice, not a substitute for the game-specific privacy policies used by your apps.

## Publish with GitHub Pages

1. Create a new GitHub repository (for example `drovexis-site`).
2. Upload everything in this folder to the repository root.
3. Open the repository on GitHub → **Settings → Pages**.
4. Under **Build and deployment**, publish from your main branch/root folder.
5. In **Custom domain**, enter `drovexis.com` and save it.
6. In Porkbun DNS, point the apex/root domain to GitHub Pages using the current GitHub Pages A records:
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`
7. For `www`, add a CNAME that points to your GitHub Pages default domain (`YOUR-GITHUB-USERNAME.github.io`).
8. Do **not** remove your Google Workspace MX, SPF, DKIM, or other email records. Website DNS and email DNS can coexist.
9. Once GitHub confirms the domain, enable **Enforce HTTPS**.

GitHub notes that DNS changes can take up to 24 hours to propagate.

## Important DNS note

The website needs A/CNAME records. Your email needs MX/TXT records. Do not delete the Google Workspace mail records when adding the website records.

## Local preview

You can open `index.html` directly in a browser, or run a local web server from this folder.
