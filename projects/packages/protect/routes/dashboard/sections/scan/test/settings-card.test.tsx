import { render, screen } from '@testing-library/react';
import ScanSettingsCard from '../settings-card';
import type { ProtectSettingsData } from '../../../data/use-protect-settings';
import type { ScanState } from '../types';

describe( 'ScanSettingsCard', () => {
	it.each( [
		[ 'without a plan', { hasPlan: false }, /Get Scan/, /nothing to set up/ ],
		[
			'without server credentials',
			{ hasPlan: true, hasCredentials: false },
			/Add server/,
			/needs your server/,
		],
		[
			'with server credentials',
			{ hasPlan: true, hasCredentials: true },
			/Manage server/,
			/uses your server/,
		],
		[
			'when credentials are unknown',
			{ hasPlan: true, hasCredentials: null },
			/Manage server/,
			/uses server/,
		],
	] )( 'describes and links to the right place %s', ( _name, state, link, description ) => {
		render(
			<ScanSettingsCard
				state={ { url: 'https://example.com', error: false, ...state } as ScanState }
				settings={ {} as ProtectSettingsData }
				openTab={ jest.fn() }
			/>
		);

		expect( screen.getByText( description ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: link } ) ).toHaveAttribute(
			'href',
			'https://example.com'
		);
	} );

	it( 'leaves out server credentials where the host needs none', () => {
		render(
			<ScanSettingsCard
				state={ { url: '', error: false, hasPlan: true } as ScanState }
				settings={ {} as ProtectSettingsData }
				openTab={ jest.fn() }
			/>
		);

		expect(
			screen.getByText( 'Scan checks your site for malware every day.' )
		).toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );
} );
