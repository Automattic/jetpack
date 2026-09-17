/* eslint-disable testing-library/prefer-user-event */
/* eslint-disable jest-dom/prefer-in-document -- The legacy Boost Jest project does not load jest-dom. */
import { queryClient } from '@automattic/jetpack-react-data-sync-client';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRoot } from '@wordpress/element';
import { OVERVIEW_MODULES_CHANGE_EVENT } from '../../../../_inc/overview/lib/modules-state-bridge';
import { OVERVIEW_UPGRADE_EVENT } from '../../../../_inc/overview/lib/upgrade-bridge';
import './modern-overview-upgrade';
import type { UpgradeSlotRequest } from '../../../../_inc/overview/lib/upgrade-bridge';

jest.mock( '@automattic/jetpack-analytics', () => ( {} ) );
jest.mock( '@wordpress/element', () => ( {
	...jest.requireActual( '@wordpress/element' ),
	createRoot: jest.fn( jest.requireActual( '@wordpress/element' ).createRoot ),
} ) );
jest.mock( 'jetpackConfig', () => ( { consumer_slug: 'jetpack-boost' } ), { virtual: true } );

afterEach( () => {
	Reflect.deleteProperty( window, 'jpTracksAJAX' );
	window.history.replaceState( {}, '', '/' );
} );

test.each( [ 'success', 'failure' ] )(
	'navigates after tracking %s and cleans up its root',
	async outcome => {
		window.history.replaceState( {}, '', '/admin.php?page=my-jetpack' );
		let completeTracking: () => void;
		const recordAjaxEvent = jest.fn().mockReturnValue( {
			done: jest.fn( callback => {
				if ( outcome === 'success' ) {
					completeTracking = callback;
				}
				return {
					fail: jest.fn( onFailure => {
						if ( outcome === 'failure' ) {
							completeTracking = () => onFailure( { responseText: 'Tracking unavailable' } );
						}
					} ),
				};
			} ),
		} );
		Object.defineProperty( window, 'jpTracksAJAX', {
			configurable: true,
			value: { record_ajax_event: recordAjaxEvent },
		} );
		render( <div data-testid="upgrade-slot" /> );
		const request: UpgradeSlotRequest = { container: screen.getByTestId( 'upgrade-slot' ) };
		expect( screen.queryByRole( 'link', { name: 'Upgrade now' } ) ).toBeNull();
		await act( async () => {
			window.dispatchEvent( new CustomEvent( OVERVIEW_UPGRADE_EVENT, { detail: request } ) );
		} );
		const upgradeLink = screen.getByRole( 'link', { name: 'Upgrade now' } );
		// eslint-disable-next-line jest-dom/prefer-to-have-attribute -- This Jest project does not load jest-dom.
		expect( upgradeLink.getAttribute( 'href' ) ).toBe( 'admin.php?page=my-jetpack#/add-boost' );
		expect( fireEvent.click( upgradeLink ) ).toBe( false );
		expect( window.location.hash ).toBe( '' );
		expect( screen.queryByRole( 'dialog' ) ).toBeNull();
		expect( recordAjaxEvent ).toHaveBeenCalledWith(
			'boost_performance_history_upgrade_cta_click',
			'click',
			expect.objectContaining( {
				identifier: 'historical-performance',
				destination: 'interstitial',
			} )
		);
		await act( async () => completeTracking() );
		expect( window.location.hash ).toBe( '#/add-boost' );
		await act( async () => request.unmount?.() );
		expect( screen.queryByRole( 'link', { name: 'Upgrade now' } ) ).toBeNull();
	}
);

test.each( [ 'metaKey', 'ctrlKey', 'shiftKey', 'altKey' ] )(
	'keeps native navigation for %s while tracking is pending',
	async modifier => {
		window.history.replaceState( {}, '', '/admin.php?page=my-jetpack' );
		const recordAjaxEvent = jest.fn().mockReturnValue( {
			done: jest.fn().mockReturnValue( { fail: jest.fn() } ),
		} );
		Object.defineProperty( window, 'jpTracksAJAX', {
			configurable: true,
			value: { record_ajax_event: recordAjaxEvent },
		} );
		render( <div data-testid="upgrade-slot" /> );
		const request: UpgradeSlotRequest = { container: screen.getByTestId( 'upgrade-slot' ) };
		await act( async () => {
			window.dispatchEvent( new CustomEvent( OVERVIEW_UPGRADE_EVENT, { detail: request } ) );
		} );
		// Observe cancellation after React handles the click, then suppress jsdom's native navigation.
		const observeClick = jest.fn( ( event: Event ) => {
			const prevented = event.defaultPrevented;
			event.preventDefault();
			return prevented;
		} );
		document.addEventListener( 'click', observeClick, { once: true } );
		fireEvent.click( screen.getByRole( 'link', { name: 'Upgrade now' } ), { [ modifier ]: true } );
		expect( observeClick ).toHaveReturnedWith( false );
		expect( recordAjaxEvent ).toHaveBeenCalledWith(
			'boost_performance_history_upgrade_cta_click',
			'click',
			expect.objectContaining( {
				identifier: 'historical-performance',
				destination: 'interstitial',
			} )
		);
		await act( async () => request.unmount?.() );
		expect( window.location.hash ).toBe( '' );
	}
);

test( 'cancels a pending root before a strict-mode remount', async () => {
	render( <div data-testid="upgrade-slot" /> );
	jest.mocked( createRoot ).mockClear();
	const container = screen.getByTestId( 'upgrade-slot' );
	const first: UpgradeSlotRequest = { container };
	const second: UpgradeSlotRequest = { container };
	await act( async () => {
		window.dispatchEvent( new CustomEvent( OVERVIEW_UPGRADE_EVENT, { detail: first } ) );
		first.unmount?.();
		window.dispatchEvent( new CustomEvent( OVERVIEW_UPGRADE_EVENT, { detail: second } ) );
	} );
	expect( createRoot ).toHaveBeenCalledTimes( 1 );
	expect( createRoot ).toHaveBeenCalledWith( container );
	expect( screen.getAllByRole( 'link', { name: 'Upgrade now' } ) ).toHaveLength( 1 );
	await act( async () => second.unmount?.() );
	expect( screen.queryByRole( 'link', { name: 'Upgrade now' } ) ).toBeNull();
} );

test( 'relays module updates from the Data Sync client', () => {
	const onChange = jest.fn();
	window.addEventListener( OVERVIEW_MODULES_CHANGE_EVENT, onChange );
	try {
		queryClient.setQueryData( [ 'modules_state' ], {
			defer_js: { active: true, available: true },
		} );
		expect( onChange ).toHaveBeenCalledTimes( 1 );
	} finally {
		window.removeEventListener( OVERVIEW_MODULES_CHANGE_EVENT, onChange );
		queryClient.clear();
	}
} );
