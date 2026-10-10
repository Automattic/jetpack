import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { select } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { runFirewallTest } from '../firewall-test';
import FirewallOverviewCard from '../overview-card';
import type { FirewallContext } from '../types';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '../firewall-test', () => ( {
	...jest.requireActual( '../firewall-test' ),
	runFirewallTest: jest.fn(),
} ) );

const props = {
	state: {
		available: true,
		active: true,
		blockedCount: 1,
		recentBlocks: [],
		hasScan: false,
		currentIp: '',
		sharesData: false,
	},
	settings: { settings: null },
	openTab: jest.fn(),
} as unknown as FirewallContext;

describe( 'FirewallOverviewCard', () => {
	it( 'reports the test in a snackbar whose Learn more opens the steps', async () => {
		( runFirewallTest as jest.Mock ).mockResolvedValue( {
			outcome: 'blocked',
			url: 'https://example.com/?jetpack_waf_test=93571da44ce07839f080f22ce422c11b',
			status: 403,
			statusText: '',
			wafHeader: '403 - rule -2',
		} );
		( apiFetch as unknown as jest.Mock ).mockResolvedValue( {
			blockedCount: 2,
			recentBlocks: [ { id: 1, timestamp: '', ruleId: -2, reason: 'firewall test' } ],
		} );
		render( <FirewallOverviewCard { ...props } /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Test firewall' } ) );

		const [ notice ] = select( noticesStore ).getNotices();
		expect( notice ).toMatchObject( {
			type: 'snackbar',
			content: 'The firewall blocked the test request. It’s working.',
			explicitDismiss: true,
		} );
		await act( async () => notice.actions[ 0 ].onClick() );

		const dialog = await screen.findByRole( 'dialog', { name: 'How the firewall test works' } );
		expect( dialog ).toHaveTextContent( 'X-JetpackWAF-Blocked: 403 - rule -2' );
		expect( dialog ).toHaveTextContent( 'Logged the block' );
	} );
} );
