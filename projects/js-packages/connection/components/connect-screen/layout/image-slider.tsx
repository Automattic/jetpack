import { Fragment } from 'react';
import type { Props as ConnectScreenProps } from '../basic';
import type { FC } from 'react';

export type Props = Pick< ConnectScreenProps, 'images' | 'assetBaseUrl' >;

/*
 * The ImageSlider component.
 */
const ImageSlider: FC< Props > = ( { images, assetBaseUrl = '' } ) => {
	if ( ! images?.length ) {
		return null;
	}

	const imagesHTML = images.map( ( image, index ) => (
		<Fragment key={ index }>
			<img src={ assetBaseUrl + image } alt="" />
		</Fragment>
	) );

	return <div className="jp-connection__connect-screen__image-slider">{ imagesHTML }</div>;
};

export default ImageSlider;
