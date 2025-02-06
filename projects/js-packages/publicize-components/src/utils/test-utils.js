import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { WPDataRegistry, createRegistry } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { store as noticesStore } from '@wordpress/notices';
import { store as socialStore } from '../social-store';

const postId = 44;

const postTypeConfig = {
	kind: 'postType',
	name: 'post',
	baseURL: '/wp/v2/posts',
	transientEdits: { blocks: true, selection: true },
	mergedEdits: { meta: true },
	rawAttributes: [ 'title', 'excerpt', 'content' ],
};

const postTypeEntity = {
	slug: 'post',
	rest_base: 'posts',
	labels: {},
};

export const testPost = {
	id: postId,
	type: 'post',
	title: 'bar',
	content: 'bar',
	excerpt: 'crackers',
	status: 'draft',
};

export const connections = [
	{
		service_name: 'facebook',
		display_name: 'Some name',
		profile_picture: 'https://wordpress.com/some-url-of-a-picture',
		external_handle: 'username',
		enabled: false,
		connection_id: '987654321',
	},
	{
		service_name: 'tumblr',
		display_name: 'Some name',
		profile_picture: 'https://wordpress.com/some-url-of-another-picture',
		external_handle: 'username',
		enabled: false,
		connection_id: '198765432',
	},
	{
		service_name: 'mastodon',
		display_name: 'somename',
		profile_picture: 'https://wordpress.com/some-url-of-one-more-picture',
		external_handle: '@somename@mastodon.social',
		enabled: false,
		connection_id: '219876543',
	},
];

/**
 * Create a registry with stores.
 *
 * @param {object} postAttributes - Post attributes.
 *
 * @return {WPDataRegistry} Registry.
 */
export function createRegistryWithStores( postAttributes = {} ) {
	// Create a registry.
	const registry = createRegistry();

	const edits = { ...testPost, ...postAttributes };

	// Register stores.
	registry.register( coreStore );
	registry.register( blockEditorStore );
	registry.register( editorStore );
	registry.register( socialStore );
	registry.register( noticesStore );

	// Register post type entity.
	registry.dispatch( coreStore ).addEntities( [ postTypeConfig ] );

	// Store post type entity.
	registry.dispatch( coreStore ).receiveEntityRecords( 'root', 'postType', [ postTypeEntity ] );

	// Store post.
	registry.dispatch( coreStore ).receiveEntityRecords( 'postType', 'post', edits );

	// Setup editor with post.
	registry.dispatch( editorStore ).setupEditor( edits );

	return registry;
}

/**
 * Creates an array of active connections.
 *
 * @param {number} count - Number of active connections to create.
 *
 * @return {Array} Array of active connections.
 */
export function createActiveConnections( count ) {
	return [
		{
			enabled: false,
		},
		// create number of connections based on the count
		...Array.from( { length: count }, () => ( { enabled: true } ) ),
		{
			enabled: false,
		},
	];
}

const getMethod = options =>
	options.headers?.[ 'X-HTTP-Method-Override' ] || options.method || 'GET';

/**
 * Get the mocked fetch handler for post publish fetch requests.
 *
 * @param {Record<string, any>} postData - Data to be used in the fetch request.
 *
 * @return {(options: import('@wordpress/api-fetch/build-types/types').APIFetchOptions) => Promise<any>} Promise resolving to the fetch response
 */
export function postPublishFetchHandler( postData ) {
	/**
	 * The mocked fetch handler for post publish fetch requests.
	 *
	 * @param {import('@wordpress/api-fetch/build-types/types').APIFetchOptions} options - Fetch options.
	 *
	 * @return {Promise<any>} Promise resolving to the fetch response
	 */
	return async function ( options ) {
		const method = getMethod( options );
		const { path, data, parse = true } = options;

		const wrapReturn = parse
			? v => v
			: v =>
					// Ideally we'd do `new Response( JSON.stringify( v ) )` here, but jsdom deletes that. Sigh.
					// See https://github.com/jsdom/jsdom/issues/1724
					( {
						async json() {
							return v;
						},
					} );

		if ( method === 'PUT' && path.startsWith( `/wp/v2/posts/${ testPost.id }` ) ) {
			return wrapReturn( { ...postData, ...data } );
		} else if (
			// This URL is requested by the actions dispatched in this test.
			// They are safe to ignore and are only listed here to avoid triggeringan error.
			method === 'GET' &&
			path.startsWith( '/wp/v2/types/post' )
		) {
			return wrapReturn( {} );
		}

		throw {
			code: 'unknown_path',
			message: `Unknown path: ${ method } ${ path }`,
		};
	};
}
