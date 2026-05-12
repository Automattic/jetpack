import { RangeControl, ToggleControl } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import {
	useImageCdnQuality,
	type ImageCdnQuality,
	type ImageFormatKey,
} from '../lib/use-image-cdn-quality';
import { type useModulesState } from '../lib/use-modules-state';
import { usePremiumFeatures } from '../lib/use-premium-features';
import ModuleRow from './module-row';
import ModuleSubrow from './module-subrow';
import SectionCard from './section-card';
import UpgradeCTA from './upgrade-cta';

type FormatConfig = { key: ImageFormatKey; label: string; min: number; max: number };

const FORMATS: FormatConfig[] = [
	{ key: 'jpg', label: __( 'JPEG quality', 'jetpack-boost' ), min: 20, max: 89 },
	{ key: 'png', label: __( 'PNG quality', 'jetpack-boost' ), min: 20, max: 80 },
	{ key: 'webp', label: __( 'WebP quality', 'jetpack-boost' ), min: 20, max: 80 },
];

type Props = {
	modulesState: ReturnType< typeof useModulesState >[ 'data' ];
	isLoading: boolean;
};

/**
 * Image CDN configuration section. Contains the parent Image CDN
 * toggle (with the **Adjust quality** subrow on premium plans) and
 * the **Auto-Resize Lazy Images** sub-toggle. On free plans the
 * sub-features are hidden behind an inline upgrade Notice.
 *
 * @param props              - See `Props`.
 * @param props.modulesState
 * @param props.isLoading
 * @return The Image CDN section card.
 */
export default function ImageCdnSection( { modulesState, isLoading }: Props ): JSX.Element | null {
	const premium = usePremiumFeatures();
	const [ qualityQuery, qualityMutation ] = useImageCdnQuality();

	const cdnState = modulesState?.image_cdn;
	if ( cdnState?.available === false ) {
		return null;
	}

	const hasQuality = premium.has( 'image-cdn-quality' );
	const hasLiar = premium.has( 'image-cdn-liar' );
	const isPremiumCdn = hasQuality && hasLiar;
	const isCdnActive = cdnState?.active ?? false;
	const quality = qualityQuery.data;

	const liarState = modulesState?.image_cdn_liar;

	const qualitySummary = quality
		? sprintf(
				/* translators: %1$d JPEG quality, %2$d PNG quality, %3$d WebP quality. */
				__( 'JPEG Quality: %1$d, PNG Quality: %2$d, WEBP Quality: %3$d', 'jetpack-boost' ),
				quality.jpg.quality,
				quality.png.quality,
				quality.webp.quality
		  )
		: __( 'Default quality', 'jetpack-boost' );

	const updateFormat = (
		key: ImageFormatKey,
		patch: Partial< ImageCdnQuality[ ImageFormatKey ] >
	) => {
		if ( ! quality ) {
			return;
		}
		qualityMutation.mutate( { ...quality, [ key ]: { ...quality[ key ], ...patch } } );
	};

	return (
		<SectionCard title={ __( 'Image CDN configuration', 'jetpack-boost' ) }>
			<ModuleRow
				slug="image_cdn"
				state={ cdnState }
				isLoading={ isLoading }
				label={ __( "Deliver images from Jetpack's Content Delivery Network.", 'jetpack-boost' ) }
				description={ __(
					'Automatically resizes your images to an appropriate size, converts them to modern efficient formats like WebP, and serves them from a worldwide network of servers.',
					'jetpack-boost'
				) }
				persistent={
					isCdnActive && ! isPremiumCdn ? (
						<UpgradeCTA
							identifier="image-cdn"
							description={ __(
								'Tune image quality per file type and auto-resize lazy-loaded images with a paid Boost plan.',
								'jetpack-boost'
							) }
						/>
					) : null
				}
			>
				{ isPremiumCdn && quality && (
					<ModuleSubrow
						summary={ qualitySummary }
						actionLabel={ __( 'Adjust quality', 'jetpack-boost' ) }
					>
						<div className="jetpack-boost-inline-editor">
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
											disabled={ qualityMutation.isPending }
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
											disabled={ qualityMutation.isPending }
											onChange={ lossless => updateFormat( format.key, { lossless } ) }
										/>
									</div>
								) ) }
							</Stack>
						</div>
					</ModuleSubrow>
				) }
			</ModuleRow>

			{ isPremiumCdn && (
				<ModuleRow
					slug="image_cdn_liar"
					state={ liarState }
					isLoading={ isLoading }
					label={ __( 'Auto-Resize Lazy Images', 'jetpack-boost' ) }
					description={ __(
						'Automatically resize images that are lazily loaded to fit the exact dimensions they occupy on the page.',
						'jetpack-boost'
					) }
				/>
			) }
		</SectionCard>
	);
}
