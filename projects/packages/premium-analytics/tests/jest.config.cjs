const path = require( 'path' );
const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );
// Shared with the guard test in `js/test-groups.test.ts`, so the two can never
// disagree about which suites a group claims.
const { GROUPS_DIR, groupedMemberFiles } = require( './group-members.cjs' );

const rootDir = path.join( __dirname, '..' );

const escapeRegExp = value => value.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );

// Grouping is opt-in so that targeting a suite directly (`jest widgets/top-posts`)
// keeps working, and so a confusing grouped failure can be re-run in isolation.
// A positional argument filters tests, so keep that established workflow isolated too.
const hasTestFilter = process.argv.slice( 2 ).some( argument => ! argument.startsWith( '-' ) );
const useGroups =
	process.env.PA_TEST_GROUPS === '1' && process.env.PA_NO_GROUPS !== '1' && ! hasTestFilter;

// Whichever mode is active, the other side's files must be ignored — otherwise the
// grouped suites and their members would both run and every test would count twice.
const groupingIgnorePatterns = useGroups
	? groupedMemberFiles().map( file => `^${ escapeRegExp( file ) }$` )
	: [ `^${ escapeRegExp( GROUPS_DIR ) }/` ];

module.exports = {
	...baseConfig,
	rootDir,
	testPathIgnorePatterns: [ ...baseConfig.testPathIgnorePatterns, ...groupingIgnorePatterns ],
	moduleNameMapper: {
		...baseConfig.moduleNameMapper,
		// Stub CSS imports (e.g. `@automattic/ui/style.css` pulled in via
		// widgets-toolkit, or local `*.module.css`). jest's transformIgnorePatterns
		// skips nested node_modules CSS, so it would otherwise be parsed as JS.
		'\\.s?css$': path.join( __dirname, 'style-stub.cjs' ),
		// Resolve internal `packages/*` imports to their TypeScript source.
		'^@jetpack-premium-analytics/(.*)$': path.join( __dirname, '..', 'packages', '$1', 'src' ),
	},
};
