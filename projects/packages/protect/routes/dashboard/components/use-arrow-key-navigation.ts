import { useEffect } from '@wordpress/element';
import { POPUP_SELECTOR } from './use-close-on-escape';

const EDITABLE_SELECTOR = 'input, textarea, select, [contenteditable="true"]';

/**
 * While an item is open, the up and down arrow keys open the previous or next one in `items`.
 *
 * @param items    - The rows as shown, sorted and paginated.
 * @param selected - The open item's id, if any.
 * @param getId    - Reads an item's id.
 * @param open     - Opens an item.
 */
export default function useArrowKeyNavigation< T >(
	items: T[],
	selected: string | undefined,
	getId: ( item: T ) => string,
	open: ( item: T ) => void
) {
	useEffect( () => {
		if ( ! selected ) {
			return;
		}
		const onKeyDown = ( event: KeyboardEvent ) => {
			const step = { ArrowDown: 1, ArrowUp: -1 }[ event.key ];
			const target = event.target as Element | null;
			if (
				! step ||
				event.defaultPrevented ||
				event.altKey ||
				event.ctrlKey ||
				event.metaKey ||
				event.shiftKey ||
				target?.closest?.( `${ EDITABLE_SELECTOR }, ${ POPUP_SELECTOR }` )
			) {
				return;
			}
			const index = items.findIndex( item => getId( item ) === selected );
			// An item on another page starts from this page's first or last row.
			const start = step > 0 ? 0 : items.length - 1;
			const next = items[ index < 0 ? start : index + step ];
			// Prevented at either end too, so the page doesn't scroll past the list instead.
			event.preventDefault();
			if ( next ) {
				open( next );
			}
		};
		document.addEventListener( 'keydown', onKeyDown );
		return () => document.removeEventListener( 'keydown', onKeyDown );
	}, [ items, selected, getId, open ] );
}
