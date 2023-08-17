export const JETPACK_FORM_AI_COMPOSITION_EXTENSION = 'ai-assistant-form-support';

export const isJetpackFromBlockAiCompositionAvailable =
	window?.Jetpack_Editor_Initial_State.available_blocks?.[ JETPACK_FORM_AI_COMPOSITION_EXTENSION ]
		?.available;
