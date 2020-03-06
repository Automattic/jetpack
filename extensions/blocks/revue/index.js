/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import attributes from './attributes';
import edit from './edit';
import icon from './icon';

export const name = 'revue';

export const settings = {
	title: __( 'Revue', 'jetpack' ),
	description: __( 'Add a subscription form for your Revue newsletter.', 'jetpack' ),
	icon,
	category: 'jetpack',
	keywords: [
		_x( 'email', 'block search term', 'jetpack' ),
		_x( 'subscription', 'block search term', 'jetpack' ),
		_x( 'newsletter', 'block search term', 'jetpack' ),
		_x( 'mailing list', 'block search term', 'jetpack' ),
	],
	supports: {
		html: false,
	},
	attributes,
	edit,
	save: ( { attributes: { revueUsername } } ) => {
		const url = `https://www.getrevue.co/profile/${ revueUsername }`;
		return (
			<div>
				<a href={ url }>{ url }</a>
			</div>
		);
	},
	example: {
		attributes: {
			revueUsername: 'example',
		},
	},
};
