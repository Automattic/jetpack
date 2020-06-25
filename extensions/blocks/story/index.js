/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Path, SVG } from '@wordpress/components';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';

/**
 * Example Images
 */
import storyExample1 from './story_example-1.png';
import storyExample2 from './story_example-2.png';
import storyExample3 from './story_example-3.png';
import storyExample4 from './story_example-4.png';

export const icon = (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
		<Path d="M0 0h24v24H0z" fill="none" />
		<Path d="M10 8v8l5-4-5-4zm9-5H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
	</SVG>
);

const attributes = {
	align: {
		default: 'center',
		type: 'string',
	},
	ids: {
		default: [],
		type: 'array',
	},
	mediaFiles: {
		type: 'array',
		default: [],
	},
};

const exampleAttributes = {
	align: 'center',
	ids: [ 22, 23, 24, 25 ],
	mediaFiles: [
		{
			alt: '',
			caption: '',
			mime: 'image/jpg',
			type: 'image',
			id: 22,
			url: storyExample1,
		},
		{
			alt: '',
			caption: '',
			mime: 'image/jpg',
			type: 'image',
			id: 23,
			url: storyExample2,
		},
		{
			alt: '',
			caption: '',
			mime: 'image/jpg',
			type: 'image',
			id: 24,
			url: storyExample3,
		},
		{
			alt: '',
			caption: '',
			mime: 'image/jpg',
			type: 'image',
			id: 25,
			url: storyExample4,
		},
	],
};

export const name = 'story';

export const settings = {
	title: __( 'Story', 'jetpack' ),
	category: 'media',
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
	icon,
	edit,
	save,
	example: {
		attributes: exampleAttributes,
	},
};
