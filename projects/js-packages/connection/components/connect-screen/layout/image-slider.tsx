import React from 'react';
import type { Props as ConnectScreenProps } from '../basic';

export type Props = Pick< ConnectScreenProps, 'images' | 'assetBaseUrl' >;

/*
 * The ImageSlider component.
 */
const ImageSlider: React.FC< Props > = ( { images, assetBaseUrl = '' } ) => {
	if ( ! images?.length ) {
		return null;
	}

	const imagesHTML = images.map( ( image, index ) => (
		<React.Fragment key={ index }>
			<img src={ assetBaseUrl + image } alt="" />
		</React.Fragment>
	) );

	return <div className="jp-connection__connect-screen__image-slider">{ imagesHTML }</div>;
};

export default ImageSlider;
