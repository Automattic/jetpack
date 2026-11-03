import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS } from '../../../shared/memberships/constants';
import { store as membershipProductsStore } from '../../../store/membership-products';
import NewsletterCategoriesPanel from '../newsletter-categories-panel';

jest.mock( '@wordpress/data', () => {
	const actual = jest.requireActual( '@wordpress/data' );
	const mocks = { useSelect: jest.fn(), useDispatch: jest.fn() };
	return new Proxy( actual, {
		get( target, property ) {
			return mocks[ property ] ?? target[ property ];
		},
	} );
} );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	...jest.requireActual( '@automattic/jetpack-script-data' ),
	getAdminUrl: ( path: string ) => `https://example.com/wp-admin/${ path }`,
} ) );

const mockEditPost = jest.fn();

const makeCategories = ( count: number ) =>
	Array.from( { length: count }, ( _, index ) => ( {
		id: index + 10,
		name: `Category ${ index + 1 }`,
	} ) );

const MOVIES = { id: 2, name: 'Movies' };
const TV = { id: 3, name: 'TV' };

const renderPanel = ( {
	isLoading = false,
	isEnabled = true,
	newsletterCategories = [ MOVIES, TV ],
	postCategories = [ 1 ],
	isEmailEnabled = true,
} = {} ) => {
	const select = ( store: unknown ) => {
		if ( store === membershipProductsStore ) {
			return {
				getNewsletterCategories: () => newsletterCategories,
				getNewsletterCategoriesEnabled: () => isEnabled,
				hasFinishedResolution: () => ! isLoading,
			};
		}
		if ( store === editorStore ) {
			return {
				getEditedPostAttribute: ( attribute: string ) =>
					attribute === 'categories'
						? postCategories
						: { [ META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS ]: ! isEmailEnabled },
			};
		}
		return {};
	};
	( useSelect as jest.Mock ).mockImplementation( selector => selector( select ) );
	return render( <NewsletterCategoriesPanel /> );
};

describe( 'NewsletterCategoriesPanel', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		( useDispatch as jest.Mock ).mockReturnValue( { editPost: mockEditPost } );
	} );

	it.each( [
		[ 'turned off', { isEnabled: false } ],
		[ 'on but empty', { newsletterCategories: [] } ],
	] )( 'offers setup instead of a list when categories are %s', ( _, options ) => {
		renderPanel( options );

		expect( screen.getByRole( 'link', { name: /Set up newsletter categories/ } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( 'admin.php?page=jetpack-newsletter' )
		);
		expect( screen.queryByRole( 'checkbox' ) ).not.toBeInTheDocument();
	} );

	it( 'explains who gets the post when a category is selected', () => {
		const { container } = renderPanel( { postCategories: [ 1, MOVIES.id ] } );

		expect(
			within( container ).getByText( /subscribers and those who chose these categories/ )
		).toBeInTheDocument();
		expect( screen.getByRole( 'checkbox', { name: 'Movies' } ) ).toBeChecked();
	} );

	it( 'removes only the unticked category', async () => {
		const user = userEvent.setup();
		renderPanel( { postCategories: [ 1, MOVIES.id, TV.id ] } );

		await user.click( screen.getByRole( 'checkbox', { name: 'Movies' } ) );

		expect( mockEditPost ).toHaveBeenCalledWith( { categories: [ 1, TV.id ] } );
	} );

	it( 'disables the checkboxes when the post will not be emailed', () => {
		const { container } = renderPanel( { isEmailEnabled: false } );

		expect(
			within( container ).getByText(
				'Categories apply only when this post is emailed to subscribers.'
			)
		).toBeInTheDocument();
		expect( screen.getByRole( 'checkbox', { name: 'Movies' } ) ).toBeDisabled();
	} );

	it( 'filters long lists by the search term', async () => {
		const user = userEvent.setup();
		renderPanel( { newsletterCategories: makeCategories( 10 ) } );

		await user.type( screen.getByRole( 'searchbox' ), 'Category 10' );

		expect( screen.getByRole( 'checkbox', { name: 'Category 10' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'checkbox', { name: 'Category 1' } ) ).not.toBeInTheDocument();
	} );
} );
