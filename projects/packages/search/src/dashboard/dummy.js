/**
 * Dummy file used by the Storybook Vite plugin (`search-dashboard-modules`)
 * to resolve bare `components/` and `store` imports relative to the dashboard
 * directory.
 *
 * The plugin intercepts imports like `import { STORE_ID } from 'store';` in
 * dashboard components and resolves them as `./store` relative to this file's
 * location, so they correctly point to `src/dashboard/store/index.js`.
 *
 * See: projects/js-packages/storybook/storybook/main.js
 */
