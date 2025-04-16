import { useSingleModuleState } from '$features/module/lib/stores';
import Module from '$features/module/module';
import InterstitialModalCTA from '$features/upgrade-cta/interstitial-modal-cta';
import { Notice } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';

const ImageGuide = () => {
	const [ isaState ] = useSingleModuleState( 'image_size_analysis' );
	const { canResizeImages } = Jetpack_Boost;

	/**
	 * Reset the Image Guide state to active when the module is enabled
	 */
	const resetImageGuideState = () => {
		// Remove the paused state from localStorage to reset it
		localStorage.removeItem( 'jetpack-boost-guide' );
	};

	return (
		<Module
			slug="image_guide"
			title={ __( 'Image Guide', 'jetpack-boost' ) }
			onDisable={ resetImageGuideState }
			description={
				<>
					<p>
						{ __(
							`This feature helps you discover images that are too large. When you browse your site, the image guide will show you an overlay with information about each image's size.`,
							'jetpack-boost'
						) }
					</p>
					{ ! isaState?.available && (
						<InterstitialModalCTA
							identifier="image-guide"
							description={ __(
								'Upgrade to scan your site for issues - automatically!',
								'jetpack-boost'
							) }
						/>
					) }
				</>
			}
		>
			{ false === canResizeImages && (
				<Notice
					level="warning"
					title={ __( 'Image resizing is unavailable', 'jetpack-boost' ) }
					hideCloseButton={ true }
				>
					<p>
						{ __(
							"It looks like your server doesn't have Imagick or GD extensions installed.",
							'jetpack-boost'
						) }
					</p>
					<p>
						{ __(
							"Jetpack Boost is able to work without these extensions, but it's likely that it's going to be difficult for you to optimize the images that the Image Guide will identify without one of these extensions.",
							'jetpack-boost'
						) }
					</p>
					<p>
						{ __(
							'Please contact your hosting provider or system administrator and ask them to install or activate one of these extensions.',
							'jetpack-boost'
						) }
					</p>
				</Notice>
			) }
		</Module>
	);
};

export default ImageGuide;
