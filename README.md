# Xperience Platform Homes v4 — Real platform-style English row names

This is the revised version of the previous generic-genre package. It **removes the `Netflix • Action` style prefix**, preserves the artwork already in the Enzo collection, and creates **57 English-labelled catalog rows** based on observed streaming-app headings and hubs.

## What is included

- `tmdb_addon/`: One independent Vercel add-on exposing **eight separate service manifests** plus an optional master manifest.
- `collections/01_combined_original_artwork_safe.collection.json`: Existing 8-tile collection, with original artwork and existing sources. Safe starting point; does **not** automatically add the new catalogs.
- `collections/02_combined_with_57_rows_EXPERIMENTAL.collection.json`: Eight branded folders + all 57 new source references, using separate service manifest addon IDs. **May require relinking** after Xperience import.
- `collections/03_combined_master_manifest_EXPERIMENTAL.collection.json`: Alternative for importing the combined `/manifest.json` rather than eight separate manifests. **May require relinking**.
- `mapping/catalog_to_folder.csv`: source IDs, folder names, English row titles, approximation type.

**Deploy `tmdb_addon/` as its own Vercel project**; don't overwrite your working Top 10 project. Set environment variable `TMDB_API_KEY` in Vercel Production settings and redeploy. All row names are inside `catalogs.json`, without `•` separators or duplicated service prefix.

## Manifest links after deployment

Substitute your **actual** Vercel deployment domain for `YOUR-DEPLOYMENT.vercel.app`:

| Service | Stremio manifest | Rows |
|---|---|---:|
| Netflix | `https://YOUR-DEPLOYMENT.vercel.app/netflix/manifest.json` | 7 |
| Apple TV+ | `https://YOUR-DEPLOYMENT.vercel.app/apple-tv/manifest.json` | 7 |
| Prime Video | `https://YOUR-DEPLOYMENT.vercel.app/prime-video/manifest.json` | 7 |
| HBO Max | `https://YOUR-DEPLOYMENT.vercel.app/hbo-max/manifest.json` | 7 |
| Hulu | `https://YOUR-DEPLOYMENT.vercel.app/hulu/manifest.json` | 7 |
| Disney+ | `https://YOUR-DEPLOYMENT.vercel.app/disney-plus/manifest.json` | 8 |
| BritBox | `https://YOUR-DEPLOYMENT.vercel.app/britbox/manifest.json` | 7 |
| Paramount+ | `https://YOUR-DEPLOYMENT.vercel.app/paramount-plus/manifest.json` | 7 |

The optional all-at-once manifest is `/manifest.json` (57 rows, but rows like `Trending Now` can have duplicate names across services). **Eight separate manifests are recommended** so the editor can keep service rows grouped.

## Importing into Xperience

1. Back up your existing collection and profile before any imports.
2. Deploy the new `tmdb_addon/` project, or update the old `personal-rows` project with this v4 code (same TMDB API key). **No file in this ZIP is already hosted**.
3. Open each service manifest URL in your browser and check its `catalogs` array. The Netflix manifest should return seven plain English titles (`Trending Now`, `Only on Netflix`, etc.) with no `•` separator.
4. In Xperience **Step 2 → Home rows → Import from another add-on**, import one service manifest at a time. You can hide these rows from your overall Home while keeping their catalogs as collection sources.
5. In **Step 3 → Collections**, import `01_combined_original_artwork_safe.collection.json` and link the new imported rows to their matching service folders using `mapping/catalog_to_folder.csv`. This is the **safe, reliable procedure** because Xperience can assign its own addon/catalog IDs to imported catalogs.
6. The two experimental combined collections may save manual relinking **only if Xperience retains imported add-on IDs**; test on a duplicate profile, not your live one.
7. Push the updated profile/add-on and collection to Nuvio and check a handful of rows before linking the rest.

## Important accuracy limits

**English wording:** Labels come from publicly observed menus, named collections and service-specific hubs wherever available. These streaming providers personalize layouts, change headings, and differ by country/device, so this is **not** a byte-for-byte clone of any one person's live 2026 screen. Some additional category names are clearly marked `editorial` in the mapping. No arbitrary `Netflix • Sci-Fi` prefixes are used.

