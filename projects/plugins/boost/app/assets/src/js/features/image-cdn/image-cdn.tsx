import { __ } from '@wordpress/i18n';
import ImageCdnLiar from '$features/image-cdn/image-cdn-liar/image-cdn-liar';
import QualitySettings from '$features/image-cdn/quality-settings/quality-settings';
import { useSingleModuleState } from '$features/module/lib/stores';
import Module from '$features/module/module';
import UpgradeNotice from '$features/upgrade-cta/upgrade-notice';

const ImageCdn = () => {
	const [ imageCdnQualityState ] = useSingleModuleState( 'image_cdn_quality' );
	const [ imageCdnLiarState ] = useSingleModuleState( 'image_cdn_liar' );

	const hasPremiumCdnFeatures = imageCdnQualityState?.available && imageCdnLiarState?.available;

	return (
		<Module
			slug="image_cdn"
			title={ __( 'Image CDN', 'jetpack-boost' ) }
			worksOffline={ false }
			description={
				<p>
					{ __(
						"Optimizes and delivers images through Jetpack's global network, with control over image quality.",
						'jetpack-boost'
					) }
				</p>
			}
		>
			{ ! hasPremiumCdnFeatures && (
				<UpgradeNotice
					identifier="image-cdn"
					description={ __( 'Auto-resize lazy images and adjust their quality.', 'jetpack-boost' ) }
				/>
			) }
			<ImageCdnLiar isPremium={ imageCdnLiarState?.available ?? false } />
			<QualitySettings isPremium={ imageCdnQualityState?.available ?? false } />
		</Module>
	);
};

export default ImageCdn;
