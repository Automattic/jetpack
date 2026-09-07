import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PublicizeInactiveEmptyState from '../publicize-inactive-empty-state';
import { useTurnOnSocial } from '../turn-on-social-context';

// Drive the empty state purely through the turn-on context so this suite
// isolates its render + click behavior from the enable/reload plumbing.
jest.mock( '../turn-on-social-context', () => ( { useTurnOnSocial: jest.fn() } ) );

const mockUseTurnOnSocial = useTurnOnSocial as jest.Mock;

describe( 'PublicizeInactiveEmptyState', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'renders the turn-on CTA and calls turnOn when clicked', async () => {
		const turnOn = jest.fn();
		mockUseTurnOnSocial.mockReturnValue( { isEnabling: false, turnOn } );

		render( <PublicizeInactiveEmptyState /> );

		expect( screen.getByText( 'Auto-sharing is turned off' ) ).toBeInTheDocument();
		const button = screen.getByRole( 'button', { name: 'Turn on Social' } );
		expect( button ).toBeEnabled();

		await userEvent.click( button );
		expect( turnOn ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'shows a busy, disabled button while enabling', () => {
		mockUseTurnOnSocial.mockReturnValue( { isEnabling: true, turnOn: jest.fn() } );

		render( <PublicizeInactiveEmptyState /> );

		// The WPDS Button stays focusable and marks itself busy via aria-disabled
		// rather than the native disabled attribute.
		expect( screen.getByRole( 'button', { name: 'Turning on Social…' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );
} );
