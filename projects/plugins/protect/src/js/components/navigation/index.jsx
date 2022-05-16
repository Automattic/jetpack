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

const Navigation = ( { children, selected, onSelect } ) => {
	const data = useMenuNavigation( { selected, onSelect } );

	return (
		<NavigationContext.Provider value={ data }>
			<ul className={ styles.navigation } role="menu">
				{ children }
			</ul>
		</NavigationContext.Provider>
	);
};

export default Navigation;
export { NavigationItem, NavigationGroup };
