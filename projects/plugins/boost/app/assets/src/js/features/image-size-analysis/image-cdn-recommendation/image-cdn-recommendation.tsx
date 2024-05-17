import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import styles from './image-cdn-recommendation.module.scss';

const ImageCdnRecommendation = () => {
	return (
		<>
			<p className={ styles.paragraph }>
				{ createInterpolateElement(
					__( 'We recommend enabling the <b>Image CDN</b>.', 'jetpack-boost' ),
					{
						b: <b />,
					}
				) }
			</p>
			<p className={ styles.paragraph }>
				<small>
					{ __(
						"Jetpack Boost's Image CDN can automatically resize many images to the correct size for you.",
						'jetpack-boost'
					) }
				</small>
			</p>
		</>
	);
};

export default ImageCdnRecommendation;
