import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';
import example from './example';
import save from './save';
import * as timelineItem from './timeline-item';
import './editor.scss';
import './style.scss';

registerJetpackBlockFromMetadata(
	metadata,
	{
		edit,
		save,
		example,
	},
	[ timelineItem ]
);
