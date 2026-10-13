import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { select } from '@wordpress/data';
import { check } from '@wordpress/icons';
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
		ipRules: {
			jetpack_waf_ip_block_list: '203.0.113.7\n203.0.113.8',
			jetpack_waf_ip_block_list_enabled: true,
			jetpack_waf_ip_allow_list: '',
			jetpack_waf_ip_allow_list_enabled: false,
		},
	},
	settings: {
		settings: null,
		error: null,
		isSaving: () => false,
		save: jest.fn().mockResolvedValue( true ),
	},
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
			icon: expect.objectContaining( { props: expect.objectContaining( { icon: check } ) } ),
		} );
		await act( async () => notice.actions[ 0 ].onClick() );

		const dialog = await screen.findByRole( 'dialog', { name: 'How the firewall test works' } );
		expect( dialog ).toHaveTextContent( 'X-JetpackWAF-Blocked: 403 - rule -2' );
		expect( dialog ).toHaveTextContent( 'Logged the block' );
	} );

	it( 'shows the IP lists from page load before settings are fetched', () => {
		render( <FirewallOverviewCard { ...props } /> );

		expect(
			screen.getByRole( 'checkbox', { name: /Block specific IP addresses\s*2/ } )
		).toBeChecked();
		expect(
			screen.getByRole( 'checkbox', { name: /Always allow specific IP addresses\s*0/ } )
		).not.toBeChecked();
	} );

	it( 'saves an edited block list from its dialog', async () => {
		render( <FirewallOverviewCard { ...props } /> );

		await userEvent.click( screen.getByRole( 'button', { name: 'Edit block list' } ) );
		const dialog = await screen.findByRole( 'dialog', { name: 'Blocked IP addresses' } );
		const field = within( dialog ).getByRole( 'textbox', { name: 'IP addresses' } );
		expect( field ).toHaveValue( '203.0.113.7\n203.0.113.8' );
		await userEvent.clear( field );
		await userEvent.type( field, '198.51.100.1' );
		await userEvent.click( within( dialog ).getByRole( 'button', { name: 'Save' } ) );

		expect( props.settings.save ).toHaveBeenCalledWith( {
			jetpack_waf_ip_block_list: '198.51.100.1',
		} );
	} );
} );
