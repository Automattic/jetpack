import { InnerBlocks } from '@wordpress/block-editor';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import {
	name as blogRollItemBlockName,
	settings as blogRollItemBlockSettings,
} from './blogroll-item';
import edit from './edit';

import './editor.scss';

registerJetpackBlockFromMetadata(
	metadata,
	{
		edit,
		save: () => <InnerBlocks.Content />,
		providesContext: {
			showAvatar: 'show_avatar',
			showDescription: 'show_description',
			showSubscribeButton: 'show_subscribe_button',
			openLinksNewWindow: 'open_links_new_window',
		},
	},
	[
		{
			name: blogRollItemBlockName,
			settings: blogRollItemBlockSettings,
		},
	]
);
