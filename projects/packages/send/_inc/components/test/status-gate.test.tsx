import { render, screen } from '@testing-library/react';
import { useEffect } from '@wordpress/element';
import { useSendStatus } from '../../data/store';
import StatusGate from '../status-gate';
import type { SendStatus } from '../../data/types';
import type { ReactNode } from 'react';

jest.mock( '../../data/store', () => ( { useSendStatus: jest.fn() } ) );
jest.mock( '@automattic/jetpack-components/admin-page', () => ( {
	__esModule: true,
	default: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
} ) );
jest.mock( '@automattic/jetpack-script-data', () => ( { getSiteData: () => ( {} ) } ) );
jest.mock( '@wordpress/route', () => ( { useNavigate: () => jest.fn() } ) );

const mockUseSendStatus = useSendStatus as jest.Mock;
const mockMounts = jest.fn();

const status = (
	account: boolean,
	onboarding: Partial< SendStatus[ 'onboarding' ] > = {},
	debugLog = false
) =>
	( {
		account: account ? { domain: 'example.com' } : null,
		onboarding: {
			closed_at: null,
			test_sent_at: null,
			verified_seen_at: null,
			...onboarding,
		},
		debug_log: { enabled: debugLog, days: 7, until: null, entries: 0 },
	} ) as unknown as SendStatus;

const Screen = () => {
	useEffect( () => {
		mockMounts();
	}, [] );
	return <p data-testid="screen">Overview</p>;
};

const renderGate = ( current: SendStatus ) => {
	mockUseSendStatus.mockReturnValue( { status: current, error: null, retry: jest.fn() } );
	return render( <StatusGate active="overview">{ () => <Screen /> }</StatusGate> );
};

const content = () =>
	// eslint-disable-next-line testing-library/no-node-access -- The wrapper's class is what's under test.
	screen.getByTestId( 'screen' ).parentElement as HTMLElement;

describe( 'StatusGate', () => {
	beforeEach( () => jest.clearAllMocks() );

	it( 'shows the tab strip from the start and keeps the screen mounted when Log and Settings join it', () => {
		const { rerender } = renderGate( status( false ) );
		expect( screen.getAllByRole( 'tab' ).map( tab => tab.textContent ) ).toEqual( [ 'Overview' ] );

		mockUseSendStatus.mockReturnValue( { status: status( true ), error: null, retry: jest.fn() } );
		rerender( <StatusGate active="overview">{ () => <Screen /> }</StatusGate> );

		expect( screen.getAllByRole( 'tab' ).map( tab => tab.textContent ) ).toEqual( [
			'Overview',
			'Log',
			'Settings',
		] );
		expect( mockMounts ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'keeps the wide column from setup to the dashboard, and not on Settings', () => {
		const { unmount } = renderGate( status( true ) );
		expect( content() ).toHaveClass( 'jetpack-send-page__content--wide' );
		unmount();

		const finished = status( true, { closed_at: '2026-10-18T10:00:00Z' } );
		const { unmount: unmountDashboard } = renderGate( finished );
		expect( content() ).toHaveClass( 'jetpack-send-page__content--wide' );
		unmountDashboard();

		render( <StatusGate active="settings">{ () => <Screen /> }</StatusGate> );
		expect( content() ).not.toHaveClass( 'jetpack-send-page__content--wide' );
	} );

	it( 'keeps setup on screen when a test lands during the visit', () => {
		const { rerender } = renderGate( status( true ) );
		mockUseSendStatus.mockReturnValue( {
			status: status( true, {
				test_sent_at: '2026-10-18T10:00:00Z',
				verified_seen_at: '2026-10-18T10:00:00Z',
			} ),
			error: null,
			retry: jest.fn(),
		} );
		rerender( <StatusGate active="overview">{ () => <Screen /> }</StatusGate> );
		expect( content() ).toHaveClass( 'jetpack-send-page__content--wide' );
	} );

	it.each< [ string, 'overview' | 'debug-log', boolean, string[] ] >( [
		[ 'leaves out the Debug log tab while it’s off', 'overview', false, [] ],
		[ 'shows the Debug log tab while it records', 'overview', true, [ 'Debug log' ] ],
		[
			'keeps the Debug log tab on its own screen once it’s off',
			'debug-log',
			false,
			[ 'Debug log' ],
		],
	] )( '%s', ( _, active, debugLog, extra ) => {
		mockUseSendStatus.mockReturnValue( {
			status: status( true, {}, debugLog ),
			error: null,
			retry: jest.fn(),
		} );
		render( <StatusGate active={ active }>{ () => <Screen /> }</StatusGate> );

		expect( screen.getAllByRole( 'tab' ).map( tab => tab.textContent ) ).toEqual( [
			'Overview',
			'Log',
			'Settings',
			...extra,
		] );
	} );
} );
