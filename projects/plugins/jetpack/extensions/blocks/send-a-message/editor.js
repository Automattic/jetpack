import { InnerBlocks } from '@wordpress/block-editor';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';
import variations from './variations';
import {
	name as whatsAppButtonBlockName,
	settings as whatsAppButtonBlockSettings,
} from './whatsapp-button';

import './editor.scss';

registerJetpackBlockFromMetadata(
	metadata,
	{
		edit,
		save: props => {
			return (
				<div className={ props.className }>
					<InnerBlocks.Content />
				</div>
			);
		},
		variations,
	},
	[
		{
			name: whatsAppButtonBlockName,
			settings: whatsAppButtonBlockSettings,
		},
	]
);
