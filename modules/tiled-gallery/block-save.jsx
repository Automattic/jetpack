/**
 * External Dependencies
 */
import React from 'react';

import jetpackGalleryImage from './gallery-image.jsx';

function jetpackGalleryBlockSave( { attributes } ) {
	const { images } = attributes;
	return (
		<ul className="jetpack-tiled-gallery">
			{ images.map( jetpackGalleryImage ) }
		</ul>
	);
}

export default jetpackGalleryBlockSave;

