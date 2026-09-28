/**
 * Tests for the PayPal account header and its account menu.
 *
 * @package
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { external, login } from '@wordpress/icons';
import PayPalAccountHeader from '../../../src/paypal-payment-buttons/components/account-header';
import PayPalIcon from '../../../src/paypal-payment-buttons/icon';

// wp.element re-exports React at runtime. Same mock the edit suite uses.
jest.mock( '@wordpress/element', () => ( {
	...require( 'react' ),
	createPortal: require( 'react-dom' ).createPortal,
} ) );

const noop = () => {};

/**
 * Put the inspector in the document, with the cards core would have drawn.
 *
 * @param {object}  options           - Options.
 * @param {boolean} options.hasParent - Also draw the card for an enclosing block.
 * @return {{ inspector: HTMLElement, card: HTMLElement, parentCard: HTMLElement }} The elements.
 */
function openSidebar( { hasParent = false } = {} ) {
	const inspector = document.createElement( 'div' );
	inspector.className = 'block-editor-block-inspector';

	// Core draws the enclosing block's card above the selected block's own.
	let parentCard = null;
	if ( hasParent ) {
		parentCard = document.createElement( 'div' );
		parentCard.className = 'block-editor-block-card is-parent';
		inspector.appendChild( parentCard );
	}

	const card = document.createElement( 'div' );
	card.className = 'block-editor-block-card';
	inspector.appendChild( card );

	document.body.appendChild( inspector );
	return { inspector, card, parentCard };
}

/**
 * Render the header, with props overridden as needed.
 *
 * @param {object} props - Props to set on top of the defaults.
 * @return {object} Testing Library render result.
 */
const renderHeader = props =>
	render(
		<PayPalAccountHeader
			isSelected
			environment="production"
			accountEmail=""
			onLogOut={ noop }
			{ ...props }
		/>
	);

/**
 * Open the account menu.
 *
 * @param {object} user - userEvent instance.
 */
async function openMenu( user ) {
	await user.click( screen.getByRole( 'button', { name: 'PayPal account options' } ) );
}

/**
 * The path an icon draws, read from the icon itself so a swapped import shows up.
 *
 * @param {Element} icon - The icon, from the WordPress icons package.
 * @return {string} Its path data.
 */
const pathOf = icon => icon.props.children.props.d;

/**
 * The path a rendered icon drew.
 *
 * @param {HTMLElement} element - The element holding it.
 * @return {string|undefined} The path data.
 */
// eslint-disable-next-line testing-library/no-node-access -- An SVG has no role, name or text to query by.
const drawnPath = element => element.querySelector( 'svg path' )?.getAttribute( 'd' );

/**
 * A menu item by its label.
 *
 * @param {string} name - The label.
 * @return {HTMLElement} The item.
 */
const item = name => screen.getByRole( 'menuitem', { name } );

