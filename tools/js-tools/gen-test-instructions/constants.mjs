/**
 * Shared constants for the gen-test-instructions pipeline.
 *
 * Everything in this module is configuration that's referenced from at least
 * two stage modules (entrypoint, runners, plan renderer). Stage-specific
 * regex/keyword tables live in the stage module that uses them (see
 * classify.mjs for environment + signal heuristics).
 */

export const GITHUB_REPO = 'Automattic/jetpack';

export const CLAUDE_MODEL = 'claude-opus-4-7[1m]';
export const CLAUDE_EFFORT = 'xhigh';
export const CODEX_MODEL = 'gpt-5.5';
export const CODEX_EFFORT = 'xhigh';

export const SUPPORTED_AI_PROVIDERS = [ 'claude', 'codex' ];

export const SUPPORTED_PIPELINES = [ 'loop', 'single' ];

export const DEFAULT_MAX_REVIEWER_ITERATIONS = 3;

// Exit code emitted when the loop pipeline finishes with unresolved decisions
// in --non-interactive mode. Distinct from existing fatal exit (1) so CI can
// distinguish "needs a human" from "tool crashed".
export const EXIT_CODE_DECISIONS_PENDING = 3;

// Canonical "Before you start" preamble — kept in sync with the in-repo to-test.md
// of the most recent release (currently 15.8). Emitted verbatim by the renderer so
// the AI never has to regenerate it.
export const BEFORE_YOU_START = `- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.
- You may need to connect Jetpack to a WordPress.com account to test some features; find out how to do that [here](https://jetpack.com/support/getting-started-with-jetpack/).
- Blocks in beta status require a small change for you to be able to test them. You can do either of the following:
  - Edit your \`wp-config.php\` file to include: \`define( 'JETPACK_BLOCKS_VARIATION', 'beta' );\`
  - Or add the following to something like a code snippet plugin: \`add_filter( 'jetpack_blocks_variation', function () { return 'beta'; } );\``;
