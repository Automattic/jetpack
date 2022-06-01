import { __, _x } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
import attributes from './attributes';
import deprecatedV1 from './deprecated/v1';
import edit from './edit';
import { queueMusic } from './icons/';
import save from './save';

import './style.scss';
import './editor.scss';

export const name = 'podcast-player';
export const namespaceName = `jetpack/${ name }`;
export const title = __( 'Podcast Player', 'jetpack' );
export const settings = {
	title,
	description: __( 'Select and play episodes from a single podcast.', 'jetpack' ),
	icon: {
		src: queueMusic,
		foreground: getIconColor(),
	},
	category: 'embed',
	keywords: [
		_x( 'audio', 'block search term', 'jetpack' ),
		_x( 'embed', 'block search term', 'jetpack' ),
	],
	supports: {
		align: [ 'wide', 'full' ],
		spacing: {
			padding: true,
			margin: true,
		},
		/*
		 * When true, a new field in the block sidebar allows to define an id for
		 * the block and a button to copy the direct link.
		 */
		anchor: false,
		/*
		 * When true, a new field in the block sidebar allows to define a custom
		 * className for the block’s wrapper.
		 */
		customClassName: true,
		/*
		 * When false, Gutenberg won't add a class like .wp-block-your-block-name to
		 * the root element of your saved markup.
		 */
		className: true,
		/*
		 * Setting this to false suppress the ability to edit a block’s markup
		 * individually. We often set this to false in Jetpack blocks.
		 */
		html: false,
		/*
		 * When false, user will only be able to insert the block once per post.
		 */
		multiple: true,
		/*
		 * When false, the block won't be available to be converted into a reusable
		 * block.
		 */
		reusable: true,
	},
	edit,
	save,
	attributes,
	example: {
		attributes: {
			customPrimaryColor: getIconColor(),
			hexPrimaryColor: getIconColor(),
			exampleFeedData: {
				title: __( 'Jetpack Example Podcast', 'jetpack' ),
				link: 'https://jetpack.com',
				cover:
					'https://jetpackme.files.wordpress.com/2020/05/jetpack-example-podcast-cover.png?w=160',
				tracks: [
					{
						id: '3',
						title: __( '3. Our third episode', 'jetpack' ),
						duration: '14:58',
					},
					{
						id: '2',
						title: __( '2. Interview with a special guest', 'jetpack' ),
						duration: '19:17',
					},
					{
						id: '1',
						title: __( '1. Welcome to Example Podcast', 'jetpack' ),
						duration: '11:25',
					},
				],
			},
		},
	},
	deprecated: [ deprecatedV1 ],
};