describe( 'PayPalAccountHeader', () => {
	// Cleared on the way in, so the header is unmounted before its card goes.
	beforeEach( () => {
		document.body.innerHTML = '';
	} );

	it( 'renders nothing when the sidebar is shut', () => {
		const { container } = renderHeader();

		expect( container ).toBeEmptyDOMElement();
		expect( screen.queryByText( 'PayPal Payment Button' ) ).not.toBeInTheDocument();
	} );

	it( 'leaves the card alone for a block that is not selected', async () => {
		const { card } = openSidebar();

		renderHeader( { isSelected: false } );

		// Nothing to wait for, so give the observer a turn first.
		await Promise.resolve();
		expect( card ).toBeEmptyDOMElement();
	} );

	it( 'finds the card when the sidebar opens after the block mounted', async () => {
		renderHeader();
		expect( screen.queryByText( 'PayPal Payment Button' ) ).not.toBeInTheDocument();

		// Opening the sidebar re-renders no block, so the header has to notice on its own.
		const { card } = openSidebar();

		await waitFor( () =>
			expect( card ).toContainElement( screen.getByText( 'PayPal Payment Button' ) )
		);
	} );

	it( 'moves to the new card when the sidebar closes and opens again', async () => {
		const { inspector } = openSidebar();
		renderHeader();
		await expect( screen.findByText( 'PayPal Payment Button' ) ).resolves.toBeInTheDocument();

		// Core builds a new card on the way back; holding the old one leaves the
		// header in a detached node.
		inspector.remove();
		await waitFor( () =>
			expect( screen.queryByText( 'PayPal Payment Button' ) ).not.toBeInTheDocument()
		);

		const { card } = openSidebar();

		await waitFor( () =>
			expect( card ).toContainElement( screen.getByText( 'PayPal Payment Button' ) )
		);
	} );

	it( 'hands the card over when selection moves to another PayPal block', async () => {
		const { card } = openSidebar();
		const user = userEvent.setup();

		// Two buttons on one post. Both headers stay mounted, and only the
		// selected one takes the card.
		const bothBlocks = selected => (
			<>
				<PayPalAccountHeader
					isSelected={ 'first' === selected }
					environment="production"
					accountEmail="first@sports.com"
					onLogOut={ noop }
				/>
				<PayPalAccountHeader
					isSelected={ 'second' === selected }
					environment="production"
					accountEmail="second@sports.com"
					onLogOut={ noop }
				/>
			</>
		);

		const { rerender } = render( bothBlocks( 'first' ) );
		await waitFor( () =>
			expect( screen.getAllByText( 'PayPal Payment Button' ) ).toHaveLength( 1 )
		);

		rerender( bothBlocks( 'second' ) );

		await waitFor( () =>
			expect( screen.getAllByText( 'PayPal Payment Button' ) ).toHaveLength( 1 )
		);
		expect( card ).toContainElement( screen.getByText( 'PayPal Payment Button' ) );

		// The email says which block has it.
		await openMenu( user );
		expect( screen.getByText( 'second@sports.com' ) ).toBeInTheDocument();
	} );

	it( 'takes the block’s own card and leaves the enclosing block’s alone', async () => {
		const { card, parentCard } = openSidebar( { hasParent: true } );
		renderHeader();

		await waitFor( () =>
			expect( card ).toContainElement( screen.getByText( 'PayPal Payment Button' ) )
		);
		expect( parentCard ).toBeEmptyDOMElement();
	} );

	it( 'renders the PayPal icon, the title and the menu button in the block card', async () => {
		const { card } = openSidebar();

		renderHeader();

		const title = await screen.findByText( 'PayPal Payment Button' );
		expect( card ).toContainElement( title );
		expect( card ).toContainElement(
			screen.getByRole( 'button', { name: 'PayPal account options' } )
		);
		expect( drawnPath( card ) ).toBe( PayPalIcon.props.children[ 0 ].props.d );
	} );

	it( 'lists the three menu items in the order the design draws them', async () => {
		const user = userEvent.setup();
		openSidebar();
		renderHeader();
		await expect( screen.findByText( 'PayPal Payment Button' ) ).resolves.toBeInTheDocument();

		await openMenu( user );

		expect( screen.getAllByRole( 'menuitem' ).map( menuItem => menuItem.textContent ) ).toEqual( [
			'Customize checkout settings',
			'View transactions',
			'Log out',
		] );
	} );

	it( 'puts Log out in a second group, which is what draws the divider', async () => {
		const user = userEvent.setup();
		openSidebar();
		renderHeader();
		await expect( screen.findByText( 'PayPal Payment Button' ) ).resolves.toBeInTheDocument();

		await openMenu( user );

		const groups = screen.getAllByRole( 'group' );
		expect( groups ).toHaveLength( 2 );
		expect(
			within( groups[ 1 ] ).getByRole( 'menuitem', { name: 'Log out' } )
		).toBeInTheDocument();
	} );

	it( 'gives the two PayPal links the external icon and Log out the login icon', async () => {
		const user = userEvent.setup();
		openSidebar();
		renderHeader();
		await expect( screen.findByText( 'PayPal Payment Button' ) ).resolves.toBeInTheDocument();

		await openMenu( user );

		expect( drawnPath( item( 'Customize checkout settings' ) ) ).toBe( pathOf( external ) );
		expect( drawnPath( item( 'View transactions' ) ) ).toBe( pathOf( external ) );
		expect( drawnPath( item( 'Log out' ) ) ).toBe( pathOf( login ) );
	} );

	it( 'links to the sandbox host in a new tab when the environment is sandbox', async () => {
		const user = userEvent.setup();
		openSidebar();
		renderHeader( { environment: 'sandbox' } );
		await expect( screen.findByText( 'PayPal Payment Button' ) ).resolves.toBeInTheDocument();

		await openMenu( user );

		const settings = item( 'Customize checkout settings' );
		expect( settings ).toHaveAttribute( 'href', 'https://www.sandbox.paypal.com/ncp/settings' );
		expect( settings ).toHaveAttribute( 'target', '_blank' );
		expect( settings ).toHaveAttribute( 'rel', 'noopener noreferrer' );

		expect( item( 'View transactions' ) ).toHaveAttribute(
			'href',
			'https://www.sandbox.paypal.com/unifiedtransactions/'
		);
	} );

	it( 'falls back to production for an unknown environment', async () => {
		const user = userEvent.setup();
		openSidebar();
		renderHeader( { environment: '' } );
		await expect( screen.findByText( 'PayPal Payment Button' ) ).resolves.toBeInTheDocument();

		await openMenu( user );

		expect( item( 'Customize checkout settings' ) ).toHaveAttribute(
			'href',
			'https://www.paypal.com/ncp/settings'
		);
	} );

	it( 'draws Log out in the destructive style with the account email under it', async () => {
		const user = userEvent.setup();
		openSidebar();
		renderHeader( { accountEmail: 'junior@sports.com' } );
		await expect( screen.findByText( 'PayPal Payment Button' ) ).resolves.toBeInTheDocument();

		await openMenu( user );

		const logOut = item( /Log out/ );
		expect( logOut ).toHaveClass( 'is-destructive' );
		expect( within( logOut ).getByText( 'junior@sports.com' ) ).toHaveClass(
			'components-menu-item__info'
		);
	} );

	it( 'offers a working Log out for an account with no stored email', async () => {
		const user = userEvent.setup();
		const onLogOut = jest.fn();
		openSidebar();
		renderHeader( { onLogOut } );
		await expect( screen.findByText( 'PayPal Payment Button' ) ).resolves.toBeInTheDocument();

		await openMenu( user );
		const logOut = item( 'Log out' );
		expect( logOut ).toBeEnabled();
		// Anchored, so the label is all the item shows.
		expect( logOut ).toHaveTextContent( /^Log out$/ );

		await user.click( logOut );
		expect( onLogOut ).toHaveBeenCalled();
	} );
} );
