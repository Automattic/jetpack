// List of projects paths that contains stories
const path = require( 'path' );

const join = relative => path.join( __dirname, relative );

const projects = [
	join( '../../base-styles' ),
	join( '../../components/components' ),
	join( '../../connection/components' ),
	join( '../../idc/components' ),
	join( '../../../packages/my-jetpack/_inc/components' ),
];

module.exports = projects;
