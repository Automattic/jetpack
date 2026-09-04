import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSelect } from '@wordpress/data';
import NewsletterMenu from '../menu';

// Render the sidebar and its children inline; the real slot-fill machinery isn't
// available in the jest environment.
jest.mock( '@wordpress/editor', () => ( {
	PluginSidebar: ( { children } ) => <div>{ children }</div>,
} ) );

jest.mock( '@wordpress/data', () => {
	const actual = jest.requireActual( '@wordpress/data' );
	const mocks = { useSelect: jest.fn() };
	return new Proxy( actual, {
		get( target, property ) {
			return mocks[ property ] ?? target[ property ];
		},
	} );
} );

// Keep the sidebar's child panels out of the way — they pull in unrelated stores.
jest.mock( '../../../shared/memberships/edit', () => ( {
	useAccessLevel: () => 'everybody',
} ) );
jest.mock( '../../../shared/memberships/settings', () => ( {
	NewsletterEmailDocumentSettings: () => null,
} ) );
jest.mock( '../../../shared/memberships/subscribers-affirmation', () => () => null );
jest.mock( '../email-preview', () => ( {
	NewsletterTestEmailModal: () => null,
} ) );

const mockPost = ( overrides = {} ) => {
	const attrs = { postId: 123, postType: 'post', postStatus: 'draft', meta: {}, ...overrides };
	useSelect.mockImplementation( () => ( {
		postId: attrs.postId,
		postType: attrs.postType,
		postStatus: attrs.postStatus,
		meta: attrs.meta,
	} ) );
};

describe( 'NewsletterMenu', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'exposes the Preview email button (available regardless of connection state)', () => {
		mockPost();

		render( <NewsletterMenu openPreviewModal={ jest.fn() } /> );

		expect( screen.getByRole( 'button', { name: 'Preview email' } ) ).toBeEnabled();
		expect( screen.getByRole( 'button', { name: 'Send test email' } ) ).toBeInTheDocument();
	} );

	it( 'opens the preview modal when the Preview email button is clicked', async () => {
		const user = userEvent.setup();
		const openPreviewModal = jest.fn();
		mockPost();

		render( <NewsletterMenu openPreviewModal={ openPreviewModal } /> );

		await user.click( screen.getByRole( 'button', { name: 'Preview email' } ) );

		expect( openPreviewModal ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'hides the preview and send buttons once the post is published', () => {
		mockPost( { postStatus: 'publish' } );

		render( <NewsletterMenu openPreviewModal={ jest.fn() } /> );

		expect( screen.queryByRole( 'button', { name: 'Preview email' } ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Send test email' } ) ).not.toBeInTheDocument();
	} );
} );
