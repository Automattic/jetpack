# wp-build Porting Checklist

A checklist for moving a Jetpack admin dashboard onto the wp-build (esbuild) pipeline. Several dashboards have been ported — `git ls-files 'projects/*/*/routes/*/package.json' | cut -d/ -f1-3 | sort -u` lists the projects that have them. Some are still behind a flag that is off for customers, Boost and Backup among them. Every item below traces to a trap one of those ports hit.

The rule for a port is **move the frame, keep the UI**. wp-build changes the chassis: the rounded frame, the corner radius, the single-page layout container. Nothing else should differ — no spacing, type scale, colour, copy, control behaviour, or reachable state. The one accepted exception is a uniform 8px inset from boot's stage gutter (My Jetpack, [#52204](https://github.com/Automattic/jetpack/pull/52204)).

Ship the port behind a `Feature_Flags` flag named `<product>-wp-build`, default off, comparable against trunk with the flag off. See [`projects/packages/feature-flags/README.md`](../projects/packages/feature-flags/README.md); each flag can be forced on through `jetpack_feature_flag_enabled_<flag>`. Several shipped ports still gate on a bare `rsm_jetpack_ui_modernization_*` filter — that is the older pattern, not the one to copy. Retire the flag and delete the legacy bundle in a prompt follow-up — see [Retire the port](#10-retire-the-port-promptly), not later.

## 1. Project wiring — first route in a project only

Skip this section if the project already has a `routes/` directory.

- [ ] Add `@wordpress/build` and `browserslist` to `package.json`. `browserslist` is an unmet peer of `browserslist-to-esbuild` and fails `pnpm install` without it.
- [ ] Add the polyfills package to **both** manifests. `automattic/jetpack-wp-build-polyfills` in `composer.json` supplies the `WP_Build_Polyfills::register()` that §3 calls; `@automattic/jetpack-wp-build-polyfills` in `package.json` supplies the `stamp-textdomains`, `provide-boot-asset-file` and `strip-unminified-prod` bins the next bullet chains.
- [ ] Add the three chained build scripts, not just `build:wp-build`:
  - `build:stamp-textdomains`, after `wp-build` in `build`. It emits `build/i18n-manifest.json`. Skip it and the dashboard still renders — in English only, no error. This is what the AI Hub port shipped first.
  - `build:boot-asset` (`provide-boot-asset-file`).
  - `build:strip-unminified-prod`, chained into `build-production`.
- [ ] Add a root `tsconfig.json` extending `jetpack-js-tools/tsconfig.base.json`, with `./packages/*/src` and `./routes/**/*` in `include`, plus a `typecheck` script (`tsgo --noEmit`). esbuild reads the tsconfig for bare-specifier `paths`, so a port can fix the build and still type-check nothing — the same AI Hub port skipped two real type errors in `stage.tsx` this way. The root `pnpm run typecheck` only runs projects that define the script.
- [ ] If the project's `jest.config.js` sets `roots`, add `<rootDir>/packages` and `<rootDir>/routes`. The `packages/init` module ships a test; without this it is never collected, and `--passWithNoTests` reports nothing.
- [ ] Add a `wpPlugin` namespace block. Without one, generated PHP takes wp-build's `gutenberg_` prefix and collides with the Gutenberg plugin.
- [ ] Add a `packages/init` module. It supplies `jetpackConfig`, which webpack declares as an external and esbuild cannot, and loads the i18n catalogs.
- [ ] Add `.gitattributes` entries: `routes/**`, `packages/**` and `/build/**/*.map` as `production-exclude`, and `build/**` as `production-include`. Without the excludes the route and init sources ship to the mirrors next to the bundle. The include is needed because `build/` is gitignored, so a project whose webpack output lived elsewhere never ships its wp-build output without it.

## 2. Sass and bare imports

Bare specifiers only resolve under webpack's `resolve.modules`. esbuild has no equivalent.

- [ ] Convert bare `@use "scss/variables"` imports to relative paths. Search had 14 files using bare imports that only worked through `webpack.dashboard.config.js`; esbuild's sass plugin fails outright ([#52416](https://github.com/Automattic/jetpack/pull/52416)).
- [ ] Same for bare JS specifiers. Fix with a scoped `tsconfig.json` `paths` entry rather than rewriting every import (Search had ~90).
- [ ] Check every stylesheet the ported route pulls in for selectors scoped to the legacy mount's `id` (e.g. `#jp-search-dashboard`). Boot mounts elsewhere, so a rule scoped that way silently stops applying. Search's hero heading rendered at 26px instead of 36px this way — a wrapper `font-size` every `em` resolved against — until `stage.tsx` was made to render the same wrapper the legacy entry used ([#52416](https://github.com/Automattic/jetpack/pull/52416)).
- [ ] Import each route's stylesheet from its `stage.tsx`. wp-build bundles only what the stage imports: `@wordpress/build` 0.23 records whether `route.scss` exists (`hasStyle` in `lib/route-utils.mjs`) and then never reads that flag, so a `route.scss` sitting next to `stage.tsx` does nothing until `stage.tsx` has `import './route.scss'`. Search's port shipped without its wp-build layout mixin this way, until [#52507](https://github.com/Automattic/jetpack/pull/52507).
- [ ] Put layout that several routes share in a mixin every route includes. Each route bundles only its own imports, so a rule in one route's stylesheet is missing when another route is loaded directly. Backup guards this with a test (`projects/packages/backup/tests/route-styles-include-admin-shell.test.ts`).
- [ ] Correct any `@return {import('react').Component}` JSDoc on components the route imports. With `allowJs`, TypeScript reads the annotation over inference and rejects the component as a JSX element (`TS2786`), with the error landing at the usage site in `stage.tsx`, not the `.jsx` file it belongs to. Fix only the annotations the gate flags — ~53 exist across the monorepo and nothing type-checks `.jsx`, so a sweep ships unverified.

## 3. Loader

- [ ] Load `build/build.php` and register wp-build's polyfills before both deadlines: the generated enqueue check on `admin_enqueue_scripts`, and the page render callback. `admin_menu` priority 1 is one way to satisfy this — needed when the project picks its menu callback at registration time (VideoPress, My Jetpack). A project that keeps one `render()` and branches inside it has no ordering requirement, because both deadlines fall after `admin_menu` completes. Search's menu priority is 1 on Jetpack sites but overridden to 100000 by the wpcom subclass on Simple, where priority 1 isn't available — and isn't needed there either.
- [ ] Gate loading on the page slug, so polyfills never replace core scripts on any other admin screen. See `Jetpack_Backup::is_backup_admin_request()` (`projects/packages/backup/src/class-jetpack-backup.php:1305`).
- [ ] After `require_once build/build.php`, call `<prefix>_register_script_modules()` **directly**. wp-build hooks module registration to `wp_default_scripts`, which has already fired by `admin_menu`.
- [ ] Give the route a page id different from the menu slug, or the generated standalone `page.php` intercepts `admin_init` for that slug and exits, bypassing wp-admin's chrome.

## 4. Alias the screen ID, and restore it

wp-build's generated enqueue callback only fires when the screen ID equals the route's page id. The WP-admin menu slug stays the product's real slug, so the loader mutates `get_current_screen()->id` in place to make the check pass.

- [ ] Alias the screen ID on `admin_enqueue_scripts`, immediately before `load_wp_build()` registers the generated check, at the same priority.
- [ ] **Restore the real screen ID immediately after**, on another `admin_enqueue_scripts` callback at the same priority. Every hook after the generated check reads the screen ID and needs the real one — notably JITM's message path, built on `admin_notices` (`JITMS\JITM::get_message_path()`).

  **Seven ports shipped this without the restore**: Backup, Newsletter, Social, VideoPress, Activity Log, Podcast and SEO (all fixed in [#52471](https://github.com/Automattic/jetpack/pull/52471)). Boost hit the same bug separately and was fixed in [#52406](https://github.com/Automattic/jetpack/pull/52406). The old pattern hooked the alias on `current_screen` with no restore, which also leaked the aliased ID into Core's `pagenow` JS global — `wp-admin/admin-header.php` prints `pagenow` from `$current_screen->id` before it fires `admin_enqueue_scripts`, so an alias scoped to `admin_enqueue_scripts` never reaches it. See the diff in `projects/packages/backup/src/class-jetpack-backup.php` around `alias_screen_id_for_wp_build()` / `restore_screen_id_after_wp_build()` for the fixed shape to copy.
- [ ] Do not add a `$screen` parameter to either callback. Both read `get_current_screen()` themselves, so `add_action()` can hook them with no arguments and the ordering stays obvious at the call site.

A shared helper for this pair does not exist yet (tracked as JETPACK-2689) — write the alias/restore pair per package, following the shape in `class-jetpack-backup.php`.

## 5. JITMs

Two independent failure modes. Fixing one does not fix the other.

- [ ] **Visibility.** The generated page template hides every direct child of `#wpbody-content` except the app root. A JITM placeholder rendered outside the app is invisible. Render `#jp-admin-notices` **inside** the app tree, in the page shell — see Social's `social-page.tsx` or Boost's `boost-page.tsx` — or opt the screen out of JITMs on purpose (next item). Don't leave a page with neither: that renders a JITM nobody can see.
- [ ] Put the container outside every tab panel and route. `Tabs.Panel` defaults to `keepMounted={ false }`, so a container inside one leaves the DOM on a tab switch and takes the card JITM moved into it. [#52471](https://github.com/Automattic/jetpack/pull/52471) moved Social's container into the page shell for this reason.
- [ ] Decide the same question for the Safe Mode (IDC) banner. The connection package prints `#jp-identity-crisis-container` on `admin_notices` as a direct child of `#wpbody-content` (`identity-crisis/class-ui.php`), so the template hides it too. Point `identity_crisis_container_id` at an element inside the app, as My Jetpack does (`my-jetpack/src/class-initializer.php`), or decide on purpose that the page never shows the banner.
- [ ] **View-fetch is not view-display.** JITM records a view when a message is *fetched* (`class-post-connection-jitm.php:378`, `jitm_view_client`), not when it is shown. Restoring the real screen ID (§4) makes the dashboard fetch messages at its real path again. If nothing renders `#jp-admin-notices`, that silently logs views for cards nobody saw. Newsletter, VideoPress, Activity Log, Podcast, and SEO all hit this the moment their screen ID was restored, and were opted out with `jetpack_display_jitms_on_screen` ([#52471](https://github.com/Automattic/jetpack/pull/52471)). Match the opt-out filter's screen-id argument to the exact screen ID the page's menu registration returns.

## 6. Initial state

- [ ] Do not use `wp_localize_script` to pass PHP state to the ported page. wp-build pages load as ES modules, and `wp_localize_script` cannot attach data to them. Use the shared `jetpack_admin_js_script_data` filter instead — see the comment on `inject_script_data()` in `projects/packages/seo/src/class-admin-page.php:201-212`. Prefer an `apiFetch` preload for per-tab data over injecting a raw payload: a preload lets the app re-fetch if it's ever missing or stale, where a one-shot injected payload dead-ends on a load error.
- [ ] Pass `apiRoot` and `apiNonce` to `<AdminPage>`. Both default to `''` and feed `restApi.setApiRoot()` — omitting either breaks every `@automattic/jetpack-api` call with no visible error, because `restApi` builds `${ apiRoot }jetpack/v4/…`, which then resolves against `/wp-admin/` and 404s. `@wordpress/api-fetch` has its own root and is unaffected.
- [ ] Load the i18n catalogs from the init module and enqueue `wp-jp-i18n-loader`. esbuild externalizes `@wordpress/i18n` without loading a catalog. This shipped ~74% of strings untranslated across seven dashboards before [#50762](https://github.com/Automattic/jetpack/pull/50762) fixed those seven. SEO, Podcast and Scan were not among them: none has a `packages/init` module, a `build:stamp-textdomains` script or a `wp-jp-i18n-loader` enqueue, so their own strings still ship untranslated. Copy Backup or Search here, not SEO — the first bullet in this section cites SEO's `class-admin-page.php`, which carries the gap.
- [ ] Move everything the legacy entry does besides mounting the app — store registration, providers, globals — into `stage.tsx`, above the screen component. The legacy entry file never loads under wp-build, so a side effect it ran at module scope is simply gone. Search's stage registers the Redux store its dashboard reads on mount; Activity Log and Backup mount their `QueryClientProvider` there for the same reason.
- [ ] If the route uses connection-gated data (`<Gates>` and similar), emit `window.JP_CONNECTION_INITIAL_STATE` explicitly. The modernized enqueue path short-circuits before the legacy `Connection_Initial_State::render_script()` call — see `Jetpack_Backup::render_connection_initial_state()` (`projects/packages/backup/src/class-jetpack-backup.php:1171-1175`) for the pattern.

## 7. Assets

- [ ] Move images out of the JS bundle. esbuild has no loader for `.webp` or `.svg` — an imported image fails the build outright rather than silently dropping it, so a successful build with no image imports is itself the evidence you're clear of this. If the project does import images, serve them from a committed `assets/images/` directory and build the URL at runtime from a localized base URL, following `packages/connection` and `packages/licensing` ([#52204](https://github.com/Automattic/jetpack/pull/52204)). Data URIs are the fallback for a small asset only — My Jetpack accepted ~22KB of data-URI SVGs but rejected ~337KB of data-URI illustrations for the same reason.
- [ ] Check every `url()` inside CSS injected by the route. Runtime-injected CSS resolves a relative `url()` against `/wp-admin/`, not the bundle's own location — this is why `js-packages/components` inlines its pricing-table gradient as a data URI instead.
- [ ] `:global` only works inside `*.module.scss`.

## 8. Fallback

- [ ] While the port still has a legacy branch to choose between, gate every call site — submenu registration, enqueue, render — on **one shared predicate**. Three independently-gated call sites drifted apart and blanked the Backup dashboard in [#51436](https://github.com/Automattic/jetpack/pull/51436). `Jetpack_Backup::is_wp_build_dashboard_active()` is the shape to copy.
- [ ] Base that predicate on whether the generated render function actually exists (`function_exists( '<prefix>_..._wp_admin_render_page' )`), not just on the feature flag. `build/` is gitignored, so the render function is absent in an unbuilt checkout and in any release whose wp-build step failed. Every consumer of the modernized surface has to agree on this same check, or the menu falls back to legacy while the enqueue path skips the legacy script — an empty div with no JS.
- [ ] Decide what an unbuilt or failed-build request shows. A port of an existing dashboard has a working legacy page to fall back to — do that (Backup). A brand-new route, which has no legacy page, should render a visible error rather than a blank container.
- [ ] Expect that guarantee to end when the legacy tree does. Once §10 deletes it the port has no fallback left, and the shared predicate goes with it: `Automattic\Jetpack\Search\Dashboard` gates loading on `is_search_admin_request()` plus `file_exists( build/build.php )`, and `render()` on `function_exists()` alone. An unbuilt checkout then renders nothing. My Jetpack and Search both do this today and it is accepted, not a bug ([#52506](https://github.com/Automattic/jetpack/pull/52506)).

## 9. Before opening the PR

Run this verification (JETPACK-2573): one site, one viewport, flag off then flag on.

1. **Flag off first — human.** Confirm the page is byte-identical to trunk before testing flag on. A partially-wired port can blank the page rather than failing closed ([#51436](https://github.com/Automattic/jetpack/pull/51436)).
2. **Diff computed styles and geometry, not screenshots — scriptable.** Compare `#wpbody-content`, the page root, header, footer, `font-family`, and one control's box. A 4px shift is invisible in a screenshot and obvious in a number.
3. **Diff the network panel — scriptable.** Same requests, same status codes. This caught a `design-tokens.css` 404 and a renamed JITM message path in the My Jetpack pilot — both zero-pixel changes.
4. **Load every deep link in a fresh tab, not by clicking through the app — human.** Hash routes bypass the app's own router when they arrive from WordPress.com, support docs, or email.
5. **RTL pass on one route — human.** Confirm the content column isn't clipped under the admin menu. Physical `left`/`right` offsets in `admin-page-layout.scss` did exactly that on an already-ported dashboard, fixed in [#51963](https://github.com/Automattic/jetpack/pull/51963).
6. **Non-default admin colour scheme — human.** The backdrop must follow the menu colour. It went near-black next to a coloured menu on every WordPress.com scheme, fixed in [#51619](https://github.com/Automattic/jetpack/pull/51619).
7. **Delete `build/` and reload — human.** The page must fall back to the legacy screen, never blank. Once the legacy tree is retired (§10), the page renders nothing and this step no longer applies.

None of these steps runs in CI today. Re-run steps 2, 5 and 6 across every ported dashboard after any `@wordpress/boot` version bump: boot 0.21 turned its layout styles into CSS Modules and renamed the classes, which pushed dashboard sidebars below the content on three shipped dashboards ([#52096](https://github.com/Automattic/jetpack/pull/52096)). The other known post-ship regression, RTL clipping ([#51963](https://github.com/Automattic/jetpack/pull/51963)), had nothing to do with boot — it was our own physical CSS properties, and steps 5 and 6 are worth re-running whether or not boot moved.

- [ ] Changelog entries for the project, and for every plugin whose users would notice — see `AGENTS.md` § "User-Facing Changes Outside a Plugin Also Need Plugin Entries".

## 10. Retire the port promptly

A port that ships both the legacy and the wp-build bundle grows every plugin mirror that bundles it. Deleting the legacy tree is part of the port, not a follow-up to schedule later.

- [ ] Once the flag has soaked, retire it in a dedicated follow-up PR — see [#52506](https://github.com/Automattic/jetpack/pull/52506) (Search) and [#52446](https://github.com/Automattic/jetpack/pull/52446) (My Jetpack) for the shape: remove the flag constant and every branch on it, delete the legacy entry point, its webpack config, and its build script, and confirm no other project's script handle depends on the retired one (`git grep` the handle name across `projects/`).
- [ ] Measure the cost of leaving both versions shipped while the flag is off. Search's legacy dashboard alone cost ~735KB per mirror; My Jetpack's unused wp-build output cost ~8.7MB on disk (777KB gzipped) per mirror while its flag was off. Neither is a reason to skip the flag — it's a reason not to leave it flagged for long.
