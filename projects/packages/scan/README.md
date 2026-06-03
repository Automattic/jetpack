# Scan UI for Jetpack

This package hosts the wp-admin Scan UI for the Jetpack plugin. It
ports Calypso's Scan dashboard (`client/dashboard/sites/scan/`) onto a
native wp-admin page so customers see active threats, scan history, and
the fix / ignore / view-details flows without leaving their site.

The package mirrors the architecture of `projects/packages/activity-log/`
and `projects/packages/backup/`: a TanStack Query data layer, a hash
router, an `AdminPage` shell, and `@wordpress/dataviews` lists.

## Architecture

- `src/class-jetpack-scan.php` — wp-admin submenu under Jetpack
  (`?page=jetpack-scan`), asset enqueue, REST registration.
- `src/class-initial-state.php` — `JPSCAN_INITIAL_STATE` hydration global.
- `src/class-rest-controller.php` — `jetpack/v4/site/scan/*` bridges
  proxied to WPCOM via the site's Jetpack connection.
- `src/js/admin.tsx` — `createHashRouter` + `RouterProvider`.
- `src/js/shell.tsx` — `AdminPage` chrome + `HeaderActionsProvider` +
  `Outlet`.
- `src/js/providers.tsx` — `QueryClient` + `ThemeProvider`.
- `src/js/gates.tsx` — connection / capabilities gates with mock-mode
  short-circuit.

## Mock mode

Append `?jps-mock=1` to the wp-admin URL to short-circuit every gate
and render the overview against fixtures. No server requests are made.
