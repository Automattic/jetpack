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
