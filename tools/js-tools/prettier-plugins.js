// Used by the root-level .prettierrc.js to find the plugin installed in this subdirectory,
// so we don't have to clutter the repo root with the dep.
module.exports = [ require.resolve( 'prettier-plugin-svelte' ) ];
