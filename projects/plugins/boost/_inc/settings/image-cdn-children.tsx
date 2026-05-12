import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import { useModulesState, useSetModuleState } from '../lib/use-modules-state';
import { usePremiumFeatures } from '../lib/use-premium-features';
import ImageCdnQualitySettings from './image-cdn-quality';
import UpgradeCTA from './upgrade-cta';

/**
 * Sub-controls rendered inside the Image CDN module card when the
 * parent toggle is active. Premium users get the quality sliders +
 * the auto-resize lazy images sub-toggle (driven through the
 * `image_cdn_liar` module slug in modules_state). Free users get an
 * inline upgrade Notice pointing at the My Jetpack add-Boost flow.
 *
 * @return The Image CDN sub-controls.
 */
export default function ImageCdnChildren(): JSX.Element {
	const premium = usePremiumFeatures();
	const modulesQuery = useModulesState();
	const [ setModuleState, mutation ] = useSetModuleState();

	const hasQuality = premium.has( 'image-cdn-quality' );
	const hasLiar = premium.has( 'image-cdn-liar' );
	const isPremium = hasQuality && hasLiar;

	const liarState = modulesQuery.data?.image_cdn_liar;
	const isLiarOn = liarState?.active ?? false;
	const isBusy = modulesQuery.isLoading || mutation.isPending;

	if ( ! isPremium ) {
		return (
			<UpgradeCTA
				identifier="image-cdn"
				description={ __(
					'Auto-resize lazy images and tune quality per file type with a paid Boost plan.',
					'jetpack-boost'
				) }
			/>
		);
	}

	return (
		<Stack direction="column" gap="md">
			{ hasQuality && <ImageCdnQualitySettings /> }
			{ hasLiar && (
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Auto-resize lazy images', 'jetpack-boost' ) }
					help={ __(
						'Automatically resize lazy-loaded images to the visitor’s viewport so they download fewer bytes.',
						'jetpack-boost'
					) }
					checked={ isLiarOn }
					disabled={ isBusy }
					onChange={ () => setModuleState( 'image_cdn_liar', ! isLiarOn ) }
				/>
			) }
		</Stack>
	);
}
