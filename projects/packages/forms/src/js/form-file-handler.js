/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Downloads a file from the forms endpoint using blob response.
 *
 * @param {object} fileData         - The file data object.
 * @param {string} fileData.fileId  - The ID of the file to download.
 * @param {string} fileData.postId  - The post ID containing the file.
 * @param {string} fileData.fieldId - The field ID containing the file.
 * @return {Promise<string>} A promise that resolves to the object URL of the downloaded file.
 */
export const getFormFile = async ( { fileId, postId, fieldId } ) => {
	try {
		const response = await apiFetch( {
			path: `/wp/v2/feedback/files`,
			method: 'GET',
			parse: false, // Disable automatic parsing
			responseType: 'blob',
			params: {
				file_id: fileId,
				post_id: postId,
				field_id: fieldId,
			},
		} );

		let blob;
		if ( response instanceof Blob ) {
			blob = response;
		} else {
			blob = await response.blob();
		}

		return URL.createObjectURL( blob );
	} catch ( error ) {
		console.error( 'Error fetching form file:', error );
		throw error;
	}
};

/**
 * Handles clicking a form file link.
 *
 * @param {object} fileData          - The file data object.
 * @param {string} fileData.fileId   - The ID of the file to download.
 * @param {string} fileData.postId   - The post ID containing the file.
 * @param {string} fileData.fieldId  - The field ID containing the file.
 * @param {string} fileData.fileName - The name of the file.
 */
export const handleFormFileClick = async ( { fileId, postId, fieldId, fileName } ) => {
	try {
		const objectUrl = await getFormFile( { fileId, postId, fieldId } );

		// Create a temporary link to trigger the download
		const link = document.createElement( 'a' );
		link.href = objectUrl;
		link.download = fileName; // Set the download filename
		document.body.appendChild( link );
		link.click();

		// Clean up
		document.body.removeChild( link );
		URL.revokeObjectURL( objectUrl );
	} catch ( error ) {
		console.error( 'Error handling form file click:', error );
	}
};
