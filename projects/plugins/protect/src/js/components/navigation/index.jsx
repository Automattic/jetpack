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

	const getNexItem = startIndex => {
		const lastIndex = items.length - 1;
		const startPlusOne = startIndex + 1;
		const nextIndex = startPlusOne > lastIndex ? 0 : startPlusOne;
		const nextItem = items[ nextIndex ];
		return nextItem?.disabled ? getNexItem( nextIndex ) : nextItem?.id;
	};

	const getPrevItem = startIndex => {
		const lastIndex = items.length - 1;
		const startMinusOne = startIndex - 1;
		const nextIndex = startMinusOne < 0 ? lastIndex : startMinusOne;
		const nextItem = items[ nextIndex ];
		return nextItem?.disabled ? getPrevItem( nextIndex ) : nextItem?.id;
	};

	const handleKeyNav = () => input => {
		const code = input?.code;
		const current = items.findIndex( item => item?.id === selectedItem );

		let nextId;

		if ( code === 'ArrowUp' ) {
			nextId = getPrevItem( current );
		} else if ( code === 'ArrowDown' ) {
			nextId = getNexItem( current );
		} else if ( ( code === 'Enter' || code === 'Space' ) && focusedItem ) {
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
			{ items.map( item => {
				return (
					<NavigationItem
						icon={ item?.icon }
						label={ item?.label }
						vuls={ item?.vuls }
						selected={ item?.id === selectedItem }
						disabled={ item?.disabled }
						onClick={ handleSelectedItem( item?.id ) }
						onKeyDown={ handleKeyNav() }
						onFocus={ handleFocus( item?.id ) }
						ref={ handleRefs( item?.id ) }
					/>
				);
			} ) }
		</ul>
	);
};

export default Navigation;
