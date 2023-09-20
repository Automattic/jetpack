import { __ } from '@wordpress/i18n';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import {
	name as blogRollItemBlockName,
	settings as blogRollItemBlockSettings,
} from './blogroll-item';
import edit from './edit';
import save from './save';

import './editor.scss';

registerJetpackBlockFromMetadata(
	metadata,
	{
		title: __( 'Blogroll (Beta)', 'jetpack' ),
		description: __( 'Select the sites you follow and share them with your users.', 'jetpack' ),
		keywords: [],
		edit,
		save,
	},
	[
		{
			name: blogRollItemBlockName,
			settings: blogRollItemBlockSettings,
		},
	]
);
