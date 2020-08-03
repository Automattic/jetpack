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
import getCategoryWithFallbacks from '../../shared/get-category-with-fallbacks';

/**
 * Example Images
 */
import storyExample1 from './story_example-1.png';

export const icon = (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
		<Path d="M0 0h24v24H0z" fill="none" />
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			fill="#2C3338"
			d="M6 3H14V17H6L6 3ZM4 3C4 1.89543 4.89543 1 6 1H14C15.1046 1 16 1.89543 16 3V17C16 18.1046 15.1046 19 14 19H6C4.89543 19 4 18.1046 4 17V3ZM18 5C19.1046 5 20 5.89543 20 7V21C20 22.1046 19.1046 23 18 23H10C8.89543 23 8 22.1046 8 21H18V5Z"
		/>
	</SVG>
);

const attributes = {
	mediaFiles: {
		type: 'array',
		default: [],
	},
};

const exampleAttributes = {
	align: 'center',
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
		inserter: true, // toggle to false before merging to BETA blocks
	},
	icon,
	edit,
	save,
	example: {
		attributes: exampleAttributes,
	},
};
