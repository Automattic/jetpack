// List of projects paths that contains stories
// When adding something here, also add the project slug to .extra.dependencies.build in composer.json.
const path = require( 'path' );

const projects = [
	'../../components/components',
	'../../connection/components',
	'../../idc/components',
	'../../../packages/my-jetpack/_inc/components',
	'../../../plugins/protect/src/js/components',
	'../../../packages/videopress/src/client/admin/components',
];

module.exports = projects.map( project => path.join( __dirname, project ) );
