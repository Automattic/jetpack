/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { InnerBlocks } from '@wordpress/block-editor';
import { Path } from '@wordpress/components';

/**
 * Internal dependencies
 */
import edit from './edit';
import variations from './variations';
import renderMaterialIcon from '../../shared/render-material-icon';

/**
 * Style dependencies
 */
import './editor.scss';

export const name = 'send-a-message';
export const title = __( 'Send A Message', 'jetpack' );

export const settings = {
	title,
	description: __( 'Let your visitors to send you messages with the tap of a button.', 'jetpack' ),
	icon: renderMaterialIcon(
		<Path d="M13 7.5h5v2h-5zm0 7h5v2h-5zM19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM11 6H6v5h5V6zm-1 4H7V7h3v3zm1 3H6v5h5v-5zm-1 4H7v-3h3v3z" />
	),
	category: 'jetpack',
	keywords: [
		_x( 'whatsapp', 'keyword', 'jetpack' ),
		_x( 'messenger', 'keyword', 'jetpack' ),
		_x( 'contact', 'keyword', 'jetpack' ),
		_x( 'support', 'keyword', 'jetpack' ),
	],
	attributes: {},
	edit,
	save: InnerBlocks.Content,
	variations,
	example: {},
};
