import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PrivacySharingCard from '../privacy-sharing-card';

const renderCard = ( overrides: Partial< Parameters< typeof PrivacySharingCard >[ 0 ] > = {} ) => {
	const onChange = jest.fn();
	render(
		<PrivacySharingCard
			privacy="public"
			displayEmbed
			allowDownloads={ false }
			onChange={ onChange }
			{ ...overrides }
		/>
	);
	return { onChange };
};

const expandCard = async ( user: ReturnType< typeof userEvent.setup > ) =>
	user.click( screen.getByRole( 'button', { name: /privacy & sharing/i } ) );

describe( 'PrivacySharingCard', () => {
	/*
	 * Collapsed by default is a deliberate trade: it keeps the settings column
	 * from outrunning the canvas beside it. The trade only holds if the
	 * collapsed header still answers "what is this set to?", so that is the
	 * part worth pinning.
	 */
	it( 'starts collapsed with the current privacy value in the header', () => {
		renderCard();

		const trigger = screen.getByRole( 'button', { name: /privacy & sharing/i } );

		expect( trigger ).toHaveAttribute( 'aria-expanded', 'false' );
		// The summary reaches assistive tech through `aria-describedby`, not as
		// text inside the name — HeaderDescription is deliberately aria-hidden
		// so it isn't announced twice.
		expect( trigger ).toHaveAccessibleDescription( 'Public' );
	} );

	it( 'reflects a changed privacy value in the collapsed header', () => {
		renderCard( { privacy: 'private' } );

		expect(
			screen.getByRole( 'button', { name: /privacy & sharing/i } )
		).toHaveAccessibleDescription( 'Private' );
	} );

	it( 'reveals the controls when expanded, and reports edits', async () => {
		const user = userEvent.setup();
		const { onChange } = renderCard();

		await expandCard( user );

		expect( screen.getByRole( 'button', { name: /privacy & sharing/i } ) ).toHaveAttribute(
			'aria-expanded',
			'true'
		);

		await user.click( screen.getByRole( 'checkbox', { name: 'Allow downloads' } ) );
		expect( onChange ).toHaveBeenCalledWith( { allowDownloads: true } );
	} );

	/*
	 * `hiddenUntilFound` is CollapsibleCard.Content's default, and it is what
	 * makes collapsing safe rather than lossy: the content stays in the DOM
	 * and the browser's find-in-page expands the card when it matches. Someone
	 * hunting for "Allow downloads" with Ctrl+F still finds it.
	 */
	it( 'keeps collapsed content findable rather than unmounting it', () => {
		renderCard();

		expect(
			screen.getByText( 'Let viewers download this video to their device.' )
		).toBeInTheDocument();
	} );
} );
