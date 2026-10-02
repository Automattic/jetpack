import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

	// Rendering the groups is ConnectionErrorDetails' job; this only checks the hand-off.
	it.each( [
		[ 'error', undefined ],
		[ 'warning', 'warning' as const ],
	] )( 'uses the %s intent for severity %s', ( intent, severity ) => {
		const { container } = render(
			<ConnectionErrorNotice message="Connection failed" severity={ severity } />
		);

		// eslint-disable-next-line testing-library/no-node-access, testing-library/no-container -- The intent is only exposed as a class.
		expect( container.querySelector( `[class*="is-${ intent }"]` ) ).not.toBeNull();
	} );

	it( 'renders the error groups it was given', () => {
		render(
			<ConnectionErrorNotice
				errorGroups={ [
					{
						message: 'The site token is broken.',
						errors: [],
						detailLines: [ { key: 'Site connection', text: 'Site connection' } ],
						noticeLinks: [],
					},
				] }
			/>
		);

		expect( screen.getAllByText( 'The site token is broken.' ).length ).toBeGreaterThan( 0 );
		expect( screen.getAllByRole( 'listitem' ).map( item => item.textContent ) ).toEqual( [
			'- Site connection',
		] );
	} );

	// Exercises the real DOM wiring the package adds — a hand-called handler would
	// pass even if the onClick were never attached to the rendered links.
	it( 'fires the notice-link and support-link callbacks on a real click', async () => {
		const onNoticeLinkClick = jest.fn();
		const onSupportLinkClick = jest.fn();
		const link = { label: 'Visit Site Health', url: '/wp-admin/site-health.php' };

		render(
			<ConnectionErrorNotice
				showSupportLink
				onSupportLinkClick={ onSupportLinkClick }
				onNoticeLinkClick={ onNoticeLinkClick }
				errorGroups={ [
					{ message: 'Blocked.', errors: [], detailLines: [], noticeLinks: [ link ] },
				] }
			/>
		);

		// The click callbacks still fire; this only stops jsdom's real anchor
		// navigation (which logs an unexpected console.error the harness fails on).
		const cancelNavigation = ( event: MouseEvent ) => event.preventDefault();
		document.addEventListener( 'click', cancelNavigation );
		try {
			await userEvent.click( screen.getByRole( 'link', { name: 'Visit Site Health' } ) );
			await userEvent.click( screen.getByRole( 'link', { name: /Contact Jetpack Support/ } ) );
		} finally {
			document.removeEventListener( 'click', cancelNavigation );
		}

		expect( onNoticeLinkClick ).toHaveBeenCalledWith( link );
		expect( onSupportLinkClick ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'renders nothing when there is neither a message nor a group', () => {
		const { container } = render( <ConnectionErrorNotice message="" errorGroups={ [] } /> );

		expect( container ).toBeEmptyDOMElement();
	} );
} );
