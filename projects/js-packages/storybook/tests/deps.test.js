const fs = require( 'fs/promises' );
const path = require( 'path' );

test( 'Dependencies in composer.json (.extra.dependencies.build) match paths in storybook/projects.js', async () => {
	const monorepoBaseDir = path.resolve( __dirname, '../../../..' );
	const projects = require( '../storybook/projects.js' ).map( p =>
		path.relative( monorepoBaseDir, p )
	);
	const projectsJsDeps = new Set();
	for ( const project of projects ) {
		const m = project.match( /^projects\/([^/]+\/[^/]+)/ );
		if ( m ) {
			projectsJsDeps.add( m[ 1 ] );
		}
	}

	const composerJson = JSON.parse(
		await fs.readFile( path.join( __dirname, '../composer.json' ), { encoding: 'utf8' } )
	);
	const composerJsonDeps = new Set( composerJson.extra?.dependencies?.build );

	expect( composerJsonDeps ).toEqual( projectsJsDeps );
} );
