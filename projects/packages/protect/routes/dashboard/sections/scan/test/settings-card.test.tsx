import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import ScanSettingsCard from '../settings-card';
import type { ProtectSettingsData } from '../../../data/use-protect-settings';
import type { ScanState } from '../types';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );

const settings = ( save = jest.fn() ) =>
	( {
		settings: { jetpack_protect_vulnerability_checks: true },
		isLoaded: true,
		isSaving: () => false,
		save,
	} ) as unknown as ProtectSettingsData;

describe( 'ScanSettingsCard', () => {
	it.each( [
		[ 'without a plan', { hasPlan: false }, /Get Scan/, /known vulnerabilities./ ],
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
				settings={ settings() }
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
				state={ { url: '', error: false, hasPlan: true, needsCredentials: false } as ScanState }
				settings={ settings() }
				openTab={ jest.fn() }
			/>
		);

		expect(
			screen.getByText( 'Scan checks your site for malware every day.' )
		).toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );

	it.each( [
		[ 'without a plan', false, true ],
		[ 'with Scan', true, false ],
	] )( 'offers to turn off the daily check only %s', ( _name, hasPlan, offered ) => {
		render(
			<ScanSettingsCard
				state={ { url: '', error: false, hasPlan } as ScanState }
				settings={ settings() }
				openTab={ jest.fn() }
			/>
		);

		expect( !! screen.queryByRole( 'switch', { name: /vulnerabilities every day/ } ) ).toBe(
			offered
		);
	} );

	it( 're-reads the Scan report once turning the check off is saved', async () => {
		const save = jest.fn().mockResolvedValue( true );
		( apiFetch as unknown as jest.Mock ).mockResolvedValue( { checksEnabled: false } );
		render(
			<ScanSettingsCard
				state={ { url: '', error: false, hasPlan: false } as ScanState }
				settings={ settings( save ) }
				openTab={ jest.fn() }
			/>
		);

		await userEvent.click( screen.getByRole( 'switch', { name: /vulnerabilities every day/ } ) );

		expect( save ).toHaveBeenCalledWith(
			{ jetpack_protect_vulnerability_checks: false },
			undefined
		);
		expect( apiFetch ).toHaveBeenCalledWith( { path: '/jetpack/v4/protect-dashboard/scan' } );
	} );
} );
