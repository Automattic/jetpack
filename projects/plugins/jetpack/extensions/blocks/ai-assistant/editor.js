import {
	getBlockIconProp,
	getJetpackExtensionAvailability,
} from '@automattic/jetpack-shared-extension-utils';
import { registerBlockType } from '@wordpress/blocks';
import AiDisabledEdit from '../../shared/components/ai-disabled-edit';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';
import transforms from './transforms';

import './editor.scss';

/**
 * Extensions
 */
import './extensions/text-blocks/with-ai-text-extension';
import './extensions/image/with-ai-image-extension';

const availability = getJetpackExtensionAvailability( 'ai-assistant' );

if ( ! availability.available && availability.unavailableReason === 'ai_disabled' ) {
	// Hidden from the inserter; saved blocks still render the placeholder.
	registerBlockType( metadata, {
		edit: AiDisabledEdit,
		save: () => null,
		icon: getBlockIconProp( metadata ),
		supports: { ...metadata.supports, inserter: false },
	} );
} else {
	registerJetpackBlockFromMetadata( metadata, {
		edit,
		save: () => null,
		transforms,
	} );
}
