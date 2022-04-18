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

const NavigationItem = ( { id, initial, label, icon, vuls, onClick, onKeyDown, onFocus } ) => {
	const context = useContext( NavigationContext );

	const selected = context?.selectedItem === id;
	const registerItem = context?.registerItem;
	const registerRef = context?.registerRef;
	const handleClickItem = context?.handleClickItem;
	const handleKeyDownItem = context?.handleKeyDownItem;
	const handleFocusItem = context?.handleFocusItem;

	const wrapperClassName = classNames( styles[ 'navigation-item' ], {
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
		registerItem( { id, initial } );
		// eslint-disable-next-line
	}, [] );

	return (
		<li
			className={ wrapperClassName }
			onClick={ handleClick }
			onKeyDown={ handleKeyDown }
			onFocus={ handleFocus }
			role="menuitem"
			tabIndex={ 0 }
			ref={ handleRef }
		>
			<ItemLabel icon={ icon }>{ label }</ItemLabel>
			{ Boolean( vuls ) && <ItemBadge>{ vuls }</ItemBadge> }
		</li>
	);
};

export default NavigationItem;
