const path = require( 'path' );
const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

// Date logic falls back to the machine timezone (Intl.DateTimeFormat), so
// date-window tests only pass in UTC. Pin it to match CI on any machine.
process.env.TZ = 'UTC';

module.exports = {
	...baseConfig,
	rootDir: path.join( __dirname, '..' ),
	moduleNameMapper: {
		...baseConfig.moduleNameMapper,
		// Stub CSS imports (e.g. `@automattic/ui/style.css` pulled in via
		// widgets-toolkit, or local `*.module.css`). jest's transformIgnorePatterns
		// skips nested node_modules CSS, so it would otherwise be parsed as JS.
		'\\.css$': path.join( __dirname, 'style-stub.cjs' ),
		// Resolve internal `packages/*` imports to their TypeScript source.
		'^@jetpack-premium-analytics/(.*)$': path.join( __dirname, '..', 'packages', '$1', 'src' ),
	},
};
