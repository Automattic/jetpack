/**
 * External Dependencies
 */
import React from 'react';

import TiledGalleryItem from './block/components/tiled-gallery-item.jsx';

function jetpackGalleryBlockSave( { attributes } ) {
	const { images } = attributes;
	return (
		<ul className="jetpack-tiled-gallery">
			{ images.map( TiledGalleryItem ) }
		</ul>
	);
}

export default jetpackGalleryBlockSave;

