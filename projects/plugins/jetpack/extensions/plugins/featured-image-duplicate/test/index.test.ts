import { renderHook } from '@testing-library/react';
import { useFeaturedImageDuplicate } from '..';

const FEATURED_ID = 42;
const UPLOADS = 'https://example.com/wp-content/uploads/2026/10';

let mockPost: {
	postType: string;
	featuredId: number;
	meta: Record< string, unknown >;
	blocks: unknown[];
	mediaResolved: boolean;
	flag: boolean;
};
const mockEditPost = jest.fn();

jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	hasFeatureFlag: () => mockPost.flag,
} ) );
jest.mock( '@wordpress/editor', () => ( { store: 'core/editor' } ) );
jest.mock( '@wordpress/core-data', () => ( { store: 'core' } ) );
jest.mock( '@wordpress/data', () => ( {
	useSelect: selector =>
		selector( store =>
			store === 'core/editor'
				? {
						getCurrentPostType: () => mockPost.postType,
						getEditedPostAttribute: attribute =>
							attribute === 'featured_media' ? mockPost.featuredId : mockPost.meta,
						getEditorBlocks: () => mockPost.blocks,
					}
				: {
						getMedia: () =>
							mockPost.mediaResolved
								? {
										source_url: `${ UPLOADS }/onion-scaled.jpg`,
										media_details: {
											sizes: { large: { source_url: `${ UPLOADS }/onion-1024x768.jpg` } },
										},
									}
								: undefined,
						hasFinishedResolution: () => mockPost.mediaResolved,
					}
		),
	useDispatch: () => ( { editPost: mockEditPost } ),
} ) );

const image = ( attributes: Record< string, unknown > ) => ( {
	name: 'core/image',
	attributes,
	innerBlocks: [],
} );

const render = ( post: Partial< typeof mockPost > = {} ) => {
	mockPost = {
		postType: 'post',
		featuredId: FEATURED_ID,
		meta: {},
		blocks: [ image( { id: FEATURED_ID } ) ],
		mediaResolved: true,
		flag: true,
		...post,
	};
	return renderHook( () => useFeaturedImageDuplicate() ).result.current;
};

describe( 'useFeaturedImageDuplicate', () => {
	beforeEach( () => jest.clearAllMocks() );

	it.each( [
		[ 'same attachment ID', [ image( { id: FEATURED_ID } ) ], true ],
		[ 'resized copy without an ID', [ image( { url: `${ UPLOADS }/onion-300x200.jpg` } ) ], true ],
		[
			'Photon URL without an ID',
			[
				image( {
					url: 'https://i0.wp.com/example.com/wp-content/uploads/2026/10/onion.jpg?w=640',
				} ),
			],
			true,
		],
		[
			'image nested in a gallery',
			[ { name: 'core/gallery', attributes: {}, innerBlocks: [ image( { id: FEATURED_ID } ) ] } ],
			true,
		],
		[
			'different attachment with the same file name',
			[ image( { id: 7, url: `${ UPLOADS }/onion.jpg` } ) ],
			false,
		],
		[ 'unrelated image', [ image( { url: `${ UPLOADS }/carrot.jpg` } ) ], false ],
		[ 'non-image block', [ { name: 'core/cover', attributes: { id: FEATURED_ID } } ], false ],
	] )( 'detects a duplicate for %s', ( _, blocks, expected ) => {
		expect( render( { blocks } ).isDuplicate ).toBe( expected );
	} );

	it.each( [
		[ 'a duplicate', {}, { showNotice: true, showCheckbox: true } ],
		[ 'a theme that cannot hide it', { flag: false }, { showNotice: true, showCheckbox: false } ],
		[
			'a hidden image',
			{ meta: { _jetpack_hide_featured_image: true } },
			{ showNotice: false, showCheckbox: true },
		],
		[
			'a dismissed image',
			{ meta: { _jetpack_featured_image_duplicate_dismissed: FEATURED_ID } },
			{ showNotice: false, showCheckbox: true },
		],
		[
			'a new image after dismissing another',
			{ meta: { _jetpack_featured_image_duplicate_dismissed: 7 } },
			{ showNotice: true },
		],
		[ 'no featured image', { featuredId: 0 }, { showNotice: false, showCheckbox: false } ],
		[ 'other post types', { postType: 'product' }, { showNotice: false, showCheckbox: false } ],
	] )( 'shows the right controls for %s', ( _, post, expected ) => {
		expect( render( post ) ).toMatchObject( expected );
	} );

	it( 'does not trust a URL miss before the media record loads', () => {
		const blocks = [ image( { url: `${ UPLOADS }/carrot.jpg` } ) ];
		expect( render( { blocks, mediaResolved: false } ).isResolved ).toBe( false );
		expect( render( { blocks: [ image( { id: 7 } ) ], mediaResolved: false } ).isResolved ).toBe(
			true
		);
	} );

	it( 'dismisses for the current featured image only', () => {
		render().dismiss();
		expect( mockEditPost ).toHaveBeenCalledWith( {
			meta: { _jetpack_featured_image_duplicate_dismissed: FEATURED_ID },
		} );
	} );
} );
