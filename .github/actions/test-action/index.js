const glob = require( 'glob' );
const fs = require( 'fs' );

const projects = [];
const composerFiles = glob.sync( process.env.GITHUB_WORKSPACE + '/projects/*/*/composer.json' );
composerFiles.forEach( file => {
	const json = JSON.parse( fs.readFileSync( file ) );
	if (
		! file.includes( 'changelogger' ) &&
		( json.require[ 'automattic/jetpack-changelogger' ] ||
			json[ 'require-dev' ][ 'automattic/jetpack-changelogger' ] )
	) {
		projects.push( file.split( '/' ).slice( -2 )[ 0 ] );
	}
} );

console.log( composerFiles );
console.log( projects );
