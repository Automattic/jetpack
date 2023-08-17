import { __, _x } from '@wordpress/i18n';
import { pageBreak as icon } from '@wordpress/icons';
import { getIconColor } from '../../shared/block-icons';
import edit from './edit';
import transforms from './transforms';

/**
 * Style dependencies
 */
import './editor.scss';

export const name = 'paywall';
export const title = __( 'Paywall', 'jetpack' );
export const settings = {
	title,
	description: __(
		'Add a paywall block to make part of your content exclusive to paid subscribers.',
		'jetpack'
	),
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	category: 'earn',
	keywords: [
		_x( 'more', 'block search term', 'jetpack' ),
		_x( 'email', 'block search term', 'jetpack' ),
		_x( 'follow', 'block search term', 'jetpack' ),
		_x( 'gated', 'block search term', 'jetpack' ),
		_x( 'memberships', 'block search term', 'jetpack' ),
		_x( 'newsletter', 'block search term', 'jetpack' ),
		_x( 'signin', 'block search term', 'jetpack' ),
		_x( 'subscribe', 'block search term', 'jetpack' ),
		_x( 'subscription', 'block search term', 'jetpack' ),
		_x( 'subscriptions', 'block search term', 'jetpack' ),
	],
	supports: {
		customClassName: false,
		html: false,
		multiple: false,
	},
	parent: [ 'core/post-content' ],
	edit,
	save: () => null,
	example: {
		attributes: {},
	},
	transforms,
};
