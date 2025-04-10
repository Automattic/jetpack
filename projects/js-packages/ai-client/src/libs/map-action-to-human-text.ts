import {
	LANGUAGE_MAP,
	PROMPT_TONES_MAP,
	PROMPT_TYPE_CHANGE_LANGUAGE,
	PROMPT_TYPE_CHANGE_TONE,
	PROMPT_TYPE_CONTINUE,
	PROMPT_TYPE_CORRECT_SPELLING,
	PROMPT_TYPE_GENERATE_TITLE,
	PROMPT_TYPE_MAKE_LONGER,
	PROMPT_TYPE_MAKE_SHORTER,
	PROMPT_TYPE_SIMPLIFY,
	PROMPT_TYPE_SUMMARIZE,
	PROMPT_TYPE_SUMMARY_BY_TITLE,
	PROMPT_TYPE_TRANSFORM_LIST_TO_TABLE,
	PROMPT_TYPE_WRITE_POST_FROM_LIST,
	CONTINUE_LABEL,
	CORRECT_SPELLING_LABEL,
	GENERATE_TITLE_LABEL,
	MAKE_LONGER_LABEL,
	MAKE_SHORTER_LABEL,
	SIMPLIFY_LABEL,
	SUMMARIZE_LABEL,
	SUMMARY_BASED_ON_TITLE_LABEL,
	TONE_LABEL,
	TRANSLATE_LABEL,
	TURN_LIST_INTO_TABLE_LABEL,
	WRITE_POST_FROM_LIST_LABEL,
} from '../constants.ts';

type MapActionToHumanTextOptions = {
	language?: string;
	tone?: string;
};

/**
 * Maps an action to a human-readable text.
 *
 * @param  action  - The action to map.
 * @param  options - The options for the mapping.
 * @return {string} The human-readable text.
 */
export function mapActionToHumanText(
	action: string,
	options: MapActionToHumanTextOptions = {}
): string | null {
	const { language, tone } = options;
	const languageCode = language?.split( ' (' )[ 0 ];

	switch ( action ) {
		case PROMPT_TYPE_CHANGE_LANGUAGE:
			return `${ TRANSLATE_LABEL }: ${ LANGUAGE_MAP[ languageCode ].label }`;
		case PROMPT_TYPE_CHANGE_TONE:
			return `${ TONE_LABEL }: ${ PROMPT_TONES_MAP[ tone ].label }`;
		case PROMPT_TYPE_CORRECT_SPELLING:
			return CORRECT_SPELLING_LABEL;
		case PROMPT_TYPE_SIMPLIFY:
			return SIMPLIFY_LABEL;
		case PROMPT_TYPE_SUMMARIZE:
			return SUMMARIZE_LABEL;
		case PROMPT_TYPE_MAKE_LONGER:
			return MAKE_LONGER_LABEL;
		case PROMPT_TYPE_MAKE_SHORTER:
			return MAKE_SHORTER_LABEL;
		case PROMPT_TYPE_TRANSFORM_LIST_TO_TABLE:
			return TURN_LIST_INTO_TABLE_LABEL;
		case PROMPT_TYPE_WRITE_POST_FROM_LIST:
			return WRITE_POST_FROM_LIST_LABEL;
		case PROMPT_TYPE_GENERATE_TITLE:
			return GENERATE_TITLE_LABEL;
		case PROMPT_TYPE_SUMMARY_BY_TITLE:
			return SUMMARY_BASED_ON_TITLE_LABEL;
		case PROMPT_TYPE_CONTINUE:
			return CONTINUE_LABEL;
		default:
			return null;
	}
}
