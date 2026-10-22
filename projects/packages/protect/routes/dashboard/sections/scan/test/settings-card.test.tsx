import { render, screen } from '@testing-library/react';
import ScanSettingsCard from '../settings-card';
import type { ProtectSettingsData } from '../../../data/use-protect-settings';
import type { ScanState } from '../types';

describe( 'ScanSettingsCard', () => {
	it.each( [
		[ 'without a plan', { hasPlan: false }, /Get Scan/ ],
		[ 'without server credentials', { hasPlan: true, hasCredentials: false }, /Add server/ ],
		[ 'with server credentials', { hasPlan: true, hasCredentials: true }, /Manage server/ ],
		[ 'when credentials are unknown', { hasPlan: true, hasCredentials: null }, /Manage server/ ],
	] )( 'links to the right place %s', ( _name, state, link ) => {
		render(
			<ScanSettingsCard
				state={ { url: 'https://example.com', error: false, ...state } as ScanState }
				settings={ {} as ProtectSettingsData }
				openTab={ jest.fn() }
			/>
		);

		expect( screen.getByRole( 'link', { name: link } ) ).toHaveAttribute(
			'href',
			'https://example.com'
		);
	} );
} );
