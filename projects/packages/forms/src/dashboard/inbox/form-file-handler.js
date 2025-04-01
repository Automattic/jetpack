/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Downloads a file from the forms endpoint using blob response.
 *
 * @param {object} fileData          - The file data object.
 * @param {string} fileData.fileId   - The ID of the file to download.
 * @param {string} fileData.postId   - The post ID containing the file.
 * @param {string} fileData.fieldId  - The field ID containing the file.
 * @param {string} fileData.fileName - The name of the file.
 */
export const handleFormFileClick = async ( { fileId, postId, fieldId, fileName } ) => {
	try {
		const response = await apiFetch( {
			path: '/wp/v2/feedback/files',
			method: 'POST',
			data: {
				file_id: fileId,
				post_id: postId,
				field_id: fieldId,
			},
			parse: false,
			responseType: 'blob',
		} );

		let blob;
		if ( response instanceof Blob ) {
			blob = response;
		} else {
			blob = await response.blob();
		}

		const objectUrl = URL.createObjectURL( blob );
		const link = document.createElement( 'a' );
		link.href = objectUrl;
		link.download = fileName;
		document.body.appendChild( link );
		link.click();
		document.body.removeChild( link );
		URL.revokeObjectURL( objectUrl );
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.error( 'Error handling form file click:', error );
	}
};
