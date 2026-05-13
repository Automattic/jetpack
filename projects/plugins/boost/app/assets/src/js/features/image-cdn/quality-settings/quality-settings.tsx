import { __, sprintf } from '@wordpress/i18n';
import { Card, CollapsibleCard, Stack } from '@wordpress/ui';
import { IconTooltip } from '@automattic/jetpack-components';
import QualityControl from '../quality-control/quality-control';
import { imageCdnSettingsSchema, useImageCdnQuality } from '../lib/stores';
import { z } from 'zod';
import { useMutationNotice } from '$features/ui/mutation-notice/mutation-notice';
import { recordBoostEvent } from '$lib/utils/analytics';
import styles from './quality-settings.module.scss';

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

	useMutationNotice( 'image-cdn-quality', mutation );

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

	const handleOpenChange = ( open: boolean ) => {
		recordBoostEvent( 'image_cdn_panel_toggle', { status: open ? 'open' : 'close' } );
	};

	if ( ! imageCdnQuality ) {
		return null;
	}

	return (
		<CollapsibleCard.Root onOpenChange={ handleOpenChange }>
			<CollapsibleCard.Header>
				<Stack direction="column" gap="xs">
					<Card.Title>
						<span className={ styles[ 'title-wrap' ] }>
							{ __( 'Image Quality', 'jetpack-boost' ) }
							<IconTooltip
								offset={ 12 }
								placement="bottom"
								title={ __( 'Image Quality', 'jetpack-boost' ) }
								iconSize={ 18 }
							>
								{ __(
									'Select the quality for images served by the CDN. Choosing a lower quality will compress your images and load them faster. If you choose lossless, we will not compress your images.',
									'jetpack-boost'
								) }
							</IconTooltip>
						</span>
					</Card.Title>
					<CollapsibleCard.HeaderDescription>
						<Summary imageCdnQuality={ imageCdnQuality } />
					</CollapsibleCard.HeaderDescription>
				</Stack>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
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
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
};

const Summary = ( {
	imageCdnQuality,
}: {
	imageCdnQuality: z.infer< typeof imageCdnSettingsSchema >;
} ) => (
	<>
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
	</>
);

export default QualitySettings;
