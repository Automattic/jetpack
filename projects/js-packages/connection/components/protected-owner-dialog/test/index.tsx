import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';

const mockState: {
	status: string | null;
	isCurrentUserTheOwner: boolean;
	protectedOwner: object | null;
} = {
	status: null,
	isCurrentUserTheOwner: false,
	protectedOwner: null,
};

// Only `useSelect` is replaced. The rest of the module has to stay real, because the connection
// store this component imports registers itself through `combineReducers` on the way in.
const actualData = await import( '@wordpress/data' );

jest.unstable_mockModule( '@wordpress/data', () => ( {
	...actualData,
	__esModule: true,
	useSelect: ( fn: ( select: unknown ) => unknown ) =>
		fn( () => ( {
			getProtectedOwnerStatus: () => mockState.status,
			isCurrentUserTheProtectedOwner: () => mockState.isCurrentUserTheOwner,
			getProtectedOwner: () => mockState.protectedOwner,
		} ) ),
} ) );

const { default: ProtectedOwnerDialog } = await import( '../index' );

const setState = ( status: string | null, isOwner = false, known = true ) => {
	mockState.status = status;
	mockState.isCurrentUserTheOwner = isOwner;
	mockState.protectedOwner = known ? { required: true } : null;
};

/**
 * Stable close handler. Declared rather than assigned as an arrow to a const, because
 * `react/jsx-no-bind` traces the latter through the variable and flags it at every use site.
 */
function onClose() {}

describe( 'ProtectedOwnerDialog', () => {
	it( 'offers the claim only when the user can actually make it', () => {
		setState( 'CAN_ESTABLISH' );
		render( <ProtectedOwnerDialog isOpen onClose={ onClose } /> );

		expect( screen.getByText( /Confirm you own this site/ ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: /Yes, I own this site/ } ) ).toBeInTheDocument();
	} );

	it( 'tells the owner to reconnect when the account is theirs', () => {
		setState( 'NEEDS_OWNER_RECONNECT', true );
		render( <ProtectedOwnerDialog isOpen onClose={ onClose } connectUrl="https://example.com" /> );

		expect( screen.getByText( /Reconnect your account/ ) ).toBeInTheDocument();
	} );

	it( 'tells everyone else that somebody else must connect, not them', () => {
		setState( 'NEEDS_OWNER_RECONNECT', false );
		render( <ProtectedOwnerDialog isOpen onClose={ onClose } connectUrl="https://example.com" /> );

		expect( screen.getByText( /The site owner needs to connect/ ) ).toBeInTheDocument();
		expect( screen.queryByText( /Reconnect your account/ ) ).not.toBeInTheDocument();
	} );

	it( 'offers no action to a user who cannot act', () => {
		setState( 'NOT_ELIGIBLE' );
		render( <ProtectedOwnerDialog isOpen onClose={ onClose } /> );

		expect( screen.getByText( /An administrator is needed/ ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: /I own this site/ } ) ).not.toBeInTheDocument();
	} );

	it( 'renders nothing on a raced state rather than a stale reason', () => {
		setState( 'RE_EVALUATE' );
		render( <ProtectedOwnerDialog isOpen onClose={ onClose } /> );

		// Queried through `screen`, not the render container: Modal portals into document.body, so
		// an empty container is true whether or not the dialog opened.
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'renders nothing when the server withheld the state', () => {
		// null is "cannot say", so guessing a presentation would show a stranger's business.
		// The status is deliberately left as one that WOULD render, so this fails if the
		// withheld check is dropped rather than passing because there was nothing to show.
		setState( 'CAN_ESTABLISH', false, false );
		render( <ProtectedOwnerDialog isOpen onClose={ onClose } /> );

		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( /Confirm you own this site/ ) ).not.toBeInTheDocument();
	} );

	it( 'withholds the connect CTA when there is nowhere to send the user', () => {
		setState( 'NEEDS_CONNECT_TO_ESTABLISH' );
		render( <ProtectedOwnerDialog isOpen onClose={ onClose } /> );

		expect( screen.getByText( /Connect your account first/ ) ).toBeInTheDocument();
		expect(
			screen.queryByRole( 'link', { name: /Connect your account/ } )
		).not.toBeInTheDocument();
	} );
} );
