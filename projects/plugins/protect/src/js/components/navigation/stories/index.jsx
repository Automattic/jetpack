/**
 * External dependencies
 */
import React from 'react';
import { wordpress, plugins, warning, color } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Navigation, NavigationItem, NavigationGroup } from '..';

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

export const Default = () => (
	<Navigation>
		<NavigationItem
			id="all"
			label={ __( 'All vulnerabilities', 'jetpack-protect' ) }
			icon={ warning }
			vuls={ 10 }
		/>
		<NavigationItem
			id="wordpress"
			label={ __( 'WordPress', 'jetpack-protect' ) }
			icon={ wordpress }
			vuls={ 12 }
		/>
		<NavigationGroup
			id="plugins"
			label={ __( 'Plugins', 'jetpack-protect' ) }
			icon={ plugins }
			disabled
		>
			<NavigationItem id="jetpack" label={ __( 'Jetpack', 'jetpack-protect' ) } vuls={ 9 } />
			<NavigationItem
				id="jetpack-backup"
				label={ __( 'Jetpack Backup', 'jetpack-protect' ) }
				vuls={ 9 }
			/>
		</NavigationGroup>
		<NavigationItem
			id="themes"
			label={ __( 'Themes', 'jetpack-protect' ) }
			icon={ color }
			disabled
		/>
		<NavigationItem
			id="wordpress-2"
			label={ __( 'WordPress', 'jetpack-protect' ) }
			icon={ wordpress }
			vuls={ 9 }
		/>
	</Navigation>
);
