import {
	getBlockIconProp,
	getJetpackExtensionAvailability,
} from '@automattic/jetpack-shared-extension-utils';
import { registerBlockType } from '@wordpress/blocks';
import { getAiDisabledGate } from '../../shared/get-ai-disabled-gate';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import DisabledEdit from './components/disabled-edit';
import edit from './edit';
import save from './save';

import './editor.scss';
import './components/feedback/style.scss';

if ( getAiDisabledGate( getJetpackExtensionAvailability( 'ai-chat' ) ) ) {
	// Hidden from the inserter; saved blocks still render the placeholder.
	registerBlockType( metadata, {
		edit: DisabledEdit,
		save,
		icon: getBlockIconProp( metadata ),
		attributes: metadata.attributes,
		supports: { ...metadata.supports, inserter: false },
	} );
} else {
	registerJetpackBlockFromMetadata( metadata, {
		edit,
		save,
	} );
}
