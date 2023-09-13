const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

module.exports = {
	...defaultConfig,
	entry: {
		...defaultConfig.entry,
		'wpcom-launchpad-navigator-editor':
			'./src/features/launchpad-navigator/launchpad-navigator-editor-menu.tsx',
		'wpcom-launchpad-navigator-admin-bar':
			'./src/features/launchpad-navigator/launchpad-navigator-admin-bar.tsx',
	},
};
