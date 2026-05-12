import { useSelect } from '@wordpress/data';
import { store as socialStore } from '../social-store';
import { MessageTemplatePlaceholder } from '../social-store/types';

export type UseMessageTemplatePlaceholders = {
	placeholders: Array< MessageTemplatePlaceholder >;
	isLoading: boolean;
};

/**
 * Get the catalogue of placeholders supported in custom Publicize messages.
 *
 * @return The list of placeholders and whether they are still loading.
 */
export function useMessageTemplatePlaceholders(): UseMessageTemplatePlaceholders {
	return useSelect( select => {
		const { getMessageTemplatePlaceholders, isFetchingMessageTemplatePlaceholders } =
			select( socialStore );

		return {
			placeholders: getMessageTemplatePlaceholders(),
			isLoading: isFetchingMessageTemplatePlaceholders(),
		};
	}, [] );
}
