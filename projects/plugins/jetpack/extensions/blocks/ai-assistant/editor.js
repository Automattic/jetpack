import {
	getBlockIconProp,
	getJetpackExtensionAvailability,
} from '@automattic/jetpack-shared-extension-utils';
import { registerBlockType } from '@wordpress/blocks';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import DisabledPlaceholder from './components/disabled-placeholder';
import edit from './edit';
import { getDisabledGate } from './lib/get-disabled-gate';
import transforms from './transforms';

import './editor.scss';

/**
 * Extensions
 */
import './extensions/text-blocks/with-ai-text-extension';
import './extensions/image/with-ai-image-extension';

const disabledGate = getDisabledGate( getJetpackExtensionAvailability( 'ai-assistant' ) );

if ( disabledGate ) {
	// A Jetpack AI setting is off. Register the block anyway, hidden from the
	// inserter, so posts that already contain it show a placeholder instead of
	// core's "unsupported block" warning.
	registerBlockType( metadata, {
		edit: DisabledPlaceholder,
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
