import {
	getBlockIconProp,
	getJetpackExtensionAvailability,
} from '@automattic/jetpack-shared-extension-utils';
import { registerBlockType } from '@wordpress/blocks';
import { getAiDisabledGate } from '../../shared/get-ai-disabled-gate';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import AiDisabledEdit from './components/disabled-edit';
import edit from './edit';
import transforms from './transforms';

import './editor.scss';

/**
 * Extensions
 */
import './extensions/text-blocks/with-ai-text-extension';
import './extensions/image/with-ai-image-extension';

const disabledGate = getAiDisabledGate( getJetpackExtensionAvailability( 'ai-assistant' ) );

if ( disabledGate ) {
	// Hidden from the inserter; saved blocks still render the placeholder.
	registerBlockType( metadata, {
		edit: AiDisabledEdit,
		save: () => null,
		icon: getBlockIconProp( metadata ),
		attributes: metadata.attributes,
		supports: { ...metadata.supports, inserter: false },
	} );
} else {
	registerJetpackBlockFromMetadata( metadata, {
		edit,
		save: () => null,
		transforms,
	} );
}
