import {
	getBlockIconProp,
	getJetpackExtensionAvailability,
} from '@automattic/jetpack-shared-extension-utils';
import { registerBlockType } from '@wordpress/blocks';
import AiDisabledEdit from '../../shared/components/ai-disabled-edit';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';

import './editor.scss';
import './components/feedback/style.scss';

const availability = getJetpackExtensionAvailability( 'ai-chat' );

if ( ! availability.available && availability.unavailableReason === 'ai_disabled' ) {
	// Hidden from the inserter; saved blocks still render the placeholder.
	registerBlockType( metadata, {
		edit: AiDisabledEdit,
		save,
		icon: getBlockIconProp( metadata ),
		supports: { ...metadata.supports, inserter: false },
	} );
} else {
	registerJetpackBlockFromMetadata( metadata, {
		edit,
		save,
	} );
}
