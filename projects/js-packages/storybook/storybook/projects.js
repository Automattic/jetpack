// List of projects paths that contains stories
const path = require( 'path' );

const projects = [
	'../../base-styles',
	'../../components/components',
	'../../connection/components',
	'../../idc/components',
	'../../../packages/my-jetpack/_inc/components',
];

module.exports = projects.map( project => path.join( __dirname, project ) );
