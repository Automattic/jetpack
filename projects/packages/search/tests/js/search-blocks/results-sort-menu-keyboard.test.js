/**
 * Tests for the sort-popover ARIA-menu keyboard navigation actions in the
 * shared `jetpack-search` store. The store is exercised through the same
 * `@wordpress/interactivity` mock used by `results-sort-view.test.js`: the
 * mocked `store()` collects the registered state/actions, and the tests
 * drive the captured actions directly with synthetic events.
 */

const captured = {
	state: {},
	actions: {},
};

jest.mock(
	'@wordpress/interactivity',
	() => ( {
		store: ( _namespace, config ) => {
			if ( config ) {
				const stateConfig = config.state || {};
				const descriptors = Object.getOwnPropertyDescriptors( stateConfig );
				for ( const key of Object.keys( descriptors ) ) {
					const descriptor = descriptors[ key ];
					if ( typeof descriptor.get === 'function' ) {
						Object.defineProperty( captured.state, key, descriptor );
					} else {
						captured.state[ key ] = descriptor.value;
					}
				}
				Object.assign( captured.actions, config.actions || {} );
			}
			return { state: captured.state, actions: captured.actions };
		},
		getContext: () => ( {} ),
		getElement: () => ( { ref: null } ),
	} ),
	{ virtual: true }
);

require( '../../../src/search-blocks/store' );

/**
 * Build a minimal popover DOM with the trigger and the rendered menu
 * items (`relevance`, `newest`, `oldest`) so the keyboard handlers can
 * read the available sort keys and walk the structure to refocus the
 * trigger after closing.
 *
 * @return {{root: HTMLElement, trigger: HTMLElement, items: HTMLButtonElement[]}} Popover refs.
 */
function buildPopoverDom() {
	document.body.innerHTML = `
		<div data-jetpack-search-popover-root>
			<button class="jetpack-search-results-sort__trigger" type="button"></button>
			<div class="jetpack-search-results-sort__menu" role="menu">
				<button class="jetpack-search-results-sort__menu-item" type="button" value="relevance"></button>
				<button class="jetpack-search-results-sort__menu-item" type="button" value="newest"></button>
				<button class="jetpack-search-results-sort__menu-item" type="button" value="oldest"></button>
			</div>
		</div>
	`;
	const root = document.querySelector( '[data-jetpack-search-popover-root]' );
	return {
		root,
		trigger: root.querySelector( '.jetpack-search-results-sort__trigger' ),
		items: Array.from( root.querySelectorAll( '.jetpack-search-results-sort__menu-item' ) ),
	};
}

/**
 * Build a synthetic keyboard event with a matching `currentTarget` and
 * a Jest spy on `preventDefault`, mirroring what Interactivity passes
 * into action handlers.
 *
 * @param {string}      key           - KeyboardEvent.key value.
 * @param {HTMLElement} currentTarget - Element the handler is bound to.
 * @return {{key: string, currentTarget: HTMLElement, preventDefault: jest.Mock}} Synthetic event.
 */
function makeKeydown( key, currentTarget ) {
	return {
		key,
		currentTarget,
		preventDefault: jest.fn(),
	};
}

