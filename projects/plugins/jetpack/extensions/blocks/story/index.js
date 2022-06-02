import { __, _x } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
import getCategoryWithFallbacks from '../../shared/get-category-with-fallbacks';
import edit from './edit';
import icon from './icon';
import save from './save';
import storyExample1 from './story_example-1.png';

const attributes = {
	settings: {
		type: 'object',
	},
	mediaFiles: {
		type: 'array',
		default: [],
	},
};

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

export { icon };

export const name = 'story';

export const settings = {
	title: __( 'Story', 'jetpack' ),
	category: getCategoryWithFallbacks( 'media', 'layout' ),
	keywords: [
		_x( 'story', 'block search term', 'jetpack' ),
		_x( 'image', 'block search term', 'jetpack' ),
		_x( 'video', 'block search term', 'jetpack' ),
		_x( 'gallery', 'block search term', 'jetpack' ),
	],
	description: __( 'Add an interactive story.', 'jetpack' ),
	attributes,
	supports: {
		html: false,
	},
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	edit,
	save,
	example: {
		attributes: exampleAttributes,
	},
};
