# Drovexis Studios Website v10

Official static website for Drovexis Studios, designed for GitHub Pages and `drovexis.com`.

## What's included
- Detailed Drovexis Studios homepage
- Gridline Empire spotlight using the live App Store icon
- Dedicated Gridline Empire page
- Studio overview and development section
- One released game + two unnamed projects in development
- Facebook, Instagram, X and business email links
- Support and Privacy pages
- Search-engine metadata, sitemap, robots.txt and structured data
- Responsive desktop/mobile layout

## v10 changes
- Homepage is a studio showcase: games shown as an equal three-card lineup (Gridline Empire + two classified projects)
- Classified project cards with a tap-to-decrypt animation (always ends in "access denied")
- Animated canvas backgrounds: drifting embers on the homepage, a live power grid on the Gridline page; both react to the mouse/finger
- 3D tilt and glare on cards and the Gridline icon (mouse only)
- "Power the City" browser mini game on the Gridline page
- Animations pause off-screen and respect the reduced-motion setting

## v9 changes
- Gridline Empire page hero now uses the App Store icon (blurred icon background + large icon)
- Mobile menu added to Gridline Empire, Support and Privacy pages
- Fixed the broken "About" link on the Support page
- Page content stays visible if scripts fail to load
- Images converted to WebP (about 90% smaller); small favicon and Apple touch icon added
- New share images for links posted on social media
- Inter font now actually loads; unused styles removed

## Updating GitHub Pages
Upload the **contents of this folder** to the root of the `Drovexis/drovexis-site` repository. Do not upload the ZIP itself and do not wrap the files in an `mnt` folder.

Important root files include `index.html`, `gridline-empire.html`, `styles.css`, `script.js`, `sitemap.xml`, `robots.txt`, `CNAME`, and the `assets` folder.

After committing changes to `main`, GitHub Pages should redeploy automatically.
