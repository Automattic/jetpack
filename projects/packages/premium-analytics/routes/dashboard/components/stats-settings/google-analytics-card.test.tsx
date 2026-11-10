import { useGoogleAnalyticsSettings } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoogleAnalyticsCard } from './google-analytics-card';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useGoogleAnalyticsSettings: jest.fn(),
} ) );

const mockTrackEvent = jest.fn();
jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	useTrackEvent: () => mockTrackEvent,
} ) );

const mockCreateErrorNotice = jest.fn();

// A spread of the real module reads its lazy exports too early, so only `useDispatch` is swapped.
jest.mock( '@wordpress/data', () => {
	const actual = jest.requireActual( '@wordpress/data' );
	return new Proxy( actual, {
		get: ( target, name ) =>
			name === 'useDispatch'
				? () => ( { createErrorNotice: mockCreateErrorNotice, createSuccessNotice: jest.fn() } )
				: target[ name ],
	} );
} );

const saveChange = jest.fn( () => Promise.resolve() );

describe( 'GoogleAnalyticsCard', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		saveChange.mockImplementation( () => Promise.resolve() );
		( useGoogleAnalyticsSettings as jest.Mock ).mockReturnValue( {
			settings: { is_active: true, code: 'G-OLD', anonymize_ip: false },
			isError: false,
			saveChange,
		} );
	} );

	it( 'saves the Measurement ID on blur, not as it is typed', async () => {
		const user = userEvent.setup();
		render( <GoogleAnalyticsCard /> );

		const input = screen.getByRole( 'textbox', { name: 'Google Analytics Measurement ID' } );
		await user.clear( input );
		await user.type( input, ' G-NEW123 ' );
		expect( saveChange ).not.toHaveBeenCalled();

		await user.tab();
		expect( saveChange ).toHaveBeenCalledTimes( 1 );
		expect( saveChange ).toHaveBeenCalledWith( { code: 'G-NEW123' } );
	} );

	it( 'does not save an ID the site would refuse, and says why', async () => {
		const user = userEvent.setup();
		render( <GoogleAnalyticsCard /> );

		const input = screen.getByRole( 'textbox', { name: 'Google Analytics Measurement ID' } );
		await user.clear( input );
		await user.type( input, 'not-an-id' );
		await user.tab();

		expect( saveChange ).not.toHaveBeenCalled();
		expect( screen.getByText( 'Enter a Measurement ID, such as G-XXXXXXX.' ) ).toBeVisible();
	} );

	it.each( [
		[ 'Enable Google Analytics', { is_active: false }, 'google_analytics_is_active', false ],
		[ 'Anonymize IP addresses', { anonymize_ip: true }, 'google_analytics_anonymize_ip', true ],
	] )( 'saves and records the %s switch', async ( name, values, setting, enabled ) => {
		const user = userEvent.setup();
		render( <GoogleAnalyticsCard /> );

		await user.click( screen.getByRole( 'switch', { name } ) );

		expect( saveChange ).toHaveBeenCalledWith( values );
		expect( mockTrackEvent ).toHaveBeenCalledWith( 'jetpack_premium_analytics_settings_changed', {
			setting,
			enabled,
		} );
	} );

	it( 'shows the reason the site gave for refusing a save, and records nothing', async () => {
		saveChange.mockImplementation( () =>
			Promise.reject( { code: 'invalid_google_analytics_code', message: 'Bad ID.' } )
		);
		const user = userEvent.setup();
		render( <GoogleAnalyticsCard /> );

		await user.click( screen.getByRole( 'switch', { name: 'Anonymize IP addresses' } ) );

		expect( mockCreateErrorNotice ).toHaveBeenCalledWith(
			'Your Google Analytics settings could not be saved: Bad ID.',
			{ id: 'google-analytics-save-failed', type: 'snackbar' }
		);
		expect( mockTrackEvent ).not.toHaveBeenCalled();
	} );
} );
