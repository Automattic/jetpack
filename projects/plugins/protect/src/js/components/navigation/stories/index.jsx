/**
 * External dependencies
 */
import React from 'react';
import { wordpress, plugins, warning, color } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Navigation from '..';

export default {
	title: 'Plugins/Protect/Navigation',
	component: Navigation,
	parameters: {
		layout: 'centered',
	},
	decorators: [
		Story => (
			<div style={ { width: 800 } }>
				<Story />
			</div>
		),
	],
};

const Template = args => <Navigation { ...args } />;
export const Default = Template.bind( {} );
Default.args = {
	items: [
		{
			id: 'all',
			label: __( 'All vulnerabilities', 'jetpack-protect' ),
			icon: warning,
			vuls: 3,
			initial: true,
		},
		{
			id: 'wordpress',
			label: __( 'WordPress', 'jetpack-protect' ),
			icon: wordpress,
			vuls: 10,
		},
		{
			id: 'plugins',
			label: __( 'Plugins', 'jetpack-protect' ),
			icon: plugins,
			vuls: 12,
		},
		{
			id: 'themes',
			label: __( 'Themes', 'jetpack-protect' ),
			icon: color,
			vuls: 8,
		},
	],
};
