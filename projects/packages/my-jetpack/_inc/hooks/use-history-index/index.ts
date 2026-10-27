import { useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router';
import { useValueStore } from '../../context/value-store/valueStoreContext';

/**
 * The position of the current entry in the browser history, as the router numbers it.
 *
 * @return The entry's index, or null when it has none.
 */
export function getHistoryIndex(): number | null {
	return window.history.state?.idx ?? null;
}

/**
 * Number the history entries the router leaves without an index, and forget a tab entry
 * once a new entry replaces it.
 *
 * Plain `#/…` links add entries the router does not number, so they get the index after the
 * entry they were opened from. A layout effect, so it runs before any screen reads the index.
 */
export function useHistoryIndex() {
	const location = useLocation();
	const navigationType = useNavigationType();
	const [ lastTab, setLastTab ] = useValueStore( 'lastTab', null );
	const lastIndexRef = useRef< number | null >( null );

	useLayoutEffect( () => {
		let index = getHistoryIndex();
		const isNewEntry = index === null || navigationType === 'PUSH';
		if ( index === null ) {
			index = ( lastIndexRef.current ?? -1 ) + 1;
			window.history.replaceState( { ...window.history.state, idx: index }, '' );
		}
		lastIndexRef.current = index;

		if ( isNewEntry && lastTab?.index != null && index <= lastTab.index ) {
			setLastTab( null );
		}
		// Once per history entry: re-running when `lastTab` changes would clear the tab just recorded.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ location ] );
}
