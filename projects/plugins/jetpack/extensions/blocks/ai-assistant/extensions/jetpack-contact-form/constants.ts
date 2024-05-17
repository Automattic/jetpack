export const JETPACK_FORM_AI_COMPOSITION_EXTENSION = 'ai-assistant-form-support' as const;

export const isJetpackFromBlockAiCompositionAvailable =
	window?.Jetpack_Editor_Initial_State?.available_blocks?.[ JETPACK_FORM_AI_COMPOSITION_EXTENSION ]
		?.available;

// All blocks to extend
export const JETPACK_FORM_CHILDREN_BLOCKS = [
	'jetpack/field-name',
	'jetpack/field-email',
	'jetpack/field-text',
	'jetpack/field-textarea',
	'jetpack/field-checkbox',
	'jetpack/field-date',
	'jetpack/field-telephone',
	'jetpack/field-url',
	'jetpack/field-checkbox-multiple',
	'jetpack/field-radio',
	'jetpack/field-select',
	'jetpack/field-consent',
	'jetpack/button',
];
