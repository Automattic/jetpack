/* eslint-disable testing-library/prefer-user-event */
/* eslint-disable jest-dom/prefer-in-document -- The legacy Boost Jest project does not load jest-dom. */
import { act, fireEvent, render, screen } from '@testing-library/react';
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
	const container = screen.getByTestId( 'upgrade-slot' );
	const first: UpgradeSlotRequest = { container };
	const second: UpgradeSlotRequest = { container };
	await act( async () => {
		window.dispatchEvent( new CustomEvent( OVERVIEW_UPGRADE_EVENT, { detail: first } ) );
		first.unmount?.();
		window.dispatchEvent( new CustomEvent( OVERVIEW_UPGRADE_EVENT, { detail: second } ) );
	} );
	expect( screen.getAllByRole( 'button', { name: 'Upgrade now' } ) ).toHaveLength( 1 );
	await act( async () => second.unmount?.() );
	expect( screen.queryByRole( 'button', { name: 'Upgrade now' } ) ).toBeNull();
} );
