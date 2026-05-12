import { store as coreStore } from '@wordpress/core-data';
import { createRegistrySelector } from '@wordpress/data';
import { EMPTY_ARRAY } from '../constants';
import { MessageTemplatePlaceholder } from '../types';

/**
 * Get the list of placeholders supported in custom Publicize messages.
 *
 * @param state - State object.
 *
 * @return The list of supported placeholders.
 */
export const getMessageTemplatePlaceholders = createRegistrySelector( select => {
	return (): Array< MessageTemplatePlaceholder > => {
		const data = select( coreStore ).getEntityRecords< MessageTemplatePlaceholder >(
			'wpcom/v2',
			'publicize/message-templates/placeholders'
		);

		return data ?? EMPTY_ARRAY;
	};
} );

/**
 * Returns whether the message-template placeholder catalogue is being fetched.
 */
export const isFetchingMessageTemplatePlaceholders = createRegistrySelector( select => {
	return (): boolean => {
		const { isResolving } = select( coreStore );

		return isResolving( 'getEntityRecords', [
			'wpcom/v2',
			'publicize/message-templates/placeholders',
		] );
	};
} );
