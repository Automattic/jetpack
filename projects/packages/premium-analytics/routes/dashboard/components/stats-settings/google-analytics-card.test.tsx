import { useGoogleAnalyticsSettings } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoogleAnalyticsCard } from './google-analytics-card';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useGoogleAnalyticsSettings: jest.fn(),
} ) );

jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	useTrackEvent: () => jest.fn(),
} ) );

// A spread of the real module reads its lazy exports too early, so only `useDispatch` is swapped.
jest.mock( '@wordpress/data', () => {
	const actual = jest.requireActual( '@wordpress/data' );
	return new Proxy( actual, {
		get: ( target, name ) =>
			name === 'useDispatch'
				? () => ( { createErrorNotice: jest.fn(), createSuccessNotice: jest.fn() } )
				: target[ name ],
	} );
} );

const saveChange = jest.fn( () => Promise.resolve() );

describe( 'GoogleAnalyticsCard', () => {
	beforeEach( () => {
		saveChange.mockClear();
		( useGoogleAnalyticsSettings as jest.Mock ).mockReturnValue( {
			settings: { is_active: true, code: 'G-OLD', anonymize_ip: false },
			isError: false,
			saveChange,
		} );
	} );

	it( 'saves the Measurement ID on Save, not as it is typed', async () => {
		const user = userEvent.setup();
		render( <GoogleAnalyticsCard /> );

		const input = screen.getByRole( 'textbox', { name: 'Google Analytics Measurement ID' } );
		await user.clear( input );
		await user.type( input, ' G-NEW123 ' );
		expect( saveChange ).not.toHaveBeenCalled();

		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );
		expect( saveChange ).toHaveBeenCalledTimes( 1 );
		expect( saveChange ).toHaveBeenCalledWith( { code: 'G-NEW123' } );
	} );

	it( 'keeps Save off for an ID the site would refuse', async () => {
		const user = userEvent.setup();
		render( <GoogleAnalyticsCard /> );

		const input = screen.getByRole( 'textbox', { name: 'Google Analytics Measurement ID' } );
		await user.clear( input );
		await user.type( input, 'not-an-id' );

		expect( screen.getByRole( 'button', { name: 'Save' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );
} );
