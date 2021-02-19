/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import attributes from './attributes';
import edit from './edit';
import { getIconColor } from '../../shared/block-icons';

export const name = 'instagram-gallery';

// Regex to match Instagram profile url with username, but not individual instagram posts that
// are already handed by oembed.
// Username can use letters, numbers, underscores, and periods
// Ex: https://www.instagram.com/wordpressdotcom
export const URL_REGEX = /^\s*https?:\/\/(www\.)?instagr(\.am|am\.com)\/[A-z0-9_.]+\/?\s*$/i;

export const settings = {
	title: __( 'Latest Instagram Posts', 'jetpack' ),
	description: __(
		'Display an automatically updating list of the latest posts from your Instagram feed.',
		'jetpack'
	),
	icon: {
		src: 'instagram',
		foreground: getIconColor(),
	},
	category: 'embed',
	keywords: [
		_x( 'images', 'block search term', 'jetpack' ),
		_x( 'photos', 'block search term', 'jetpack' ),
		_x( 'pictures', 'block search term', 'jetpack' ),
	],
	supports: {
		align: true,
		html: false,
	},
	attributes,
	edit,
	save: ( { attributes: { instagramUser } } ) =>
		instagramUser && (
			<div>
				<a
					href={ `https://www.instagram.com/${ instagramUser }/` }
					rel="noopener noreferrer"
					target="_blank"
				>{ `https://www.instagram.com/${ instagramUser }/` }</a>
			</div>
		),
	transforms: {
		from: [
			{
				type: 'raw',
				isMatch: node => node.nodeName === 'P' && URL_REGEX.test( node.textContent ),
				transform: node =>
					createBlock( `jetpack/${ name }`, {
						url: node.textContent.trim(),
					} ),
			},
		],
	},
};
