/**
 * The grid and list switch at the end of Discover's toolbar, copied from My
 * Jetpack's Features toolbar: two pressed-state icon buttons in a soft track.
 * The choice is kept per viewer in this browser, as a convenience only.
 */

import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { blockTable, category } from '@wordpress/icons';
import { IconButton, Stack } from '@wordpress/ui';

export const VIEW_STORAGE_KEY = 'jetpack-ai-discover-view';

/**
 * The view this viewer picked last. Storage can be missing or throw (a private
 * window, blocked site data), so anything but a stored 'list' is the grid.
 *
 * @return {string} 'grid' or 'list'.
 */
function readStoredView() {
	try {
		return window.localStorage.getItem( VIEW_STORAGE_KEY ) === 'list' ? 'list' : 'grid';
	} catch {
		return 'grid';
	}
}

/**
 * Remember the view for next time. A refusal just means it isn't remembered.
 *
 * @param {string} view - 'grid' or 'list'.
 */
function storeView( view ) {
	try {
		if ( view === 'list' ) {
			window.localStorage.setItem( VIEW_STORAGE_KEY, view );
		} else {
			window.localStorage.removeItem( VIEW_STORAGE_KEY );
		}
	} catch {
		// Not remembered; the switch still works for this visit.
	}
}

/**
 * The view on screen and a setter that remembers it.
 *
 * @return {Array} [ view, setView ].
 */
export function useDiscoverView() {
	const [ view, setView ] = useState( readStoredView );
	const changeView = useCallback( next => {
		setView( next );
		storeView( next );
	}, [] );
	return [ view, changeView ];
}

/**
 * One of the two buttons, as My Jetpack's ViewButton.
 *
 * @param {object}   props          - Component props.
 * @param {string}   props.value    - The view this button shows.
 * @param {string}   props.current  - The view on screen.
 * @param {Function} props.onSelect - Switches the view.
 * @return {object} Component markup.
 */
function ViewButton( { value, current, onSelect } ) {
	const handleClick = useCallback( () => onSelect( value ), [ onSelect, value ] );

	return (
		<IconButton
			icon={ value === 'grid' ? category : blockTable }
			label={ value === 'grid' ? __( 'Grid view', 'jetpack' ) : __( 'List view', 'jetpack' ) }
			// Minimal either way: the design system paints a pressed neutral minimal
			// button with the strong fill, and documents aria-pressed for this variant.
			variant="minimal"
			tone="neutral"
			size="compact"
			aria-pressed={ value === current }
			className="jetpack-ai-discover__view-button"
			onClick={ handleClick }
		/>
	);
}

/**
 * The grid and list switch.
 *
 * @param {object}   props          - Component props.
 * @param {string}   props.value    - The view on screen: 'grid' or 'list'.
 * @param {Function} props.onChange - Called with the view picked.
 * @return {object} Component markup.
 */
export default function ViewToggle( { value, onChange } ) {
	return (
		<Stack
			direction="row"
			align="center"
			role="group"
			aria-label={ __( 'Layout', 'jetpack' ) }
			className="jetpack-ai-discover__view-group"
		>
			<ViewButton value="grid" current={ value } onSelect={ onChange } />
			<ViewButton value="list" current={ value } onSelect={ onChange } />
		</Stack>
	);
}
