import { RangeControl, ToggleControl } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { CollapsibleCard, Stack } from '@wordpress/ui';
import {
	useImageCdnQuality,
	type ImageCdnQuality,
	type ImageFormatKey,
} from '../lib/use-image-cdn-quality';
import './image-cdn-quality.scss';

type FormatConfig = {
	key: ImageFormatKey;
	label: string;
	min: number;
	max: number;
};

// Quality bounds mirror the legacy settings UI — JPEG tops out at 89
// (above that it stops being meaningfully compressed), PNG/WebP at 80
// (matches Photon's safety ceiling for line-art-heavy formats).
const FORMATS: FormatConfig[] = [
	{ key: 'jpg', label: __( 'JPEG quality', 'jetpack-boost' ), min: 20, max: 89 },
	{ key: 'png', label: __( 'PNG quality', 'jetpack-boost' ), min: 20, max: 80 },
	{ key: 'webp', label: __( 'WebP quality', 'jetpack-boost' ), min: 20, max: 80 },
];

/**
 * Image CDN quality sliders — three formats × (slider + lossless
 * toggle). Premium-gated upstream; this component assumes the parent
 * has already checked `image_cdn_quality.available`.
 *
 * @return The quality settings panel.
 */
export default function ImageCdnQualitySettings(): JSX.Element {
	const [ query, mutation ] = useImageCdnQuality();
	const quality = query.data;

	if ( ! quality ) {
		return <></>;
	}

	const updateFormat = (
		key: ImageFormatKey,
		patch: Partial< ImageCdnQuality[ ImageFormatKey ] >
	) => {
		mutation.mutate( {
			...quality,
			[ key ]: { ...quality[ key ], ...patch },
		} );
	};

	const summary = sprintf(
		/* translators: %1$d JPEG quality, %2$d PNG quality, %3$d WebP quality. */
		__( 'JPEG: %1$d · PNG: %2$d · WEBP: %3$d', 'jetpack-boost' ),
		quality.jpg.quality,
		quality.png.quality,
		quality.webp.quality
	);

	return (
		<CollapsibleCard.Root defaultOpen={ false } className="jetpack-boost-image-cdn-quality">
			<CollapsibleCard.Header>
				<div className="jetpack-boost-image-cdn-quality__header">
					<span className="jetpack-boost-image-cdn-quality__heading">
						{ __( 'Adjust image quality', 'jetpack-boost' ) }
					</span>
					<span className="jetpack-boost-image-cdn-quality__summary">{ summary }</span>
				</div>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				<Stack direction="column" gap="md">
					{ FORMATS.map( format => (
						<div key={ format.key } className="jetpack-boost-image-cdn-quality__format">
							<RangeControl
								__nextHasNoMarginBottom
								__next40pxDefaultSize
								label={ format.label }
								value={ quality[ format.key ].quality }
								min={ format.min }
								max={ format.max }
								disabled={ mutation.isPending }
								onChange={ value =>
									updateFormat( format.key, {
										quality: typeof value === 'number' ? value : format.max,
									} )
								}
							/>
							<ToggleControl
								__nextHasNoMarginBottom
								label={ __( 'Lossless', 'jetpack-boost' ) }
								checked={ quality[ format.key ].lossless }
								disabled={ mutation.isPending }
								onChange={ lossless => updateFormat( format.key, { lossless } ) }
							/>
						</div>
					) ) }
				</Stack>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
}
