import { createInterpolateElement } from '@wordpress/element';
import CollapsibleMeta from '../collapsible-meta/collapsible-meta';
import { __, sprintf } from '@wordpress/i18n';
import styles from './quality-settings.module.scss';
import { IconTooltip } from '@automattic/jetpack-components';
import QualityControl from '../quality-control/quality-control';
import Upgraded from '$features/ui/upgraded/upgraded';
import { useImageCdnQuality } from '../lib/stores';
import { Link } from 'react-router-dom';

type QualitySettingsProps = {
	isPremium: boolean;
};

const QualitySettings = ( { isPremium }: QualitySettingsProps ) => {
	if ( ! isPremium ) {
		return createInterpolateElement(
			__( `For more control over image quality, <link>upgrade now!</link>`, 'jetpack-boost' ),
			{
				link: <Link to="/upgrade" />,
			}
		);
	}

	return (
		<CollapsibleMeta
			editText={ __( 'Change Image Quality', 'jetpack-boost' ) }
			closeEditText={ __( 'Close', 'jetpack-boost' ) }
			header={ <Header /> }
			summary={ <Summary /> }
		>
			<QualityControl label={ __( 'JPEG', 'jetpack-boost' ) } format="jpg" maxValue={ 89 } />
			<QualityControl label={ __( 'PNG', 'jetpack-boost' ) } format="png" maxValue={ 80 } />
			<QualityControl label={ __( 'WEBP', 'jetpack-boost' ) } format="webp" maxValue={ 80 } />
		</CollapsibleMeta>
	);
};

const Summary = () => {
	const [ jpgQuality ] = useImageCdnQuality( 'jpg' );
	const [ pngQuality ] = useImageCdnQuality( 'png' );
	const [ webpQuality ] = useImageCdnQuality( 'webp' );

	return (
		<div>
			{ sprintf(
				/* translators: %1$s is the JPEG quality value, %2$s is PNG quality value, and %3$s is WEBP quality value. Each value may also say 'lossless' */
				__( 'JPEG Quality: %1$s, PNG Quality: %2$s, WEBP Quality: %3$s', 'jetpack-boost' ),
				jpgQuality.lossless ? __( 'lossless', 'jetpack-boost' ) : jpgQuality.quality.toString(),
				pngQuality.lossless ? __( 'lossless', 'jetpack-boost' ) : pngQuality.quality.toString(),
				webpQuality.lossless ? __( 'lossless', 'jetpack-boost' ) : webpQuality.quality.toString()
			) }
		</div>
	);
};

const Header = () => (
	<div className={ styles[ 'section-title' ] }>
		{ __( 'Image Quality', 'jetpack-boost' ) }
		<IconTooltip
			className={ styles[ 'info-icon' ] }
			title={ __( 'Image Quality', 'jetpack-boost' ) }
		>
			{ __(
				'Select the quality for images served by the CDN. Choosing a lower quality will compress your images and load them faster. If you choose lossless, we will not compress your images.',
				'jetpack-boost'
			) }
		</IconTooltip>

		<Upgraded />
	</div>
);

export default QualitySettings;
