export const isFeaturedImageGeneratorEnabled = () => {
	if ( window?.Jetpack_Editor_Initial_State ) {
		return (
			window?.Jetpack_Editor_Initial_State?.available_blocks?.[ 'ai-featured-image-generator' ]
				?.available === true
		);
	}

	if ( window?.JetpackExternalMediaData ) {
		return window?.JetpackExternalMediaData?.[ 'ai-assistant' ]?.[ 'is-enabled' ];
	}

	return false;
};
