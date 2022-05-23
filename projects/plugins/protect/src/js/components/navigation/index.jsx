/**
 * External dependencies
 */
import React, { useState, useRef, useCallback } from 'react';
import { Popover } from '@wordpress/components';
import { Icon, chevronDown, chevronUp } from '@wordpress/icons';
import { Text } from '@automattic/jetpack-components';
/**
 * Internal dependencies
 */
import styles from './styles.module.scss';
import NavigationItem from './item';
import NavigationGroup from './group';
import useMenuNavigation, { NavigationContext } from './use-menu-navigation';
import classNames from 'classnames';

const NavigationList = ( { children } ) => (
	<ul className={ styles.navigation } role="menu">
		{ children }
	</ul>
);

const NavigationDropdown = ( { children, data } ) => {
	const ref = useRef();
	const [ listOpen, setListOpen ] = useState( false );
	const item = data?.items?.find( navItem => navItem?.id === data?.selectedItem ) ?? {};
	const { label, icon } = item;

	const handleOpen = useCallback( () => {
		setListOpen( open => ! open );
	}, [] );

	return (
		<button className={ styles[ 'navigation-dropdown-button' ] } onClick={ handleOpen } ref={ ref }>
			<div className={ styles[ 'navigation-dropdown-label' ] }>
				{ icon && <Icon icon={ icon } className={ styles[ 'navigation-dropdown-icon' ] } /> }
				<Text>{ label }</Text>
			</div>
			<Icon icon={ listOpen ? chevronUp : chevronDown } size={ 32 } />
			<Popover
				position="bottom center"
				anchorRef={ ref?.current }
				className={ classNames( {
					[ styles[ 'navigation-dropdown-open' ] ]: listOpen,
					[ styles[ 'navigation-dropdown-closed' ] ]: ! listOpen,
				} ) }
			>
				<div style={ { width: ref?.current?.getBoundingClientRect?.()?.width } }>{ children }</div>
			</Popover>
		</button>
	);
};

const getNavigationComponent = mode => {
	switch ( mode ) {
		case 'list':
			return NavigationList;
		case 'dropdown':
			return NavigationDropdown;
		default:
			return NavigationList;
	}
};

const Navigation = ( { children, selected, onSelect, mode = 'list' } ) => {
	const data = useMenuNavigation( { selected, onSelect } );
	const Component = getNavigationComponent( mode );

	return (
		<NavigationContext.Provider value={ { ...data, mode } }>
			<Component data={ data }>{ children }</Component>
		</NavigationContext.Provider>
	);
};

export default Navigation;
export { NavigationItem, NavigationGroup };
