/**
 * External dependencies
 */
import React, { useState } from 'react';

export const NavigationContext = React.createContext();

const useMenuNavigation = () => {
	const [ items, setItems ] = useState( [] );
	const [ selectedItem, setSelectedItem ] = useState();
	const [ refs, setRef ] = useState( [] );
	const [ focusedItem, setFocusedItem ] = useState();
	const initial = items.find( item => item?.initial )?.id || items[ 0 ]?.id;

	const handleSelectedItem = id => {
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

	const handleKeyNav = input => {
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

	const handleFocus = id => {
		setFocusedItem( id );
	};

	const registerRef = ( ref, id ) => {
		setRef( allRefs => {
			if ( ! allRefs[ id ] && ref ) {
				return { ...allRefs, [ id ]: ref };
			}
			return allRefs;
		} );
	};

	const registerItem = data => {
		setItems( allItems => {
			const newItems = [ ...allItems ];
			const id = data?.id;
			const currentIdx = newItems.findIndex( item => item?.id === id );

			if ( currentIdx >= 0 ) {
				newItems[ currentIdx ] = data;
			} else {
				newItems.push( data );
			}

			return newItems;
		} );
	};

	return {
		selectedItem: selectedItem || initial,
		handleSelectedItem,
		handleKeyNav,
		handleFocus,
		registerRef,
		registerItem,
	};
};

export default useMenuNavigation;
