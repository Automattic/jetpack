export const addInstagramGalleryToken = token => ( {
	type: 'INSTAGRAM_GALLERY_BLOCK_ADD_TOKEN',
	token,
} );

export const removeInstagramGalleryToken = token => ( {
	type: 'INSTAGRAM_GALLERY_BLOCK_REMOVE_TOKEN',
	token,
} );