describe( 'sort popover keyboard navigation', () => {
	beforeEach( () => {
		captured.state.sortOrder = 'relevance';
		captured.state.sortMenuFocusedKey = null;
		captured.state.isSortPopoverOpen = false;
		captured.state.isFilterPopoverOpen = false;
		jest.spyOn( captured.actions, 'search' ).mockImplementation( () => {} );
	} );

	describe( 'onSortTriggerKeydown', () => {
		it( 'opens the popover and anchors focus on the active sort for ArrowDown', () => {
			captured.state.sortOrder = 'newest';
			const { trigger } = buildPopoverDom();
			const event = makeKeydown( 'ArrowDown', trigger );
			captured.actions.onSortTriggerKeydown( event );
			expect( event.preventDefault ).toHaveBeenCalled();
			expect( captured.state.isSortPopoverOpen ).toBe( true );
			expect( captured.state.sortMenuFocusedKey ).toBe( 'newest' );
		} );

		it( 'opens the popover and anchors focus on the active sort for ArrowUp', () => {
			captured.state.sortOrder = 'newest';
			const { trigger } = buildPopoverDom();
			const event = makeKeydown( 'ArrowUp', trigger );
			captured.actions.onSortTriggerKeydown( event );
			expect( captured.state.isSortPopoverOpen ).toBe( true );
			expect( captured.state.sortMenuFocusedKey ).toBe( 'newest' );
		} );

		it( 'falls back to the first item on ArrowDown when the active sort is not rendered', () => {
			captured.state.sortOrder = 'unavailable';
			const { trigger } = buildPopoverDom();
			const event = makeKeydown( 'ArrowDown', trigger );
			captured.actions.onSortTriggerKeydown( event );
			expect( captured.state.sortMenuFocusedKey ).toBe( 'relevance' );
		} );

		it( 'falls back to the last item on ArrowUp when the active sort is not rendered', () => {
			captured.state.sortOrder = 'unavailable';
			const { trigger } = buildPopoverDom();
			const event = makeKeydown( 'ArrowUp', trigger );
			captured.actions.onSortTriggerKeydown( event );
			expect( captured.state.sortMenuFocusedKey ).toBe( 'oldest' );
		} );

		it( 'opens the popover on Enter and anchors focus on the active sort', () => {
			const { trigger } = buildPopoverDom();
			const event = makeKeydown( 'Enter', trigger );
			captured.actions.onSortTriggerKeydown( event );
			expect( captured.state.isSortPopoverOpen ).toBe( true );
			expect( captured.state.sortMenuFocusedKey ).toBe( 'relevance' );
		} );

		it( 'ignores other keys so Tab still leaves the trigger', () => {
			const { trigger } = buildPopoverDom();
			const event = makeKeydown( 'Tab', trigger );
			captured.actions.onSortTriggerKeydown( event );
			expect( event.preventDefault ).not.toHaveBeenCalled();
			expect( captured.state.isSortPopoverOpen ).toBe( false );
		} );
	} );

	describe( 'onSortMenuKeydown', () => {
		it( 'moves the active descendant to the next item on ArrowDown', () => {
			const { items } = buildPopoverDom();
			captured.state.isSortPopoverOpen = true;
			captured.state.sortMenuFocusedKey = 'relevance';
			const event = makeKeydown( 'ArrowDown', items[ 0 ] );
			const gen = captured.actions.onSortMenuKeydown( event );
			while ( ! gen.next().done ) {
				/* drain */
			}
			expect( event.preventDefault ).toHaveBeenCalled();
			expect( captured.state.sortMenuFocusedKey ).toBe( 'newest' );
		} );

		it( 'wraps from the last item to the first on ArrowDown', () => {
			const { items } = buildPopoverDom();
			captured.state.isSortPopoverOpen = true;
			captured.state.sortMenuFocusedKey = 'oldest';
			const event = makeKeydown( 'ArrowDown', items[ 2 ] );
			const gen = captured.actions.onSortMenuKeydown( event );
			while ( ! gen.next().done ) {
				/* drain */
			}
			expect( captured.state.sortMenuFocusedKey ).toBe( 'relevance' );
		} );

		it( 'moves the active descendant to the previous item on ArrowUp and wraps', () => {
			const { items } = buildPopoverDom();
			captured.state.isSortPopoverOpen = true;
			captured.state.sortMenuFocusedKey = 'relevance';
			const event = makeKeydown( 'ArrowUp', items[ 0 ] );
			const gen = captured.actions.onSortMenuKeydown( event );
			while ( ! gen.next().done ) {
				/* drain */
			}
			expect( captured.state.sortMenuFocusedKey ).toBe( 'oldest' );
		} );

		it( 'jumps to the first option on Home', () => {
			const { items } = buildPopoverDom();
			captured.state.isSortPopoverOpen = true;
			captured.state.sortMenuFocusedKey = 'oldest';
			const event = makeKeydown( 'Home', items[ 2 ] );
			const gen = captured.actions.onSortMenuKeydown( event );
			while ( ! gen.next().done ) {
				/* drain */
			}
			expect( captured.state.sortMenuFocusedKey ).toBe( 'relevance' );
		} );

		it( 'jumps to the last option on End', () => {
			const { items } = buildPopoverDom();
			captured.state.isSortPopoverOpen = true;
			captured.state.sortMenuFocusedKey = 'relevance';
			const event = makeKeydown( 'End', items[ 0 ] );
			const gen = captured.actions.onSortMenuKeydown( event );
			while ( ! gen.next().done ) {
				/* drain */
			}
			expect( captured.state.sortMenuFocusedKey ).toBe( 'oldest' );
		} );

		it( 'closes the popover and refocuses the trigger on Escape', () => {
			const { trigger, items } = buildPopoverDom();
			const triggerFocus = jest.fn();
			trigger.focus = triggerFocus;
			captured.state.isSortPopoverOpen = true;
			captured.state.sortMenuFocusedKey = 'newest';
			const event = makeKeydown( 'Escape', items[ 1 ] );
			const gen = captured.actions.onSortMenuKeydown( event );
			while ( ! gen.next().done ) {
				/* drain */
			}
			expect( event.preventDefault ).toHaveBeenCalled();
			expect( captured.state.isSortPopoverOpen ).toBe( false );
			expect( captured.state.sortMenuFocusedKey ).toBeNull();
			expect( triggerFocus ).toHaveBeenCalled();
		} );

		it( 'closes the popover on Tab without preventing default so focus moves on', () => {
			const { items } = buildPopoverDom();
			captured.state.isSortPopoverOpen = true;
			captured.state.sortMenuFocusedKey = 'newest';
			const event = makeKeydown( 'Tab', items[ 1 ] );
			const gen = captured.actions.onSortMenuKeydown( event );
			while ( ! gen.next().done ) {
				/* drain */
			}
			expect( event.preventDefault ).not.toHaveBeenCalled();
			expect( captured.state.isSortPopoverOpen ).toBe( false );
			expect( captured.state.sortMenuFocusedKey ).toBeNull();
		} );

		it( 'activates the focused item on Enter, closes the popover, and refocuses the trigger', () => {
			const { trigger, items } = buildPopoverDom();
			const triggerFocus = jest.fn();
			trigger.focus = triggerFocus;
			captured.state.isSortPopoverOpen = true;
			captured.state.sortMenuFocusedKey = 'newest';
			captured.state.sortOrder = 'relevance';

			const event = makeKeydown( 'Enter', items[ 1 ] );
			const gen = captured.actions.onSortMenuKeydown( event );
			while ( ! gen.next().done ) {
				/* drain (selectSortOrder generator yields once) */
			}

			expect( event.preventDefault ).toHaveBeenCalled();
			expect( captured.state.sortOrder ).toBe( 'newest' );
			expect( captured.state.isSortPopoverOpen ).toBe( false );
			expect( captured.state.sortMenuFocusedKey ).toBeNull();
			expect( captured.actions.search ).toHaveBeenCalledTimes( 1 );
			expect( triggerFocus ).toHaveBeenCalled();
		} );

		it( 'activates the focused item on Space the same as Enter', () => {
			const { items } = buildPopoverDom();
			captured.state.isSortPopoverOpen = true;
			captured.state.sortMenuFocusedKey = 'oldest';
			captured.state.sortOrder = 'relevance';

			const event = makeKeydown( ' ', items[ 2 ] );
			const gen = captured.actions.onSortMenuKeydown( event );
			while ( ! gen.next().done ) {
				/* drain */
			}

			expect( event.preventDefault ).toHaveBeenCalled();
			expect( captured.state.sortOrder ).toBe( 'oldest' );
			expect( captured.state.isSortPopoverOpen ).toBe( false );
		} );
	} );

	describe( 'toggleSortPopover', () => {
		it( 'resets sortMenuFocusedKey when closing', () => {
			captured.state.isSortPopoverOpen = true;
			captured.state.sortMenuFocusedKey = 'newest';
			captured.actions.toggleSortPopover();
			expect( captured.state.isSortPopoverOpen ).toBe( false );
			expect( captured.state.sortMenuFocusedKey ).toBeNull();
		} );

		it( 'leaves sortMenuFocusedKey null when opening (mouse opens stay on trigger)', () => {
			captured.state.isSortPopoverOpen = false;
			captured.state.sortMenuFocusedKey = null;
			captured.actions.toggleSortPopover();
			expect( captured.state.isSortPopoverOpen ).toBe( true );
			expect( captured.state.sortMenuFocusedKey ).toBeNull();
		} );
	} );

	describe( 'closeAllPopovers', () => {
		it( 'clears the keyboard-focused sort key', () => {
			captured.state.isSortPopoverOpen = true;
			captured.state.sortMenuFocusedKey = 'oldest';
			captured.actions.closeAllPopovers();
			expect( captured.state.sortMenuFocusedKey ).toBeNull();
		} );
	} );

	describe( 'onWindowClickClosePopovers', () => {
		it( 'clears sortMenuFocusedKey when an outside click closes the sort popover', () => {
			document.body.innerHTML = '<button id="outside" type="button"></button>';
			captured.state.isSortPopoverOpen = true;
			captured.state.sortMenuFocusedKey = 'newest';

			const event = { target: document.getElementById( 'outside' ) };
			captured.actions.onWindowClickClosePopovers( event );

			expect( captured.state.isSortPopoverOpen ).toBe( false );
			expect( captured.state.sortMenuFocusedKey ).toBeNull();
		} );
	} );

	describe( 'onEscapeClosePopovers', () => {
		it( 'clears sortMenuFocusedKey when Escape closes the sort popover', () => {
			captured.state.isSortPopoverOpen = true;
			captured.state.sortMenuFocusedKey = 'oldest';

			captured.actions.onEscapeClosePopovers( makeKeydown( 'Escape' ) );

			expect( captured.state.isSortPopoverOpen ).toBe( false );
			expect( captured.state.sortMenuFocusedKey ).toBeNull();
		} );
	} );
} );
