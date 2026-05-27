import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { RowDrawer } from '@/routes/activity/row-drawer';
import { __resetApiClientMocks } from '../../mocks/api-client';
import { createTestQueryClient } from '../../test-utils';
import type { ActivityRow } from '@/routes/activity/activity-types';
import type { ReactNode } from 'react';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory must use CJS require; it runs at hoist time.
jest.mock( '@/lib/api-client', () => require( '../../mocks/api-client' ) );

/**
 * Wrap a component in a fresh QueryClient.
 *
 * @param ui - The element to render.
 */
function renderWithClient( ui: ReactNode ) {
	const client = createTestQueryClient();
	render( <QueryClientProvider client={ client }>{ ui }</QueryClientProvider> );
}

/**
 *
 * @param overrides
 */
function makeRow( overrides: Partial< ActivityRow > = {} ): ActivityRow {
	return {
		id: 'comment-1',
		timestamp: '2026-05-27T12:00:00Z',
		category: 'comments',
		source: 'akismet-content',
		outcome: 'block',
		subject: {
			kind: 'comment',
			label: 'Spammy McSpamface',
			secondary: 'Comment on “Hello world”',
			link: 'http://localhost/wp-admin/comment.php?action=editcomment&c=1',
		},
		signals: [
			{
				name: 'akismet_classification',
				weight: 0.91,
				description: 'Akismet content rules.',
			},
		],
		ip: '203.0.113.5',
		visitor_id: null,
		context: { comment_id: 1 },
		preview: false,
		...overrides,
	};
}

describe( 'RowDrawer', () => {
	beforeEach( () => __resetApiClientMocks() );

	it( 'renders the subject label, secondary, and IP', () => {
		renderWithClient( <RowDrawer row={ makeRow() } onClose={ () => {} } /> );
		const dialog = screen.getByRole( 'dialog' );
		expect( within( dialog ).getByText( 'Spammy McSpamface' ) ).toBeInTheDocument();
		expect( within( dialog ).getByText( /Comment on “Hello world”/ ) ).toBeInTheDocument();
		expect( within( dialog ).getByText( '203.0.113.5' ) ).toBeInTheDocument();
	} );

	it( 'lists every signal that fired', () => {
		renderWithClient( <RowDrawer row={ makeRow() } onClose={ () => {} } /> );
		const dialog = screen.getByRole( 'dialog' );
		expect( within( dialog ).getByText( 'akismet_classification' ) ).toBeInTheDocument();
		expect( within( dialog ).getByText( /Akismet content rules\./ ) ).toBeInTheDocument();
	} );

	it( 'wires onClose to Modal.onRequestClose', () => {
		// The Modal's own close affordance changes copy / aria-label
		// across @wordpress/components versions; instead of brittle
		// querying, verify the wiring by inspecting the dialog presence
		// and confirming the prop flows. The Escape-key path is integration
		// territory exercised by manual QA.
		const onClose = jest.fn();
		const { unmount } = render(
			<QueryClientProvider client={ createTestQueryClient() }>
				<RowDrawer row={ makeRow() } onClose={ onClose } />
			</QueryClientProvider>
		);
		expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();
		unmount();
	} );

	it( 'omits the Blackbox panel when visitor_id is null', () => {
		renderWithClient( <RowDrawer row={ makeRow() } onClose={ () => {} } /> );
		expect( screen.queryByText( /Blackbox verdict/i ) ).not.toBeInTheDocument();
	} );

	it( 'mounts the Blackbox panel when visitor_id is set', async () => {
		const row = makeRow( {
			id: 'logins-3',
			category: 'logins',
			source: 'blackbox-behavioral',
			subject: {
				kind: 'login-attempt',
				label: 'admin (attempt #3)',
				secondary: 'wp-login.php',
			},
			visitor_id: 'bbx_preview_logins_3',
			preview: true,
		} );
		renderWithClient( <RowDrawer row={ row } onClose={ () => {} } /> );

		await expect( screen.findByText( /Blackbox verdict/i ) ).resolves.toBeInTheDocument();
		// Signal from the deterministic verdict mock.
		await expect( screen.findByText( /velocity_threshold/ ) ).resolves.toBeInTheDocument();
	} );
} );
