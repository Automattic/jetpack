import { createInterpolateElement, useCallback } from '@wordpress/element';
import CollapsibleMeta from '../collapsible-meta/collapsible-meta';
import { __, sprintf } from '@wordpress/i18n';
import styles from './quality-settings.module.scss';
import { IconTooltip } from '@automattic/jetpack-components';
import QualityControl from '../quality-control/quality-control';
import Upgraded from '$features/ui/upgraded/upgraded';
import { type QualityConfig, imageCdnSettingsSchema, useImageCdnQuality } from '../lib/stores';
import { z } from 'zod';
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

	const [ imageCdnQuality, setImageCdnQuality ] = useImageCdnQuality();

	const updateFormatQuantity = useCallback(
		( format: 'jpg' | 'png' | 'webp', newValue: QualityConfig ) => {
			setImageCdnQuality( { ...imageCdnQuality, [ format ]: newValue } );
		},
		[ imageCdnQuality, setImageCdnQuality ]
	);

	return (
		<CollapsibleMeta
			editText={ __( 'Change Image Quality', 'jetpack-boost' ) }
			closeEditText={ __( 'Close', 'jetpack-boost' ) }
			header={ <Header /> }
			summary={ <Summary imageCdnQuality={ imageCdnQuality } /> }
		>
			<QualityControl
				label={ __( 'JPEG', 'jetpack-boost' ) }
				config={ imageCdnQuality.jpg as QualityConfig }
				maxValue={ 89 }
				onChange={ newValue => updateFormatQuantity( 'jpg', newValue ) }
			/>
			<QualityControl
				label={ __( 'PNG', 'jetpack-boost' ) }
				config={ imageCdnQuality.png as QualityConfig }
				maxValue={ 80 }
				onChange={ newValue => updateFormatQuantity( 'png', newValue ) }
			/>
			<QualityControl
				label={ __( 'WEBP', 'jetpack-boost' ) }
				config={ imageCdnQuality.webp as QualityConfig }
				maxValue={ 80 }
				onChange={ newValue => updateFormatQuantity( 'webp', newValue ) }
			/>
		</CollapsibleMeta>
	);
};

const Summary = ( {
	imageCdnQuality,
}: {
	imageCdnQuality: z.infer< typeof imageCdnSettingsSchema >;
} ) => (
	<div>
		{ sprintf(
			/* translators: %1$s is the JPEG quality value, %2$s is PNG quality value, and %3$s is WEBP quality value. Each value may also say 'lossless' */
			__( 'JPEG Quality: %1$s, PNG Quality: %2$s, WEBP Quality: %3$s', 'jetpack-boost' ),
			imageCdnQuality.jpg.lossless
				? __( 'lossless', 'jetpack-boost' )
				: imageCdnQuality.jpg.quality.toString(),
			imageCdnQuality.png.lossless
				? __( 'lossless', 'jetpack-boost' )
				: imageCdnQuality.png.quality.toString(),
			imageCdnQuality.webp.lossless
				? __( 'lossless', 'jetpack-boost' )
				: imageCdnQuality.webp.quality.toString()
		) }
	</div>
);

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
