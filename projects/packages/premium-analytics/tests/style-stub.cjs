// Empty stand-in for CSS imports (e.g. `@automattic/charts/style.css` pulled in via
// externals, or local `*.module.css`). jest's transformIgnorePatterns
// skips nested node_modules CSS, so without this stub it would be parsed as
// JavaScript and throw.
module.exports = {};
