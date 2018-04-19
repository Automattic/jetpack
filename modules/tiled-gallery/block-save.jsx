/**
 * External Dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import TiledGalleryLayoutSquare from './block/components/tiled-gallery-layout-square.jsx';

function jetpackGalleryBlockSave( props ) {
	return (
		<TiledGalleryLayoutSquare { ...props.attributes } />
	);
}

export default jetpackGalleryBlockSave;

