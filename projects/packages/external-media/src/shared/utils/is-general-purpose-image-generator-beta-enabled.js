export const isGeneralPurposeImageGeneratorBetaEnabled = () => {
	if ( window?.Jetpack_Editor_Initial_State ) {
		return (
			window?.Jetpack_Editor_Initial_State?.available_blocks?.[
				'ai-general-purpose-image-generator'
			]?.available === true
		);
	}

	if ( window?.JetpackExternalMediaData ) {
		return window?.JetpackExternalMediaData?.[ 'ai-assistant' ]?.[ 'is-enabled' ];
	}

	return false;
};
