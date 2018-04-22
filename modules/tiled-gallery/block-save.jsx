/**
 * External Dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import TiledGalleryLayoutSquare from './block/components/tiled-gallery-layout-square.jsx';

function JetpackGalleryBlockSave( props ) {
	return (
		<TiledGalleryLayoutSquare { ...props.attributes } />
	);
}

export default JetpackGalleryBlockSave;

