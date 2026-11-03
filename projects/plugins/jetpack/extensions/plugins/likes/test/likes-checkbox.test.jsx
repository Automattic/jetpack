import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LikesCheckbox from '../likes-checkbox';

let mockActiveModules = [];
const mockEditPost = jest.fn();

jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	useModuleStatus: name => ( {
		isLoadingModules: false,
		isChangingStatus: false,
		isModuleActive: mockActiveModules.includes( name ),
		changeStatus: jest.fn(),
	} ),
	useAnalytics: () => ( { tracks: { recordEvent: jest.fn() } } ),
} ) );

jest.mock( '@wordpress/editor', () => ( {
	PostTypeSupportCheck: ( { children } ) => children,
	store: 'core/editor',
} ) );

jest.mock( '@wordpress/data', () => {
	const mocks = {
		useSelect: selector => selector( () => ( { getEditedPostAttribute: () => false } ) ),
		useDispatch: () => ( { editPost: mockEditPost } ),
	};
	// Keep the real registry so @wordpress/components' own stores still work.
	return new Proxy( jest.requireActual( '@wordpress/data' ), {
		get: ( target, property ) => mocks[ property ] ?? target[ property ],
	} );
} );

jest.mock(
	'../../../shared/jetpack-likes-and-sharing-panel',
	() =>
		( { children } ) =>
			children
);

describe( 'LikesCheckbox', () => {
	beforeEach( () => {
		mockEditPost.mockClear();
	} );

	it( 'offers the Likes switch while the Likes module runs', () => {
		mockActiveModules = [ 'likes', 'comment-likes' ];
		render( <LikesCheckbox /> );

		expect( screen.getByLabelText( 'Show likes' ) ).toBeInTheDocument();
		expect( screen.queryByLabelText( 'Show comment likes' ) ).not.toBeInTheDocument();
	} );

	it( 'offers a Comment Likes switch instead of the nudge when only Comment Likes run', async () => {
		mockActiveModules = [ 'comment-likes' ];
		render( <LikesCheckbox /> );

		expect( screen.queryByRole( 'button', { name: 'Activate Likes' } ) ).not.toBeInTheDocument();

		await userEvent.click( screen.getByLabelText( 'Show comment likes' ) );
		expect( mockEditPost ).toHaveBeenCalledWith( { jetpack_likes_enabled: true } );
	} );

	it( 'nudges to activate Likes when neither module runs', () => {
		mockActiveModules = [];
		render( <LikesCheckbox /> );

		expect( screen.getByRole( 'button', { name: 'Activate Likes' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'checkbox' ) ).not.toBeInTheDocument();
	} );
} );
