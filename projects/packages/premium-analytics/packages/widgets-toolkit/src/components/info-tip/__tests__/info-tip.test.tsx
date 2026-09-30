/**
 * External dependencies
 */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { InfoTip } from '../info-tip';

const TIP = 'Views shaded by country.';

// Past the trigger's 200ms open and close delays; async so the popover's own
// follow-up updates land inside act.
async function elapseDelay() {
	await act( async () => {
		jest.advanceTimersByTime( 500 );
	} );
}

describe( 'InfoTip', () => {
	beforeEach( () => {
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'opens the explanation from a button named by the label', async () => {
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		render( <InfoTip label="About Views">{ TIP }</InfoTip> );

		expect( screen.queryByText( TIP ) ).not.toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'About Views' } ) );
		await elapseDelay();

		expect( screen.getByText( TIP ) ).toBeInTheDocument();
	} );

	it( 'closes on Escape', async () => {
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		render( <InfoTip label="About Views">{ TIP }</InfoTip> );

		await user.click( screen.getByRole( 'button', { name: 'About Views' } ) );
		await elapseDelay();
		expect( screen.getByText( TIP ) ).toBeInTheDocument();

		await user.keyboard( '{Escape}' );
		await elapseDelay();

		expect( screen.queryByText( TIP ) ).not.toBeInTheDocument();
	} );

	it( 'opens on hover only when asked to', async () => {
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		const { unmount } = render( <InfoTip label="About Views">{ TIP }</InfoTip> );

		await user.hover( screen.getByRole( 'button', { name: 'About Views' } ) );
		await elapseDelay();
		expect( screen.queryByText( TIP ) ).not.toBeInTheDocument();
		unmount();

		render(
			<InfoTip label="About Views" openOnHover>
				{ TIP }
			</InfoTip>
		);

		await user.hover( screen.getByRole( 'button', { name: 'About Views' } ) );
		await elapseDelay();

		expect( screen.getByText( TIP ) ).toBeInTheDocument();
	} );
} );
