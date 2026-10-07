import { hasFeatureFlag } from '@automattic/jetpack-shared-extension-utils';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback } from '@wordpress/element';

export const FEATURE_NAME = 'featured-image-duplicate';
export const HIDE_META_KEY = '_jetpack_hide_featured_image';
const DISMISSED_META_KEY = '_jetpack_featured_image_duplicate_dismissed';
const POST_TYPES = [ 'post', 'page' ];

const SIZE_SUFFIX = /-(\d+x\d+|scaled)(?=\.[a-z0-9]+$)/i; // Matches "-300x200" or "-scaled" before the file extension.
const UPLOADS = '/wp-content/uploads'; // Matches the uploads path, which is the same for all sites.
const PHOTON_HOST = /^i\d\.wp\.com$/; // Matches the Photon CDN host, which is the same for all sites.

type EditorBlock = {
	name: string;
	attributes?: Record< string, unknown >;
	innerBlocks?: EditorBlock[];
};

type MediaRecord = {
	source_url?: string;
	media_details?: { sizes?: Record< string, { source_url?: string } | undefined > };
};

type PostType = 'post' | 'page';

/**
 * Reduce an image URL to its upload path, without size suffix, CDN host or query.
 *
 * @param url - Image URL.
 * @return Normalized path, or null.
 */
function normalizeImageUrl( url: unknown ): string | null {
	if ( ! url || typeof url !== 'string' ) {
		return null;
	}

	let parsed: URL;
	try {
		parsed = new URL( url, 'https://localhost' );
	} catch {
		return null;
	}

	let path = parsed.pathname;
	if ( PHOTON_HOST.test( parsed.hostname ) ) {
		path = path.replace( /^\/[^/]+/, '' );
	}

	const uploadsIndex = path.indexOf( UPLOADS + '/' );
	if ( uploadsIndex !== -1 ) {
		path = path.slice( uploadsIndex + UPLOADS.length );
	}

	try {
		path = decodeURIComponent( path );
	} catch {
		// Keep the encoded path.
	}

	return path.replace( SIZE_SUFFIX, '' ).toLowerCase();
}

/**
 * Normalized URLs of an attachment and all its sizes.
 *
 * @param media - Media REST record.
 * @return Normalized paths.
 */
function getImageUrls( media?: MediaRecord ): Set< string > {
	const urls = [
		media?.source_url,
		...Object.values( media?.media_details?.sizes ?? {} ).map( size => size?.source_url ),
	];
	return new Set( urls.map( normalizeImageUrl ).filter( ( url ): url is string => !! url ) );
}

/**
 * Whether an Image block anywhere in the content shows the featured image, by ID or URL.
 *
 * @param blocks  - Editor blocks.
 * @param id      - Featured image ID.
 * @param getUrls - Normalized featured image URLs, built on first use.
 * @return Whether a copy was found.
 */
function blocksContainImage(
	blocks: EditorBlock[] | undefined,
	id: number,
	getUrls: () => Set< string >
): boolean {
	for ( const { name: blockName, attributes = {}, innerBlocks } of blocks ?? [] ) {
		// Images with an ID are matched by ID; only ID-less ones (e.g. pasted URLs) need a URL compare.
		if (
			blockName === 'core/image' &&
			( attributes.id
				? Number( attributes.id ) === id
				: getUrls().has( normalizeImageUrl( attributes.url ) ?? '' ) )
		) {
			return true;
		}

		if ( blocksContainImage( innerBlocks, id, getUrls ) ) {
			return true;
		}
	}

	return false;
}

/**
 * What to show about a duplicated featured image, plus actions to change it.
 *
 * Dismissal stores the image ID, so a new featured image brings the notice back.
 *
 * @return State and actions.
 */
export function useFeaturedImageDuplicate() {
	const state = useSelect( select => {
		const editor = select( editorStore );
		const postType = editor.getCurrentPostType() as PostType;
		const featuredId = editor.getEditedPostAttribute( 'featured_media' ) as number;
		const meta = ( editor.getEditedPostAttribute( 'meta' ) ?? {} ) as Record< string, unknown >;
		const isHidden = !! meta[ HIDE_META_KEY ];
		const isApplicable = POST_TYPES.includes( postType ) && !! featuredId;

		const query = { context: 'view' }; // Get the media record as it appears on the front end, not the editor.
		let urls: Set< string > | undefined;
		const getUrls = () =>
			( urls ??= getImageUrls( select( coreStore ).getMedia( featuredId, query ) as MediaRecord ) );

		const isDuplicate =
			isApplicable &&
			blocksContainImage( editor.getEditorBlocks() as EditorBlock[], featuredId, getUrls );
		const isDismissed = meta[ DISMISSED_META_KEY ] === featuredId;

		return {
			postType,
			featuredId,
			isHidden,
			isDuplicate,
			// URL matches need the media record, so don't trust a miss before it loads.
			isResolved:
				! urls || select( coreStore ).hasFinishedResolution( 'getMedia', [ featuredId, query ] ),
			showNotice: isDuplicate && ! isHidden && ! isDismissed,
			showCheckbox: hasFeatureFlag( 'featured-image-hide' ) && isDuplicate,
		};
	}, [] );

	const { editPost } = useDispatch( editorStore );
	const { featuredId } = state;

	const dismiss = useCallback(
		() => editPost( { meta: { [ DISMISSED_META_KEY ]: featuredId } } ),
		[ editPost, featuredId ]
	);
	const setHidden = useCallback(
		( hidden: boolean ) => editPost( { meta: { [ HIDE_META_KEY ]: hidden } } ),
		[ editPost ]
	);

	return { ...state, dismiss, setHidden };
}
