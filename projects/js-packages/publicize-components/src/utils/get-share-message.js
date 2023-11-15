import { select } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { getShareMessageMaxLength } from './get-share-message-max-length';

/**
 * Gets the message that will be used hen sharing this post.
 *
 * @returns {string} The share message.
 */
export function getShareMessage() {
	const { getEditedPostAttribute } = select( editorStore );
	const meta = getEditedPostAttribute( 'meta' );
	const message = `${ meta?.jetpack_publicize_message || '' }`;

	if ( message ) {
		return message.substring( 0, getShareMessageMaxLength() );
	}

	return '';
}
