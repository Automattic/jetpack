/**
 * External dependencies
 */
import React, { useState } from 'react';

/**
 * Internal dependencies
 */
import styles from './styles.module.scss';
import NavigationItem from './item';

const useMenuNavigation = items => {
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

	return {
		selectedItem,
		handleSelectedItem,
		handleKeyNav,
		handleFocus,
		handleRefs,
	};
};

const Navigation = ( { items = [] } ) => {
	const {
		handleSelectedItem,
		handleKeyNav,
		handleFocus,
		handleRefs,
		selectedItem,
	} = useMenuNavigation( items );

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
