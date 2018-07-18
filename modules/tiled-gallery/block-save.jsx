/**
 * External Dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import TiledGalleryLayoutSquare from './block/components/tiled-gallery-layout-square.jsx';

function JetpackGalleryBlockSave( { attributes } ) {
	return (
		<TiledGalleryLayoutSquare { ...attributes } />
	);
}

export default JetpackGalleryBlockSave;

