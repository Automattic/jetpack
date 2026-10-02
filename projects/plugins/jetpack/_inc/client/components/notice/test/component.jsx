import { render, screen } from 'test/test-utils';
import SimpleNotice from '../index';
import NoticeAction from '../notice-action';

describe( 'SimpleNotice', () => {
	it( 'renders its children as the body when there is no text', () => {
		render( <SimpleNotice>Body copy</SimpleNotice> );
		expect( screen.getByText( 'Body copy' ) ).toBeInTheDocument();
	} );

	it( 'renders children as actions when text is set', () => {
		render(
			<SimpleNotice text="The message">
				<NoticeAction href="https://example.com/go">Do the thing</NoticeAction>
			</SimpleNotice>
		);
		expect( screen.getByText( 'The message' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: /Do the thing/ } ) ).toHaveAttribute(
			'href',
			'https://example.com/go'
		);
	} );

	it( 'renders a title above the body', () => {
		render(
			<SimpleNotice title="The heading">
				<div>The body</div>
			</SimpleNotice>
		);
		expect( screen.getByText( 'The heading' ) ).toBeInTheDocument();
		expect( screen.getByText( 'The body' ) ).toBeInTheDocument();
	} );

	it.each( [
		[ 'is-error', 'error' ],
		[ 'is-warning', 'warning' ],
		[ 'is-success', 'success' ],
		[ 'is-info', 'info' ],
	] )( 'maps status %s to the %s intent', ( status, intent ) => {
		const { container } = render( <SimpleNotice status={ status }>Text</SimpleNotice> );
		// eslint-disable-next-line testing-library/no-container
		expect( container.querySelector( '.jp-notice' ).className ).toMatch(
			new RegExp( `is-${ intent }` )
		);
	} );

	// Regression: `display` used to unmount the subtree. Children such as
	// NoticeActionReconnect record a Tracks event on mount, so it must hide instead.
	it( 'keeps the notice mounted but hidden when display is false', () => {
		const onMount = jest.fn();
		const Child = () => {
			onMount();
			return <span>Still here</span>;
		};

		const { container } = render(
			<SimpleNotice display={ false }>
				<Child />
			</SimpleNotice>
		);

		// eslint-disable-next-line testing-library/no-container
		expect( container.querySelector( '.jp-notice' ) ).toHaveClass( 'is-hidden' );
		expect( onMount ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not re-mount its children when display flips', () => {
		const onMount = jest.fn();
		const Child = () => {
			onMount();
			return <span>Child</span>;
		};

		const { rerender } = render(
			<SimpleNotice display={ true }>
				<Child />
			</SimpleNotice>
		);
		onMount.mockClear();

		rerender(
			<SimpleNotice display={ false }>
				<Child />
			</SimpleNotice>
		);
		rerender(
			<SimpleNotice display={ true }>
				<Child />
			</SimpleNotice>
		);

		// Re-renders, but never a fresh mount.
		expect( screen.getByText( 'Child' ) ).toBeInTheDocument();
		expect( onMount ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'calls onDismissClick from the close button', async () => {
		const onDismissClick = jest.fn();
		render(
			<SimpleNotice text="Dismiss me" onDismissClick={ onDismissClick } dismissText="Dismiss" />
		);
		screen.getByRole( 'button', { name: 'Dismiss' } ).click();
		expect( onDismissClick ).toHaveBeenCalled();
	} );

	it( 'renders no close button when showDismiss is false', () => {
		render( <SimpleNotice showDismiss={ false } text="No dismissing" /> );
		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );
} );

describe( 'NoticeAction', () => {
	it( 'renders a button when it has no href', () => {
		const onClick = jest.fn();
		render(
			<SimpleNotice text="With an action">
				<NoticeAction onClick={ onClick }>Press me</NoticeAction>
			</SimpleNotice>
		);
		screen.getByRole( 'button', { name: 'Press me' } ).click();
		expect( onClick ).toHaveBeenCalled();
	} );

	it( 'opens external links in a new tab', () => {
		render(
			<SimpleNotice text="With a link">
				<NoticeAction href="https://example.com/docs" external>
					Read the docs
				</NoticeAction>
			</SimpleNotice>
		);
		expect( screen.getByRole( 'link', { name: /Read the docs/ } ) ).toHaveAttribute(
			'target',
			'_blank'
		);
	} );
} );
