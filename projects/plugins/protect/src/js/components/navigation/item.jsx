/**
 * External dependencies
 */
import React, { useContext, useEffect, useCallback } from 'react';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import styles from './styles.module.scss';
import { NavigationContext } from './use-menu-navigation';
import ItemLabel from './label';
import ItemBadge from './badge';

const NavigationItem = ( {
	id,
	disabled,
	initial,
	label,
	icon,
	vuls,
	onClick,
	onKeyDown,
	onFocus,
} ) => {
	const context = useContext( NavigationContext );

	const selected = context?.selectedItem === id;
	const registerItem = context?.registerItem;
	const registerRef = context?.registerRef;
	const handleSelectedItem = context?.handleSelectedItem;
	const handleKeyNav = context?.handleKeyNav;
	const handleFocusNav = context?.handleFocus;

	const wrapperClassName = classNames( styles[ 'navigation-item' ], {
		[ styles.clickable ]: ! disabled,
		[ styles.selected ]: selected,
	} );

	const handleClick = evt => {
		onClick?.( evt );
		handleSelectedItem?.( id );
	};

	const handleKeyDown = useCallback(
		evt => {
			onKeyDown?.( evt );
			handleKeyNav?.( evt );
		},
		[ handleKeyNav, onKeyDown ]
	);

	const handleRef = useCallback(
		ref => {
			registerRef( ref, id );
		},
		[ registerRef, id ]
	);

	const handleFocus = useCallback(
		evt => {
			onFocus?.( evt );
			handleFocusNav?.( id );
		},
		[ handleFocusNav, id, onFocus ]
	);

	useEffect( () => {
		registerItem( { id, disabled, initial } );
		// eslint-disable-next-line
	}, [] );

	return (
		<li
			className={ wrapperClassName }
			onClick={ disabled ? null : handleClick }
			onKeyDown={ handleKeyDown }
			onFocus={ handleFocus }
			role="menuitem"
			tabIndex={ disabled ? -1 : 0 }
			ref={ handleRef }
		>
			<ItemLabel icon={ icon }>{ label }</ItemLabel>
			{ Boolean( vuls ) && <ItemBadge>{ vuls }</ItemBadge> }
		</li>
	);
};

export default NavigationItem;
