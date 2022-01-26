/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { InnerBlocks } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';
import variations from './variations';
import { getIconColor } from '../../shared/block-icons';

/**
 * Style dependencies
 */
import './editor.scss';

export const name = 'one-payment';
export const title = __( 'One payment', 'jetpack' );
export const settings = {
	title,
	description: __( 'Sell products and services or receive donations on your website', 'jetpack' ),
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	category: 'earn',
	keywords: [],
	supports: {
		// This block acts as a dumb wrapper and so should offer minimal capabilities for customisation. In general,
		// individual feature support is up to the individual blocks wrapped. Exceptions to avoid confusion will exist
		// such as `multiple` and `reusable` features.
		alignWide: false,
		// Setting this to false suppress the ability to edit a block’s markup individually.
		html: false,
	},
	edit,
	save: () => <InnerBlocks.Content />,
	variations,
};
