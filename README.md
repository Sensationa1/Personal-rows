# Xperience Streaming Platform Rows — v3

## What was wrong with the last v2 pack?

The previous *expanded* combined collection used unrelated Xperience catalogs like `genre_scifi_series` and `world_ko_popular_series` inside branded folders. Those lists were **not restricted to Netflix, Disney+, etc.**, so the folder displayed generic titles and generic source names. It did not include a separately importable Home rows pack.

This package fixes that misunderstanding by keeping **service-specific original rows only** in the reliable collection, and by supplying **48 genuinely service-filtered, custom TMDB rows** as a separate Stremio-compatible catalog add-on.

## Included files

- `tmdb_addon/`: New, independent, Vercel-ready Stremio catalog add-on with **48 distinct TMDB discovery catalogs** (6 per service). No external npm dependencies. This does **not** modify your working Top 10 Vercel add-on. Requires `TMDB_API_KEY` on Vercel.
- `collections/01_import_first_service_only.collection.json`: **Reliable collection** using the same eight original Xperience service folders, unchanged artwork and their original service-specific source IDs, **without** the generic Sci-Fi/genre/region catalog bleed.
- `collections/02_experimental_combined_with_curated_rows.collection.json`: All eight service tiles with the 48 new source IDs appended. **Important: Xperience might rehost imported addon rows and assign different IDs. If so, the custom sources in this JSON WILL NOT resolve and must be relinked in Step 3.** Test on a duplicate profile. This is a source-mapping *template*, not a guaranteed one-click import.
- `collections/03_all_14_services_original_artwork.collection.json`: Original 14 streaming service tiles unchanged (includes the six services not part of this project).
- `mapping/catalog_to_folder.csv`: Exactly which custom rows belong to which folders, for linking after Step 2.
- `mapping/catalog_to_folder.json`: Machine-readable mapping.

## Setup: correct order

1. **Deploy `tmdb_addon/` as a NEW Vercel project**. Do not upload it over your existing Top 10 add-on. Set environment variable `TMDB_API_KEY` to your own TMDB v3 API key **or** long v4 read-access token. Deploy and open `https://YOUR-NEW-PROJECT.vercel.app/manifest.json`; it must list 48 catalogs. Do not paste the key into the public URL or source file.
2. In **Xperience → your profile → Step 2: Home rows → Import from another add-on**, paste **that hosted `manifest.json` URL**. All 48 rows can then be configured like other imported add-on rows. You can mark the imported rows **Hidden** so they don't clutter the main Home while remaining available as collection sources. Xperience's plan/row limits still apply.
3. In **Step 3: Collections → Import**, first use `01_import_first_service_only.collection.json`. This restores your branded combined eight-service folder and works with the original Xperience-specific catalog IDs. Verify artwork/tiles/content.
4. In **Step 3**, open each service folder and **add its six imported rows** using the exact titles in `mapping/catalog_to_folder.csv`. This creates the desired expanded catalog tabs/rows (depending on the selected Nuvio collection layout). Once imported into Xperience, catalog IDs **may be rewritten**, so manual assignment via the picker is the safe procedure.
5. Optional: test `02_experimental_combined_with_curated_rows.collection.json` on a **duplicate profile only**, after importing the addon. If it resolves, it saves the manual linking; if not, revert and use the reliable collection plus source picker. Do not blindly replace your working collection.
6. **Step 4: Push the full Xperience add-on/config to Nuvio; push collections too; restart Nuvio**. If Xperience rehosted a catalog but Nuvio still shows generic “Movie/Series” tabs, push again before troubleshooting catalog mapping.

## Regions and truth-in-labeling

- Netflix, Apple TV+, Prime Video, HBO Max and Disney+ rows filter to **FI** subscription watch availability, using TMDB/JustWatch data.
- Hulu and Paramount+ rows filter to **US**, and BritBox rows filter to **GB** (because these are market-specific services and catalog sizes differ by country). These results are **not a promise of Finnish streaming availability**.
- Genres are combined with a service provider filter. For example, Netflix `Korean Series` means Korean-language titles **on Netflix**, not all Korean shows.
- Rows are **TMDB-based discovery**, not official, proprietary Netflix/Disney+ rankings. We deliberately do *not* call them an official “Top 10.” The original Xperience Top 10 rows remain in your folder.
- If your locale differs, change `PLATFORM_REGION_NETFLIX`, `PLATFORM_REGION_APPLE`, `PLATFORM_REGION_HBO`, `PLATFORM_REGION_PARAMOUNT`, etc., in the deployed project's environment variables.
- TMDB uses JustWatch provider data, which may lag real services; include JustWatch attribution where you redistribute availability information.

## Important scope limits

- Importing just a **collections JSON** does **not** magically create new custom Home rows in Step 2.
- The source folder can show sources as separate **tabs/rows** depending on collection view; it cannot clone an entire Netflix-style app UI.
- The add-on is source-tested with mocked TMDB responses, but it has **not been live-deployed or checked against your private Xperience profile**, so the external-row remapping needs one real import test.
- All artwork URLs are retained from your own exported Xperience collection. No logos or font files bundled.

## Testing

From `tmdb_addon/`: `npm test` (uses Node 18+, no dependency install required).
