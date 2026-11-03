/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { FORM_POST_TYPE } from '../../blocks/shared/util/constants.js';

export type FormRecord = {
	title?: { rendered?: string };
	status?: string;
	is_collecting_responses?: boolean;
};

/**
 * Returns a form's record from core-data, loading it when needed.
 *
 * @param formId - The form ID, or a falsy value to skip loading.
 * @return The form record, or undefined while loading or without an ID.
 */
export default function useFormRecord( formId?: number | null ): FormRecord | undefined {
	return useSelect(
		select => {
			if ( ! formId ) {
				return undefined;
			}
			// No query argument: a single record loaded with one breaks later deletes, see routes/response/query.ts.
			return select( coreStore ).getEntityRecord( 'postType', FORM_POST_TYPE, formId ) as
				FormRecord | undefined;
		},
		[ formId ]
	);
}
