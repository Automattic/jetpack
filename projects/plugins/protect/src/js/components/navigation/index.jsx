/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import styles from './styles.module.scss';
import NavigationItem from './item';
import NavigationGroup from './group';
import useMenuNavigation, { NavigationContext } from './use-menu-navigation';

const Navigation = ( { children } ) => {
	const data = useMenuNavigation();

	return (
		<NavigationContext.Provider value={ data }>
			<ul className={ styles.navigation } role="menu">
				{ children }
			</ul>
		</NavigationContext.Provider>
	);
};

export { Navigation, NavigationItem, NavigationGroup };
