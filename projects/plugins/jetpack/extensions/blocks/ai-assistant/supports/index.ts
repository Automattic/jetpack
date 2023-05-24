/**
 * External dependencies
 */
import { getBlockSupport } from '@wordpress/blocks';
import { addFilter } from '@wordpress/hooks';
/**
 * Internal dependencies
 */
import withAIAssistant from '../extensions/multiple-blocks-edition/edit';

export const SUPPORT_NAME = 'jetpack/ai';

function handleJetpackAISupports( settings ) {
	const jetpackAISupports = getBlockSupport( settings, SUPPORT_NAME );
	if ( ! jetpackAISupports ) {
		return settings;
	}

	const edit = jetpackAISupports?.assistant ? withAIAssistant( settings.edit ) : settings.edit;

	return {
		...settings,
		edit,
	};
}

addFilter(
	'blocks.registerBlockType',
	'jetpack/handle-jetpack-ai-supports',
	handleJetpackAISupports,
	100
);
