import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import ConnectionErrorNotice from '../index';
import type { ActionItem } from '../types';

describe( 'ConnectionErrorNotice', () => {
	it( 'should not render when message is empty', () => {
		const { container } = render( <ConnectionErrorNotice message="" /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render error message', () => {
		render( <ConnectionErrorNotice message="Connection failed" /> );
		// Message appears in both the notice and accessibility regions
		const messageElements = screen.getAllByText( 'Connection failed' );
		expect( messageElements.length ).toBeGreaterThan( 0 );
	} );

	it( 'should render with default restore connection action when restoreConnectionCallback is provided', () => {
		const mockCallback = jest.fn();
		render(
			<ConnectionErrorNotice
				message="Connection needs to be restored"
				restoreConnectionCallback={ mockCallback }
			/>
		);

		expect( screen.getAllByText( 'Connection needs to be restored' ).length ).toBeGreaterThan( 0 );
		expect( screen.getByText( 'Restore Connection' ) ).toBeInTheDocument();
	} );

	it( 'should render custom actions when provided', () => {
		const actions: ActionItem[] = [
			{
				label: 'Custom Action',
				onClick: jest.fn(),
				variant: 'primary',
			},
		];

		render( <ConnectionErrorNotice message="Custom error occurred" actions={ actions } /> );

		expect( screen.getAllByText( 'Custom error occurred' ).length ).toBeGreaterThan( 0 );
		expect( screen.getByText( 'Custom Action' ) ).toBeInTheDocument();
	} );

	it( 'should show loading state when isRestoringConnection is true', () => {
		render(
			<ConnectionErrorNotice
				message="Connection is being restored"
				isRestoringConnection={ true }
			/>
		);

		// Message appears in both the notice and accessibility regions
		const loadingElements = screen.getAllByText( 'Reconnecting Jetpack' );
		expect( loadingElements.length ).toBeGreaterThan( 0 );
	} );

	it( 'should show restore connection error when provided', () => {
		render(
			<ConnectionErrorNotice
				message="Original connection error"
				restoreConnectionError="Failed to reconnect"
			/>
		);

		expect( screen.getByText( /There was an error reconnecting Jetpack/ ) ).toBeInTheDocument();
		expect( screen.getByText( /Failed to reconnect/ ) ).toBeInTheDocument();
	} );

	it( 'should render multiple custom actions', () => {
		const actions: ActionItem[] = [
			{
				label: 'First Action',
				onClick: jest.fn(),
				variant: 'primary',
			},
			{
				label: 'Second Action',
				onClick: jest.fn(),
				variant: 'secondary',
			},
		];

		render( <ConnectionErrorNotice message="Multiple actions available" actions={ actions } /> );

		expect( screen.getAllByText( 'Multiple actions available' ).length ).toBeGreaterThan( 0 );
		expect( screen.getByText( 'First Action' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Second Action' ) ).toBeInTheDocument();
	} );

	it( 'should render a feature context line above the message when provided', () => {
		render(
			<ConnectionErrorNotice
				message="WordPress.com reached your site but the request was blocked."
				context="Your activity log couldn’t load."
			/>
		);

		expect( screen.getAllByText( 'Your activity log couldn’t load.' ).length ).toBeGreaterThan( 0 );
		expect(
			screen.getAllByText( 'WordPress.com reached your site but the request was blocked.' ).length
		).toBeGreaterThan( 0 );
	} );

	it( 'should render primary and secondary buttons', () => {
		const actions: ActionItem[] = [
			{
				label: 'Primary Action',
				onClick: jest.fn(),
				variant: 'primary',
			},
			{
				label: 'Secondary Action',
				onClick: jest.fn(),
				variant: 'secondary',
			},
		];

		render( <ConnectionErrorNotice message="Testing secondary button" actions={ actions } /> );

		expect( screen.getByText( 'Primary Action' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Secondary Action' ) ).toBeInTheDocument();
	} );

	// The whole error set, not just the first: the hook derives the groups and the
	// notice renders every one of them, each with the scopes it applies to.
	it( 'renders every error group with its scope lines', () => {
		render(
			<ConnectionErrorNotice
				errorGroups={ [
					{
						message: 'The site token is broken.',
						errors: [],
						detailLines: [ { key: 'Site connection', text: 'Site connection' } ],
						noticeLinks: [],
					},
					{
						message: 'Your user token is broken.',
						errors: [],
						detailLines: [ { key: 'Your account', text: 'Your account' } ],
						noticeLinks: [],
					},
				] }
			/>
		);

		expect( screen.getAllByText( 'The site token is broken.' ).length ).toBeGreaterThan( 0 );
		expect( screen.getAllByText( 'Your user token is broken.' ).length ).toBeGreaterThan( 0 );
		// Marked up as list items, so assistive tech announces how many scopes an
		// error covers rather than reading loose lines.
		expect( screen.getAllByRole( 'listitem' ).map( item => item.textContent ) ).toEqual( [
			'- Site connection',
			'- Your account',
		] );
	} );

	// A blocked request suppresses the reconnect CTA, so without this link the
	// notice would name a problem and offer nothing to do about it. Rendered
	// inside the error's own group, not pooled elsewhere in the notice, so it
	// stays attached to the message it belongs to when other groups are present.
	it( 'renders a notice link directly under the error group that asked for it', () => {
		render(
			<ConnectionErrorNotice
				errorGroups={ [
					{
						message: 'WordPress.com requests to your site are being blocked.',
						errors: [],
						detailLines: [],
						noticeLinks: [ { label: 'Visit Site Health', url: '/wp-admin/site-health.php' } ],
					},
					{
						message: 'Your user token is broken.',
						errors: [],
						detailLines: [],
						noticeLinks: [],
					},
				] }
			/>
		);

		const link = screen.getByRole( 'link', { name: 'Visit Site Health' } );

		expect( link ).toHaveAttribute( 'href', '/wp-admin/site-health.php' );

		// The claim is structural — the link lives inside its own group's subtree,
		// not merely somewhere in the notice — and no role or text query can express
		// containment, so walk up to the group element to make it.
		// eslint-disable-next-line testing-library/no-node-access -- Asserting DOM containment; see above.
		const group = link.closest( 'div' );

		expect( group ).toHaveTextContent(
			/^WordPress\.com requests to your site are being blocked\./
		);
		expect( group ).toContainElement( link );
	} );

	it( 'offers the support link when the error asks for one', () => {
		render( <ConnectionErrorNotice message="Something is off." showSupportLink /> );

		expect( screen.getAllByText( /Still having trouble\?/ ).length ).toBeGreaterThan( 0 );
	} );

	it( 'renders nothing when there is neither a message nor a group', () => {
		const { container } = render( <ConnectionErrorNotice message="" errorGroups={ [] } /> );

		expect( container ).toBeEmptyDOMElement();
	} );
} );
