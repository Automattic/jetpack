import { store as coreStore } from '@wordpress/core-data';
import { dispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

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

const post = {
	id: postId,
	type: 'post',
	title: 'bar',
	content: 'bar',
	excerpt: 'crackers',
	status: 'draft',
};

/**
 * Init the editor
 */
export function initEditor() {
	// Register post type entity.
	dispatch( coreStore ).addEntities( [ postTypeConfig ] );

	// Store post type entity.
	dispatch( coreStore ).receiveEntityRecords( 'root', 'postType', [ postTypeEntity ] );

	// Store post.
	dispatch( coreStore ).receiveEntityRecords( 'postType', 'post', post );

	// Setup editor with post.
	dispatch( editorStore ).setupEditor( post );
	// dispatch( editorStore ).setupEditorState( post );
}

/**
 * Reset editor.
 *
 * @param {object} postAttributes - Attributes to reset.
 */
export async function resetEditor( postAttributes ) {
	dispatch( editorStore ).editPost( postAttributes );
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
