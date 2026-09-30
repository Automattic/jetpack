/**
 * Stubs the parts of the block editor the comment editor never runs.
 */

import path from 'path';
import webpack from 'webpack';

// Packages and files the comment editor never runs, swapped for stub.cjs. A stub that
// does run breaks the editor, so try the editor after changing this. Preferences loads with it.
const stubs = [
	// Uploads, media processing, site data, commands, the media inserter, dates, color, and math.
	'@wordpress/vips',
	'@wordpress/video-conversion',
	'@wordpress/upload-media',
	'@wordpress/core-data',
	'@wordpress/image-cropper',
	'react-easy-crop',
	'@wordpress/latex-to-mathml',
	'@wordpress/commands',
	'@wordpress/dataviews',
	'@wordpress/date',
	'date-fns',
	'@date-fns/tz',
	'react-day-picker',
	'colorjs.io',
	'postcss',
	'@use-gesture/react',
	'@use-gesture/core',
	// Resizing and the invalid-block comparison, for blocks the comment editor does not offer.
	're-resizable',
	'diff',
	// Sidebar and style controls; the comment editor has no sidebar.
	...[
		'angle-picker-control',
		'border-box-control',
		'border-control',
		'box-control',
		'circular-option-picker',
		'color-palette',
		'color-picker',
		'custom-gradient-picker',
		'date-time',
		'duotone-picker',
		'focal-point-picker',
		'font-size-picker',
		'gradient-picker',
		'modal',
		'navigator',
		'palette-edit',
		'range-control',
		'tabs',
		'tools-panel',
		'unit-control',
	].map( name => `@wordpress/components/build-module/${ name }/index.mjs` ),
	...[
		'background-image-control',
		'block-inspector',
		'block-preview',
		// The toolbar's "⋮" menu: nothing in it suits a comment.
		'block-settings-menu',
		'date-format-picker',
		'dimensions-tool',
		'global-styles',
		'grid',
		'iframe',
		// The "+" buttons: blocks come from the toolbar's menu and "/", which does not use this.
		'inserter',
		'list-view',
		'spacing-sizes-control',
	].map( name => `@wordpress/block-editor/build-module/components/${ name }/index.mjs` ),
	...[ 'advanced', 'background', 'color', 'filters', 'typography' ].map(
		name => `@wordpress/block-editor/build-module/components/global-styles/${ name }-panel.mjs`
	),
	...[ 'constrained', 'flex', 'grid' ].map(
		name => `@wordpress/block-editor/build-module/layouts/${ name }.mjs`
	),
	...[ 'autocomplete', 'combobox', 'searchable-chip-select', 'searchable-select', 'select' ].map(
		name => `@wordpress/ui/build-module/form/primitives/${ name }/index.mjs`
	),
	'@wordpress/ui/build-module/tabs/index.mjs',
	'@wordpress/block-editor/build-module/components/block-tools/empty-block-inserter.mjs',
	// Scrolls the page to keep a moved block in place, which jumps a page with a small editor.
	'@wordpress/block-editor/build-module/components/use-moving-animation/index.mjs',
];
const stubbed = new RegExp(
	`node_modules/(${ stubs.map( stub => stub.replace( /[.]/g, '\\.' ) ).join( '|' ) })(/|$)`
);

export default new webpack.NormalModuleReplacementPlugin( /./, resource => {
	// A relative import is matched by the file it names, so a stub reaches every copy pnpm installed.
	const target = resource.request.startsWith( '.' )
		? path.join( resource.context, resource.request )
		: 'node_modules/' + resource.request;

	if ( stubbed.test( target ) ) {
		resource.request = path.join( import.meta.dirname, 'stub.cjs' );
	}
} );
