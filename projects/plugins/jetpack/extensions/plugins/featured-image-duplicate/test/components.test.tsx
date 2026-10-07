import { render, screen } from '@testing-library/react';
import { HiddenSync, withHiddenFeaturedImageBlock } from '../components';

let mockDuplicate: Record< string, unknown >;
const mockSetHidden = jest.fn();
let mockEditor: { postId: number; hidden: boolean };

jest.mock( '..', () => ( {
	HIDE_META_KEY: '_jetpack_hide_featured_image',
	useFeaturedImageDuplicate: () => ( { ...mockDuplicate, setHidden: mockSetHidden } ),
} ) );
jest.mock( '@wordpress/editor', () => ( { store: 'core/editor', PostPreviewButton: () => null } ) );
jest.mock( '@wordpress/data', () => {
	const mocks = {
		useSelect: selector =>
			selector( () => ( {
				getCurrentPostId: () => mockEditor.postId,
				getEditedPostAttribute: () => ( { _jetpack_hide_featured_image: mockEditor.hidden } ),
			} ) ),
	};
	// Keep the real registry so @wordpress/components' own stores still work.
	return new Proxy( jest.requireActual( '@wordpress/data' ), {
		get: ( target, property ) => mocks[ property ] ?? target[ property ],
	} );
} );

describe( 'HiddenSync', () => {
	beforeEach( () => jest.clearAllMocks() );

	it.each( [
		[
			'unticks once the duplicate is gone',
			{ isHidden: true, isResolved: true, isDuplicate: false },
			true,
		],
		[
			'keeps it while still duplicated',
			{ isHidden: true, isResolved: true, isDuplicate: true },
			false,
		],
		[
			'waits for the media record',
			{ isHidden: true, isResolved: false, isDuplicate: false },
			false,
		],
	] )( '%s', ( _, state, expected ) => {
		mockDuplicate = state;
		render( <HiddenSync /> );
		expect( mockSetHidden.mock.calls ).toEqual( expected ? [ [ false ] ] : [] );
	} );
} );

describe( 'withHiddenFeaturedImageBlock', () => {
	const Block = withHiddenFeaturedImageBlock( () => <div>block</div> );

	it.each( [
		[ 'hides this post’s featured image', 'core/post-featured-image', { postId: 1 }, true, false ],
		[ 'keeps it when not hidden', 'core/post-featured-image', { postId: 1 }, false, true ],
		[
			'keeps it inside a Query Loop',
			'core/post-featured-image',
			{ postId: 1, queryId: 0 },
			true,
			true,
		],
		[
			'keeps another post’s featured image',
			'core/post-featured-image',
			{ postId: 2 },
			true,
			true,
		],
		[ 'leaves other blocks alone', 'core/paragraph', {}, true, true ],
	] )( '%s', ( _, name, context, hidden, shown ) => {
		mockEditor = { postId: 1, hidden };
		render( <Block name={ name } context={ context } /> );
		expect( !! screen.queryByText( 'block' ) ).toBe( shown );
	} );
} );
