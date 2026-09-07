import { Fragment } from 'react';
import type { Props as ConnectScreenProps } from '../basic';

export type Props = Pick< ConnectScreenProps, 'images' | 'assetBaseUrl' >;

/**
 * The ImageSlider component.
 *
 * @param {Props} props - The properties.
 * @return {import('react').ReactNode} The ImageSlider component.
 */
function ImageSlider( { images, assetBaseUrl = '' }: Props ) {
	if ( ! images?.length ) {
		return null;
	}

	const imagesHTML = images.map( ( image, index ) => (
		<Fragment key={ index }>
			<img src={ assetBaseUrl + image } alt="" />
		</Fragment>
	) );

	return <div className="jp-connection__connect-screen__image-slider">{ imagesHTML }</div>;
}

export default ImageSlider;
