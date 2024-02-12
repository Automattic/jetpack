import { createInterpolateElement } from '@wordpress/element';
import CollapsibleMeta from '../collapsible-meta/collapsible-meta';
import { __, sprintf } from '@wordpress/i18n';
import styles from './quality-settings.module.scss';
import { IconTooltip } from '@automattic/jetpack-components';
import QualityControl from '../quality-control/quality-control';
import Upgraded from '$features/ui/upgraded/upgraded';
import { imageCdnSettingsSchema, useImageCdnQuality } from '../lib/stores';
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

	const [ query, mutation ] = useImageCdnQuality();
	const imageCdnQuality = query?.data;
	const setImageCdnQuality = mutation.mutate;

	const setQuality = ( format: 'jpg' | 'png' | 'webp', newValue: number ) => {
		if ( ! setImageCdnQuality || ! imageCdnQuality ) {
			return;
		}
		setImageCdnQuality( {
			...imageCdnQuality,
			[ format ]: {
				...imageCdnQuality[ format ],
				quality: newValue,
			},
		} );
	};

	const setLossless = ( format: 'jpg' | 'png' | 'webp', newValue: boolean ) => {
		if ( ! setImageCdnQuality || ! imageCdnQuality ) {
			return;
		}
		setImageCdnQuality( {
			...imageCdnQuality,
			[ format ]: {
				...imageCdnQuality[ format ],
				lossless: newValue,
			},
		} );
	};

	return (
		imageCdnQuality && (
			<CollapsibleMeta
				editText={ __( 'Change Image Quality', 'jetpack-boost' ) }
				closeEditText={ __( 'Close', 'jetpack-boost' ) }
				header={ <Header /> }
				summary={ <Summary imageCdnQuality={ imageCdnQuality } /> }
			>
				<QualityControl
					label={ __( 'JPEG', 'jetpack-boost' ) }
					maxValue={ 89 }
					quality={ imageCdnQuality.jpg.quality }
					lossless={ imageCdnQuality.jpg.lossless }
					setQuality={ value => setQuality( 'jpg', value ) }
					setLossless={ value => setLossless( 'jpg', value ) }
				/>
				<QualityControl
					label={ __( 'PNG', 'jetpack-boost' ) }
					maxValue={ 80 }
					quality={ imageCdnQuality.png.quality }
					lossless={ imageCdnQuality.png.lossless }
					setQuality={ value => setQuality( 'png', value ) }
					setLossless={ value => setLossless( 'png', value ) }
				/>
				<QualityControl
					label={ __( 'WEBP', 'jetpack-boost' ) }
					maxValue={ 80 }
					quality={ imageCdnQuality.webp.quality }
					lossless={ imageCdnQuality.webp.lossless }
					setQuality={ value => setQuality( 'webp', value ) }
					setLossless={ value => setLossless( 'webp', value ) }
				/>
			</CollapsibleMeta>
		)
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
			offset={ 8 }
			placement={ 'bottom' }
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
