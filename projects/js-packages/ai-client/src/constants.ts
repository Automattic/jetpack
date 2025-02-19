/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

// Mappings
export const LANGUAGE_MAP = {
	en: {
		label: __( 'English', 'jetpack-ai-client' ),
	},
	es: {
		label: __( 'Spanish', 'jetpack-ai-client' ),
	},
	fr: {
		label: __( 'French', 'jetpack-ai-client' ),
	},
	de: {
		label: __( 'German', 'jetpack-ai-client' ),
	},
	it: {
		label: __( 'Italian', 'jetpack-ai-client' ),
	},
	pt: {
		label: __( 'Portuguese', 'jetpack-ai-client' ),
	},
	ru: {
		label: __( 'Russian', 'jetpack-ai-client' ),
	},
	zh: {
		label: __( 'Chinese', 'jetpack-ai-client' ),
	},
	ja: {
		label: __( 'Japanese', 'jetpack-ai-client' ),
	},
	ar: {
		label: __( 'Arabic', 'jetpack-ai-client' ),
	},
	hi: {
		label: __( 'Hindi', 'jetpack-ai-client' ),
	},
	ko: {
		label: __( 'Korean', 'jetpack-ai-client' ),
	},
};
export const PROMPT_TONES_MAP = {
	formal: {
		label: __( 'Formal', 'jetpack-ai-client' ),
		emoji: '🎩',
	},
	informal: {
		label: __( 'Informal', 'jetpack-ai-client' ),
		emoji: '😊',
	},
	optimistic: {
		label: __( 'Optimistic', 'jetpack-ai-client' ),
		emoji: '😃',
	},
	humorous: {
		label: __( 'Humorous', 'jetpack-ai-client' ),
		emoji: '😂',
	},
	serious: {
		label: __( 'Serious', 'jetpack-ai-client' ),
		emoji: '😐',
	},
	skeptical: {
		label: __( 'Skeptical', 'jetpack-ai-client' ),
		emoji: '🤨',
	},
	empathetic: {
		label: __( 'Empathetic', 'jetpack-ai-client' ),
		emoji: '💗',
	},
	confident: {
		label: __( 'Confident', 'jetpack-ai-client' ),
		emoji: '😎',
	},
	passionate: {
		label: __( 'Passionate', 'jetpack-ai-client' ),
		emoji: '❤️',
	},
	provocative: {
		label: __( 'Provocative', 'jetpack-ai-client' ),
		emoji: '🔥',
	},
};

// Prompt types
export const PROMPT_TYPE_SUMMARY_BY_TITLE = 'titleSummary' as const;
export const PROMPT_TYPE_CONTINUE = 'continue' as const;
export const PROMPT_TYPE_SIMPLIFY = 'simplify' as const;
export const PROMPT_TYPE_CORRECT_SPELLING = 'correctSpelling' as const;
export const PROMPT_TYPE_GENERATE_TITLE = 'generateTitle' as const;
export const PROMPT_TYPE_MAKE_LONGER = 'makeLonger' as const;
export const PROMPT_TYPE_MAKE_SHORTER = 'makeShorter' as const;
export const PROMPT_TYPE_CHANGE_TONE = 'changeTone' as const;
export const PROMPT_TYPE_SUMMARIZE = 'summarize' as const;
export const PROMPT_TYPE_CHANGE_LANGUAGE = 'changeLanguage' as const;
export const PROMPT_TYPE_USER_PROMPT = 'userPrompt' as const;
export const PROMPT_TYPE_JETPACK_FORM_CUSTOM_PROMPT = 'jetpackFormCustomPrompt' as const;
export const PROMPT_TYPE_TRANSFORM_LIST_TO_TABLE = 'transformListToTable' as const;
export const PROMPT_TYPE_WRITE_POST_FROM_LIST = 'writePostFromList' as const;

// Human-readable labels
export const TRANSLATE_LABEL = __( 'Translate', 'jetpack-ai-client' );
export const TONE_LABEL = __( 'Change tone', 'jetpack-ai-client' );
export const CORRECT_SPELLING_LABEL = __( 'Correct spelling and grammar', 'jetpack-ai-client' );
export const SIMPLIFY_LABEL = __( 'Simplify', 'jetpack-ai-client' );
export const SUMMARIZE_LABEL = __( 'Summarize', 'jetpack-ai-client' );
export const MAKE_SHORTER_LABEL = __( 'Make shorter', 'jetpack-ai-client' );
export const MAKE_LONGER_LABEL = __( 'Expand', 'jetpack-ai-client' );
export const TURN_LIST_INTO_TABLE_LABEL = __( 'Turn list into a table', 'jetpack-ai-client' );
export const WRITE_POST_FROM_LIST_LABEL = __( 'Write a post from this list', 'jetpack-ai-client' );
export const GENERATE_TITLE_LABEL = __( 'Generate a post title', 'jetpack-ai-client' );
export const SUMMARY_BASED_ON_TITLE_LABEL = __( 'Summary based on title', 'jetpack-ai-client' );
export const CONTINUE_LABEL = __( 'Continue writing', 'jetpack-ai-client' );

// Jetpack Sidebar
export const PLACEMENT_JETPACK_SIDEBAR = 'jetpack-sidebar' as const;
export const PLACEMENT_DOCUMENT_SETTINGS = 'document-settings' as const;
export const PLACEMENT_PRE_PUBLISH = 'pre-publish' as const;
