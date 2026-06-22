// List of projects paths that contains stories
// When adding something here, also add the project slug to .extra.dependencies.build in composer.json.
import path from 'node:path';

const basedir = path.join( import.meta.dirname, '../../../..' );

export const projects = [
	'projects/js-packages/ai-client/src',
	'projects/js-packages/charts/src',
	'projects/js-packages/components/components',
	'projects/js-packages/connection/components',
	'projects/js-packages/idc/components',
	'projects/js-packages/scan/src',
	'projects/js-packages/social-logos/src/react',
	'projects/packages/my-jetpack/_inc/components',
	'projects/packages/premium-analytics/packages',
	'projects/packages/premium-analytics/widgets',
	'projects/packages/publicize/_inc/components',
	'projects/packages/search/src/dashboard/components',
	'projects/packages/videopress/src/client/admin/components',
	'projects/packages/videopress/src/client/block-editor',
	'projects/packages/videopress/src/client/components',
	'projects/plugins/boost/app/assets/src/js',
	'projects/plugins/jetpack/extensions/',
	'projects/plugins/protect/src/js/components',
].map( project => path.join( basedir, project ) );
