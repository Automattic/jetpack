import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS } from '../../../shared/memberships/constants';
import { store as membershipProductsStore } from '../../../store/membership-products';
import NewsletterOverview, { NewsletterOverviewTitle } from '../newsletter-overview';

const mockOpenGeneralSidebar = jest.fn();

jest.mock( '@wordpress/data', () => {
	const actual = jest.requireActual( '@wordpress/data' );
	const mocks = {
		useSelect: jest.fn(),
		useDispatch: jest.fn(),
		// Only the edit-post store is faked: other packages dispatch to real stores while loading.
		dispatch: ( store: unknown ) =>
			store === 'core/edit-post'
				? { openGeneralSidebar: mockOpenGeneralSidebar }
				: actual.dispatch( store ),
	};
	return new Proxy( actual, {
		get( target, property ) {
			return mocks[ property ] ?? target[ property ];
		},
	} );
} );

const mockSetSendEmail = jest.fn();
jest.mock( '../../../shared/memberships/settings', () => ( {
	...jest.requireActual( '../../../shared/memberships/settings' ),
	useSetSendEmail: () => mockSetSendEmail,
} ) );

jest.mock( '../../../shared/memberships/subscribers-affirmation', () => ( {
	...jest.requireActual( '../../../shared/memberships/subscribers-affirmation' ),
	__esModule: true,
	default: () => <p>Subscribers affirmation</p>,
} ) );

const mockClosePublishSidebar = jest.fn();
// WordPress's default category, never a newsletter category here.
const UNCATEGORIZED_ID = 1;
const MOVIES = { id: 2, name: 'Movies' };
const TV = { id: 3, name: 'TV' };

const mockEditor = ( {
	visibility = 'public',
	isPublished = false,
	meta = {},
	postCategories = [ UNCATEGORIZED_ID ],
	blocks = [],
	categoriesEnabled = false,
	newsletterCategories = [ MOVIES, TV ],
	tierProducts = [],
}: {
	visibility?: string;
	isPublished?: boolean;
	meta?: Record< string, unknown >;
	postCategories?: number[];
	blocks?: { name: string }[];
	categoriesEnabled?: boolean;
	newsletterCategories?: { id: number; name: string }[];
	tierProducts?: { id: number; title: string }[];
} = {} ) => {
	const select = ( store: unknown ) => {
		if ( store === editorStore ) {
			return {
				getCurrentPostId: () => 42,
				getEditedPostAttribute: ( attribute: string ) =>
					attribute === 'categories' ? postCategories : meta,
				getEditedPostVisibility: () => visibility,
				isCurrentPostPublished: () => isPublished,
			};
		}
		if ( store === membershipProductsStore ) {
			return {
				getNewsletterCategories: () => newsletterCategories,
				getNewsletterCategoriesEnabled: () => categoriesEnabled,
				getNewsletterTierProducts: () => tierProducts,
				getPostEmailSentState: () => null,
			};
		}
		if ( store === blockEditorStore ) {
			return { getBlocks: () => blocks };
		}
		return {};
	};
	( useSelect as jest.Mock ).mockImplementation( selector => selector( select ) );
};

const renderOverview = ( accessLevel = 'everybody', prePublish = false ) =>
	render(
		<NewsletterOverview
			accessLevel={ accessLevel }
			prePublish={ prePublish }
			openPreviewModal={ jest.fn() }
			openTestEmailModal={ jest.fn() }
		/>
	);

describe( 'NewsletterOverview', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		( useDispatch as jest.Mock ).mockReturnValue( {
			closePublishSidebar: mockClosePublishSidebar,
		} );
	} );

	it( 'should offer to turn email back on instead of previews when email is off', async () => {
		const user = userEvent.setup();
		mockEditor( { meta: { [ META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS ]: true } } );
		renderOverview( 'subscribers' );

		expect( screen.queryByRole( 'button', { name: 'Preview email' } ) ).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'Change newsletter settings' } )
		).not.toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Turn on email sending' } ) );

		expect( mockSetSendEmail ).toHaveBeenCalledWith( true );
	} );

	// The editor counts a saved private post as published, so this must win over the published view.
	it( 'says a private post won’t be emailed, even once it is saved', () => {
		mockEditor( { visibility: 'private', isPublished: true } );
		renderOverview( 'subscribers' );
		render( <NewsletterOverviewTitle accessLevel="subscribers" /> );

		expect( screen.getByText( 'This post is private' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Subscribers affirmation' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Preview email' } ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Newsletter' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Subscribers' ) ).not.toBeInTheDocument();
	} );

	// The post mixes a regular category with a newsletter one, and the site has a second
	// newsletter category the post doesn't use: only the one both share should be listed.
	it( 'lists the newsletter categories the post is in, and no others', () => {
		mockEditor( {
			categoriesEnabled: true,
			newsletterCategories: [ MOVIES, TV ],
			postCategories: [ UNCATEGORIZED_ID, MOVIES.id ],
		} );
		renderOverview( 'subscribers' );

		expect( screen.getAllByRole( 'listitem' ).map( item => item.textContent ) ).toEqual( [
			'Movies',
		] );
		expect(
			screen.getByText(
				'This post is emailed to subscribers who chose these newsletter categories.'
			)
		).toBeInTheDocument();
	} );

	// Subscribers' category choices only apply while the feature is on; off, everyone is emailed.
	it( 'emails every subscriber while newsletter categories are turned off', () => {
		mockEditor( {
			categoriesEnabled: false,
			newsletterCategories: [ MOVIES, TV ],
			postCategories: [ MOVIES.id ],
		} );
		renderOverview( 'subscribers' );

		expect( screen.queryByRole( 'listitem' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'This post is emailed to all subscribers.' ) ).toBeInTheDocument();
	} );

	it( 'closes the pre-publish panel before opening the Newsletter sidebar', async () => {
		const user = userEvent.setup();
		mockEditor();
		renderOverview( 'everybody', true );

		await user.click( screen.getByRole( 'button', { name: 'Change newsletter settings' } ) );

		expect( mockClosePublishSidebar ).toHaveBeenCalled();
		expect( mockOpenGeneralSidebar ).toHaveBeenCalledWith(
			'jetpack-subscriptions/jetpack-newsletter-settings-sidebar'
		);
	} );

	it( 'reports what happened once the post is published', () => {
		mockEditor( { isPublished: true } );
		renderOverview( 'subscribers' );

		expect( screen.getByText( 'Subscribers affirmation' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Preview email' } ) ).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Change newsletter settings' } )
		).toBeInTheDocument();
	} );
} );
