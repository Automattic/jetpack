import CollapsibleMeta from '../collapsible-meta/collapsible-meta';
import { __, sprintf } from '@wordpress/i18n';
import styles from './quality-settings.module.scss';
import { IconTooltip } from '@automattic/jetpack-components';
import QualityControl from '../quality-control/quality-control';
import { imageCdnSettingsSchema, useImageCdnQuality } from '../lib/stores';
import { z } from 'zod';
import ModuleSubsection from '$features/ui/module-subsection/module-subsection';

type QualitySettingsProps = {
	isPremium: boolean;
};

const QualitySettings = ( { isPremium }: QualitySettingsProps ) => {
	if ( ! isPremium ) {
		return;
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
			<ModuleSubsection>
				<CollapsibleMeta
					editText={ __( 'Adjust Quality', 'jetpack-boost' ) }
					closeEditText={ __( 'Hide', 'jetpack-boost' ) }
					header={ <Header /> }
					summary={ <Summary imageCdnQuality={ imageCdnQuality } /> }
				>
					<div className={ styles.body }>
						<h5>Adjust image quality per format</h5>
						<div className={ styles[ 'quality-controls' ] }>
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
						</div>
					</div>
				</CollapsibleMeta>
			</ModuleSubsection>
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
		<h4>{ __( 'Image Quality', 'jetpack-boost' ) }</h4>
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
	</div>
);

export default QualitySettings;
