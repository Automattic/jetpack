/**
 * External dependencies
 */
import React, { useContext, useEffect, useCallback } from 'react';
import { Icon, check } from '@wordpress/icons';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import styles from './styles.module.scss';
import { NavigationContext } from './use-menu-navigation';
import ItemLabel from './label';
import ItemBadge from './badge';

const NavigationItem = ( { id, label, icon, badge, disabled, onClick, onKeyDown, onFocus } ) => {
	const context = useContext( NavigationContext );

	const selected = context?.selectedItem === id;
	const registerItem = context?.registerItem;
	const registerRef = context?.registerRef;
	const handleClickItem = context?.handleClickItem;
	const handleKeyDownItem = context?.handleKeyDownItem;
	const handleFocusItem = context?.handleFocusItem;

	const hasBadge = Number.isFinite( badge );

	const wrapperClassName = classNames( styles[ 'navigation-item' ], {
		[ styles.clickable ]: ! disabled,
		[ styles.selected ]: selected,
	} );

	const handleClick = useCallback(
		evt => {
			onClick?.( evt );
			handleClickItem?.( id );
		},
		[ handleClickItem, id, onClick ]
	);

	const handleKeyDown = useCallback(
		evt => {
			onKeyDown?.( evt );
			handleKeyDownItem?.( evt );
		},
		[ handleKeyDownItem, onKeyDown ]
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
			handleFocusItem?.( id );
		},
		[ handleFocusItem, id, onFocus ]
	);

	useEffect( () => {
		registerItem( { id, disabled } );
		// eslint-disable-next-line
	}, [] );

	const badgeElement = hasBadge && (
		<>
			{ badge > 0 ? (
				<ItemBadge>{ badge }</ItemBadge>
			) : (
				<Icon icon={ check } size={ 28 } className={ styles[ 'navigation-item-check-badge' ] } />
			) }
		</>
	);

	return (
		<li
			className={ wrapperClassName }
			onClick={ disabled ? null : handleClick }
			onKeyDown={ handleKeyDown }
			onFocus={ disabled ? null : handleFocus }
			role="menuitem"
			tabIndex={ disabled ? -1 : 0 }
			ref={ handleRef }
		>
			<ItemLabel icon={ icon }>{ label }</ItemLabel>
			{ badgeElement }
		</li>
	);
};

export default NavigationItem;
