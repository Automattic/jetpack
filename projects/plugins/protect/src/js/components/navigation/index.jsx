/**
 * External dependencies
 */
import React, { useState } from 'react';
import { Text } from '@automattic/jetpack-components';
import { Icon } from '@wordpress/icons';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import styles from './styles.module.scss';

const NavigationItem = React.forwardRef(
	( { onClick, onKeyDown, onFocus, selected, label, icon, vuls, isSubItem }, ref ) => {
		const wrapperClassName = classNames( styles[ 'navigation-item' ], {
			[ styles.clickable ]: Boolean( onClick ),
			[ styles.selected ]: selected,
		} );

		const labelClassname = classNames( styles[ 'navigation-item-label' ], {
			[ styles[ 'sub-item' ] ]: isSubItem,
		} );

		return (
			<li
				className={ wrapperClassName }
				onClick={ onClick }
				onKeyDown={ onKeyDown }
				onFocus={ onFocus }
				role="menuitem"
				tabIndex={ 0 }
				ref={ ref }
			>
				<Text className={ labelClassname }>
					{ icon && (
						<Icon icon={ icon } className={ styles[ 'navigation-item-icon' ] } size={ 28 } />
					) }
					{ label }
				</Text>
				{ Boolean( vuls ) && (
					<Text
						variant="body-extra-small"
						className={ styles[ 'navigation-item-badge' ] }
						component="div"
					>
						{ vuls }
					</Text>
				) }
			</li>
		);
	}
);

const Navigation = ( { items = [] } ) => {
	const initial = items.find( item => item?.initial )?.id || items[ 0 ]?.id;
	const [ selectedItem, setSelectedItem ] = useState( initial );
	const [ refs, setRef ] = useState( [] );
	const [ focusedItem, setFocusedItem ] = useState();

	const handleSelectedItem = id => () => {
		setSelectedItem( id );
	};

	const handleKeyNav = () => input => {
		const key = input?.key;
		const current = items.findIndex( item => item?.id === selectedItem );
		const first = items[ 0 ]?.id;
		const last = items[ items.length - 1 ]?.id;

		let nextId;

		if ( key === 'ArrowUp' ) {
			nextId = items[ current - 1 ]?.id || last;
		} else if ( key === 'ArrowDown' ) {
			nextId = items[ current + 1 ]?.id || first;
		} else if ( key === 'Enter' && focusedItem ) {
			nextId = focusedItem;
		}

		if ( nextId ) {
			const element = refs[ nextId ];
			element?.focus();
			setSelectedItem( nextId );
		}
	};

	const handleFocus = id => () => {
		setFocusedItem( id );
	};

	const handleRefs = id => ref => {
		setRef( allRefs => {
			if ( ! allRefs[ id ] && ref ) {
				return { ...allRefs, [ id ]: ref };
			}
			return allRefs;
		} );
	};

	return (
		<ul className={ styles.navigation } role="menu">
			{ items.map( item => (
				<NavigationItem
					icon={ item?.icon }
					label={ item?.label }
					vuls={ item?.vuls }
					selected={ item?.id === selectedItem }
					onClick={ handleSelectedItem( item?.id ) }
					onKeyDown={ handleKeyNav() }
					onFocus={ handleFocus( item?.id ) }
					ref={ handleRefs( item?.id ) }
				/>
			) ) }
		</ul>
	);
};

export default Navigation;
