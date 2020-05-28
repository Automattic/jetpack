/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';

export const name = 'gathering-tweetstorms';
export const title = __( 'Gathering Tweetstorms', 'jetpack' );
export const settings = {
	title,
	description: __( 'Convert a tweetstorm into a post.', 'jetpack' ),
	icon,
	category: 'jetpack',
	keywords: [ _x( 'twitter', 'jetpack' ) ],
	supports: {
		align: false,
		customClassName: false,
		className: false,
		html: false,
		multiple: true,
		reusable: false,
	},
	edit,
	save: () => null,
};
