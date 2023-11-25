import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';
import './style.scss';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save,
	example: {
		innerBlocks: [
			{
				name: 'jetpack/sharing-button',
				attributes: {
					service: 'facebook',
				},
			},
			{
				name: 'jetpack/sharing-button',
				attributes: {
					service: 'x',
				},
			},
			{
				name: 'jetpack/sharing-button',
				attributes: {
					service: 'mastodon',
				},
			},
		],
	},
} );
