import { __ } from '@wordpress/i18n';
import { wordpress, plugins, warning, color } from '@wordpress/icons';
import React, { useState } from 'react';
import Navigation, { NavigationItem, NavigationGroup } from '..';

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

export const Default = () => {
	const [ selected, setSelectedItem ] = useState( 'all' );

	return (
		<Navigation selected={ selected } onSelect={ setSelectedItem }>
			<NavigationItem
				id="all"
				label={ __( 'All vulnerabilities', 'jetpack-protect' ) }
				icon={ warning }
				badge={ 10 }
			/>
			<NavigationItem
				id="wordpress"
				label={ __( 'WordPress', 'jetpack-protect' ) }
				icon={ wordpress }
				badge={ 12 }
			/>
			<NavigationGroup label={ __( 'Plugins', 'jetpack-protect' ) } icon={ plugins }>
				<NavigationItem id="jetpack" label={ __( 'Jetpack', 'jetpack-protect' ) } badge={ 9 } />
				<NavigationItem
					id="jetpack-backup"
					label={ __( 'Jetpack Backup', 'jetpack-protect' ) }
					badge={ 9 }
				/>
			</NavigationGroup>
			<NavigationGroup label={ __( 'Themes', 'jetpack-protect' ) } icon={ color }>
				<NavigationItem
					id="nichetable"
					label={ __( 'Nichetable', 'jetpack-protect' ) }
					badge={ 0 }
					disabled
				/>
				<NavigationItem
					id="twenty-two"
					label={ __( 'Twenty Two', 'jetpack-protect' ) }
					badge={ 2 }
				/>
			</NavigationGroup>
		</Navigation>
	);
};
