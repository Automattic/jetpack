import { InnerBlocks } from '@wordpress/block-editor';
import { Path } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
import renderMaterialIcon from '../../shared/render-material-icon';
import edit from './edit';
import variations from './variations';

import './editor.scss';

export const name = 'send-a-message';
export const title = __( 'Send A Message', 'jetpack' );

export const settings = {
	title,
	description: __( 'Let your visitors send you messages with the tap of a button.', 'jetpack' ),
	icon: {
		src: renderMaterialIcon(
			<Path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z" />
		),
		foreground: getIconColor(),
	},
	category: 'grow',
	keywords: [
		_x( 'whatsapp', 'keyword', 'jetpack' ),
		_x( 'messenger', 'keyword', 'jetpack' ),
		_x( 'contact', 'keyword', 'jetpack' ),
		_x( 'support', 'keyword', 'jetpack' ),
	],
	supports: {
		html: false,
	},
	attributes: {},
	edit,
	save: props => {
		return (
			<div className={ props.className }>
				<InnerBlocks.Content />
			</div>
		);
	},
	variations,
	example: {},
};
