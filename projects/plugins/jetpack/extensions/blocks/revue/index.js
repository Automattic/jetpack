import { __, _x } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
import attributes from './attributes';
import deprecatedV1 from './deprecated/v1';
import edit from './edit';
import icon from './icon';
import save from './save';

export const innerButtonBlock = {
	name: 'jetpack/button',
	attributes: {
		element: 'button',
		text: _x( 'Subscribe', 'verb: e.g. subscribe to a newsletter.', 'jetpack' ),
	},
};

export const name = 'revue';

export const settings = {
	title: __( 'Revue', 'jetpack' ),
	description: __( 'Add a subscription form for your Revue newsletter.', 'jetpack' ),
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	category: 'grow',
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
	save,
	example: {
		attributes: { revueUsername: 'example' },
		innerBlocks: [ innerButtonBlock ],
	},
	deprecated: [ deprecatedV1 ],
};
