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
		id: '123456789',
		service_name: 'facebook',
		display_name: 'Some name',
		profile_picture: 'https://wordpress.com/some-url-of-a-picture',
		username: 'username',
		enabled: false,
		connection_id: '987654321',
		test_success: true,
	},
	{
		id: '234567891',
		service_name: 'tumblr',
		display_name: 'Some name',
		profile_picture: 'https://wordpress.com/some-url-of-another-picture',
		username: 'username',
		enabled: false,
		connection_id: '198765432',
		test_success: false,
	},
	{
		id: '345678912',
		service_name: 'mastodon',
		display_name: 'somename',
		profile_picture: 'https://wordpress.com/some-url-of-one-more-picture',
		username: '@somename@mastodon.social',
		enabled: false,
		connection_id: '219876543',
		test_success: 'must_reauth',
	},
];

/**
 * Create a registry with stores.
 *
 * @param {object} postAttributes - Post attributes.
 *
 * @returns {WPDataRegistry} Registry.
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
 * @returns {Array} Array of active connections.
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
