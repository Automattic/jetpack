import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import { default as deprecated } from './deprecated';
import edit from './edit';
import save from './save';
import slideshowExample1 from './slideshow_example-1.jpg';
import slideshowExample2 from './slideshow_example-2.jpg';
import slideshowExample3 from './slideshow_example-3.jpg';
import transforms from './transforms';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save,
	transforms,
	example: {
		attributes: {
			align: 'center',
			autoplay: true,
			images: [
				{
					alt: '',
					caption: '',
					url: slideshowExample1,
				},
				{
					alt: '',
					caption: '',
					url: slideshowExample2,
				},
				{
					alt: '',
					caption: '',
					url: slideshowExample3,
				},
			],
			effect: 'slide',
		},
	},
	deprecated,
} );
