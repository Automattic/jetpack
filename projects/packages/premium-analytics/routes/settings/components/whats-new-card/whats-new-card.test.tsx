import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WhatsNewCard } from './whats-new-card';

const mockSetIsOn = jest.fn();
jest.mock( '@automattic/jetpack-announcements', () => ( {
	useTeaserSwitch: () => ( { isOn: true, setIsOn: mockSetIsOn } ),
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

const setFlag = ( enabled: boolean ) => {
	window.JetpackScriptData = {
		premium_analytics: { whats_new_enabled: enabled },
	} as typeof window.JetpackScriptData;
};

describe( 'WhatsNewCard', () => {
	beforeEach( () => {
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.useRealTimers();
		jest.clearAllMocks();
		delete window.JetpackScriptData;
	} );

	it( 'draws nothing while What’s new is off for the site', () => {
		setFlag( false );

		const { container } = render( <WhatsNewCard /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'turns the teaser off for the user, and says it was saved', async () => {
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		setFlag( true );

		render( <WhatsNewCard /> );
		const toggle = await screen.findByRole( 'checkbox', {
			name: 'Show a teaser when there is something new',
		} );
		expect( toggle ).toBeChecked();
		await user.click( toggle );

		expect( mockSetIsOn ).toHaveBeenCalledWith( false );
		expect( mockCreateSuccessNotice ).toHaveBeenCalledWith( 'Settings saved.', {
			id: 'stats-settings-saved',
			type: 'snackbar',
		} );
	} );
} );
