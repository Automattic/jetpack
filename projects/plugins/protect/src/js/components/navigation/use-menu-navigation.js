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
	const defaultItem = items.find( item => item?.initial )?.id || items[ 0 ]?.id;

	const handleSelectedItem = id => {
		setSelectedItem( id );
	};

	const handleFocus = id => {
		setFocusedItem( id );
	};

	const handleKeyNav = input => {
		const code = input?.code;
		const current = items.findIndex( item => item?.id === selectedItem );
		const lastIndex = items.length - 1;
		const startPlusOne = current + 1;
		const startMinusOne = current - 1;
		const nextItem = items[ startPlusOne > lastIndex ? 0 : startPlusOne ];
		const prevItem = items[ startMinusOne < 0 ? lastIndex : startMinusOne ];

		let nextId;

		if ( code === 'ArrowUp' ) {
			nextId = prevItem?.id;
		} else if ( code === 'ArrowDown' ) {
			nextId = nextItem?.id;
		} else if ( ( code === 'Enter' || code === 'Space' ) && focusedItem ) {
			nextId = focusedItem;
		}

		if ( nextId ) {
			const element = refs[ nextId ];
			element?.focus();
			setSelectedItem( nextId );
		}
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
		selectedItem: selectedItem || defaultItem,
		handleSelectedItem,
		handleKeyNav,
		handleFocus,
		registerRef,
		registerItem,
	};
};

export default useMenuNavigation;
