/* eslint-disable testing-library/prefer-user-event */
/* eslint-disable jest-dom/prefer-in-document -- The legacy Boost Jest project does not load jest-dom. */
import { queryClient } from '@automattic/jetpack-react-data-sync-client';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRoot } from '@wordpress/element';
import { OVERVIEW_MODULES_CHANGE_EVENT } from '../../../../_inc/overview/lib/modules-state-bridge';
import { OVERVIEW_UPGRADE_EVENT } from '../../../../_inc/overview/lib/upgrade-bridge';
import { recordBoostEvent } from './lib/utils/analytics';
import './modern-overview-upgrade';
import type { UpgradeSlotRequest } from '../../../../_inc/overview/lib/upgrade-bridge';
import type { ReactNode } from 'react';

jest.mock( './features/upgrade-cta/interstitial-modal-cta', () => ( {
	__esModule: true,
	default: ( { customModalTrigger }: { customModalTrigger: ReactNode } ) => customModalTrigger,
} ) );
jest.mock( './lib/utils/analytics', () => ( { recordBoostEvent: jest.fn() } ) );
jest.mock( '@wordpress/element', () => ( {
	...jest.requireActual( '@wordpress/element' ),
	createRoot: jest.fn( jest.requireActual( '@wordpress/element' ).createRoot ),
} ) );
jest.mock( 'jetpackConfig', () => ( { consumer_slug: 'jetpack-boost' } ), { virtual: true } );

test( 'mounts the upgrade action on request and cleans up its root', async () => {
	render( <div data-testid="upgrade-slot" /> );
	const request: UpgradeSlotRequest = { container: screen.getByTestId( 'upgrade-slot' ) };
	expect( screen.queryByRole( 'button', { name: 'Upgrade now' } ) ).toBeNull();
	await act( async () => {
		window.dispatchEvent( new CustomEvent( OVERVIEW_UPGRADE_EVENT, { detail: request } ) );
	} );
	fireEvent.click( screen.getByRole( 'button', { name: 'Upgrade now' } ) );
	expect( recordBoostEvent ).toHaveBeenCalledWith( 'performance_history_upgrade_cta_click', {} );
	await act( async () => request.unmount?.() );
	expect( screen.queryByRole( 'button', { name: 'Upgrade now' } ) ).toBeNull();
} );

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
	expect( screen.getAllByRole( 'button', { name: 'Upgrade now' } ) ).toHaveLength( 1 );
	await act( async () => second.unmount?.() );
	expect( screen.queryByRole( 'button', { name: 'Upgrade now' } ) ).toBeNull();
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
