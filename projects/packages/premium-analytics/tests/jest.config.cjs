const fs = require( 'fs' );
const path = require( 'path' );
const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

const rootDir = path.join( __dirname, '..' );
const groupsDir = path.join( rootDir, 'widgets', '__groups__' );

/**
 * Test files pulled in by a group file (see widgets/__groups__/README.md).
 *
 * The group files omit extensions, so each path is resolved to the real file
 * before it can be matched against the paths jest hands testPathIgnorePatterns.
 *
 * @return {string[]} Absolute paths of grouped member suites.
 */
function groupedMembers() {
	if ( ! fs.existsSync( groupsDir ) ) {
		return [];
	}
	return fs
		.readdirSync( groupsDir )
		.filter( name => name.endsWith( '.test.tsx' ) )
		.flatMap( name => {
			const source = fs.readFileSync( path.join( groupsDir, name ), 'utf8' );
			return [ ...source.matchAll( /^import '([^']+)';$/gm ) ]
				.map( match => path.resolve( groupsDir, match[ 1 ] ) )
				.map( member => [ '.tsx', '.ts' ].map( ext => member + ext ).find( fs.existsSync ) )
				.filter( Boolean );
		} );
}

const escapeRegExp = value => value.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );

// Grouping is opt-in so that targeting a suite directly (`jest widgets/top-posts`)
// keeps working, and so a confusing grouped failure can be re-run in isolation.
const useGroups = process.env.PA_TEST_GROUPS === '1' && process.env.PA_NO_GROUPS !== '1';

// Whichever mode is active, the other side's files must be ignored — otherwise the
// grouped suites and their members would both run and every test would count twice.
const groupingIgnorePatterns = useGroups
	? groupedMembers().map( file => `^${ escapeRegExp( file ) }$` )
	: [ `^${ escapeRegExp( groupsDir ) }/` ];

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