**Data:** Xperience rows are populated using **TMDB Discovery and its watch-provider availability**, not private streaming service APIs. All 57 catalogs are restricted to the respective service and configured country. These are editorial *approximations* to the actual service's content sections:

- **`Top 10 TV Shows` / `Top 10 Movies` (Apple TV)** show ten titles ordered by **TMDB popularity**, **not official Apple TV rankings**. Do not interpret them as a certified Apple chart.
- **`New Releases`, `New to Disney+`, `Just Added`, `Recently Added`, `Newly Added TV`, etc.** are based on original release dates, **not actual dates those titles joined the provider**.
- **`Only on Netflix`, `Apple Originals`, `HBO Originals`, `Hulu Originals`, etc.** use TMDB network/company filters plus regional subscription availability. This is a **partial approximation** to real first-party original/exclusive catalogs and can omit titles or include co-productions.
- **`Most Recommended`, `Awards & Acclaim`, `Critically Acclaimed`** use TMDB community ratings. They aren't actual platform personalization or verified awards lists.
- **`Trending Now`** uses popular recent TMDB titles with the provider filter; it does not reproduce that service's proprietary live trending algorithm.
- **`Continue Watching`, `My List`, `Because You Watched`, and other personal rows are not fabricated**. TMDB has no access to your provider-specific account history.
- **Platform brand areas** (e.g. Pixar, Marvel, Star Wars, National Geographic) use film studio/network filters where supported and may not include every licensed title in a franchise.

**Regions:** Netflix, Apple TV+, Prime Video, HBO Max and Disney+ default to `FI`; Hulu and Paramount+ default to `US`; BritBox to `GB`. These are search-availability regions, not guarantees of Finnish subscriptions. You can override each with `PLATFORM_REGION_*` variables. All rows limit results to a matched subscription provider—never fallback to unrelated genres.

**Collections:** The combined Xperience JSON represents **folders containing catalog sources**. Depending on your Nuvio collection display mode, these sources can render as a merged folder or as rows/tabs. Importing a collection JSON *does not automatically create Home rows*; import the manifests first.

## Research examples / basis for observed English headings

- Netflix observed `Only on Netflix`, `Trending Now`, `New Releases`, `Popular on Netflix`: https://www.tomsguide.com/news/hbo-max-is-better-than-netflix-in-one-big-way and https://newsatw.com/netflix-review-our-top-choice-in-a-crowded-market/
- Apple TV's Finnish English page observes `Top 10 TV Shows`, `Top 10 Movies`, `New Releases`, `Browse All Apple Originals`, `Great Movies Now on Apple TV`: https://tv.apple.com/fi
- Prime Video's public TV page observes `Popular TV`, `Featured Originals and Exclusives`, `Explore: Latest TV`, `Drama TV`, `Popular with subscriptions`: https://www.primevideo.com/tv
- HBO Max/Max reports `Just Added`, `Awards & Acclaim`, `Trending Now`, `Become an Armchair Detective`, `Drama! Drama! Drama!`: https://www.yahoo.com/entertainment/different-max-hbo-max-210000703.html
- Disney+ observed `New to Disney+`, `Trending` and brand hubs: https://www.afb.org/aw/22/4/17490
- Hulu's actual `Newly Added TV`, `Newly Added Hulu Originals` pages: https://www.hulu.com/hub/newly_added_movies_tv and https://www.hulu.com/hub/newly_added_movies_tv/collections/1420
- BritBox reports `Recently Added`, `Most Recommended`, `Best of ITV`, `Drama`, `Comedy`, `True Stories`: https://www.cordbusters.co.uk/britbox-uk-review/
- Paramount+ reports `Trending Now`, `Paramount+ Originals`, `Hit Movies` and network brand hubs: https://theexplorevenango.com/paramount-on-roku-a-comprehensive-exploration/ and https://www.galaxus.ch/en/page/paramount-review-why-im-not-willing-to-pay-so-much-for-so-little-25836

These sources establish wording observed on particular devices/markets/times; they do **not** validate every row as a live current category for every account.

## Local test

In `tmdb_addon/`, run `npm test`. Tests use mocked TMDB responses and do not validate real provider titles or live Xperience import.
