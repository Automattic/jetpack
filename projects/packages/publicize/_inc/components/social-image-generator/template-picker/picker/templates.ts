import { getSocialScriptData } from '../../../../utils';

// Template thumbnails live in the package's shared `_inc/assets/` tree
// (copied to `build/assets/` by `webpack.config.js` for the legacy bundle
// and emitted by `wp-build` for the chassis) and are resolved at runtime
// via `assets_url`. Importing them as `.jpg` modules works in the webpack
// bundle but breaks the chassis esbuild pipeline, which has no binary
// loader configured — keeping the URL-string indirection keeps both
// bundlers happy.
const templateUrl = ( name: string ) =>
	`${ getSocialScriptData()?.assets_url ?? '' }assets/sig-templates-${ name }.jpg`;

type Template = {
	name: string;
	label: string;
	image: string;
};

const TEMPLATES: Template[] = [
	{ name: 'highway', label: 'Highway', image: templateUrl( 'highway' ) },
	{ name: 'dois', label: 'Dois', image: templateUrl( 'dois' ) },
	{ name: 'edge', label: 'Edge', image: templateUrl( 'edge' ) },
	{ name: 'fullscreen', label: 'Fullscreen', image: templateUrl( 'fullscreen' ) },
];

export default TEMPLATES;
