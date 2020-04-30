export const connectInstagramGalleryToken = token => ( {
	type: 'INSTAGRAM_GALLERY_BLOCK_TOKEN_CONNECT',
	token,
} );

export const disconnectInstagramGalleryToken = token => ( {
	type: 'INSTAGRAM_GALLERY_BLOCK_TOKEN_DISCONNECT',
	token,
} );
