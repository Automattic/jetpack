import Module from '$features/module/module';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';

const ImageGuide = () => {
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
			title={ __( 'Enable image guide', 'jetpack-boost' ) }
			onDisable={ resetImageGuideState }
			description={
				<p>
					{ __(
						'Shows image size information as you browse, helping you spot images that may be too large.',
						'jetpack-boost'
					) }
				</p>
			}
		>
			{ false === canResizeImages && (
				<Notice.Root intent="warning">
					<Notice.Title>{ __( 'Image resizing is unavailable', 'jetpack-boost' ) }</Notice.Title>
					<Notice.Description>
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
					</Notice.Description>
				</Notice.Root>
			) }
		</Module>
	);
};

export default ImageGuide;
