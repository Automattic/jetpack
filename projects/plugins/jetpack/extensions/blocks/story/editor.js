import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';
import storyExample1 from './story_example-1.png';

const exampleAttributes = {
	mediaFiles: [
		{
			alt: '',
			caption: '',
			mime: 'image/jpg',
			type: 'image',
			id: 22,
			url: storyExample1,
		},
	],
};

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save,
	example: {
		attributes: exampleAttributes,
	},
} );
