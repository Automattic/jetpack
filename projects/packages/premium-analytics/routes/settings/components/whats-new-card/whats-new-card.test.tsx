import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WhatsNewCard } from './whats-new-card';

const mockSetIsOn = jest.fn();
const mockTrackWhatsNew = jest.fn();
jest.mock( '@automattic/jetpack-announcements', () => ( {
	useTeaserSwitch: () => ( { isOn: true, setIsOn: mockSetIsOn } ),
	trackWhatsNew: () => mockTrackWhatsNew(),
} ) );

const mockCreateSuccessNotice = jest.fn();
// A spread of the real module reads its lazy exports too early, so only `useDispatch` is swapped.
jest.mock( '@wordpress/data', () => {
	const actual = jest.requireActual( '@wordpress/data' );
	return new Proxy( actual, {
		get: ( target, name ) =>
			name === 'useDispatch'
				? () => ( { createSuccessNotice: mockCreateSuccessNotice } )
				: target[ name ],
	} );
} );

describe( 'WhatsNewCard', () => {
	beforeEach( () => {
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.useRealTimers();
		jest.clearAllMocks();
	} );

	it( 'has the switch tracked, turns the teaser off for the user, and says it was saved', async () => {
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );

		render( <WhatsNewCard /> );
		const toggle = await screen.findByRole( 'checkbox', {
			name: 'Show a teaser when there is something new',
		} );
		// Asked once, when the card loads the module: no other test may load it first.
		expect( mockTrackWhatsNew ).toHaveBeenCalledTimes( 1 );
		expect( toggle ).toBeChecked();
		await user.click( toggle );

		expect( mockSetIsOn ).toHaveBeenCalledWith( false );
		expect( mockCreateSuccessNotice ).toHaveBeenCalledWith( 'Settings saved.', {
			id: 'stats-settings-saved',
			type: 'snackbar',
		} );
	} );
} );
