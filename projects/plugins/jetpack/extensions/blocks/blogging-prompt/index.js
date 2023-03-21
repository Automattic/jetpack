import { __, _x } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
import getCategoryWithFallbacks from '../../shared/get-category-with-fallbacks';
import attributes from './attributes';
import edit from './edit';
import icon from './icon';
import save from './save';

/**
 * Style dependencies
 */
import './editor.scss';

export const name = 'blogging-prompt';
export const title = __( 'Writing Prompt', 'jetpack' );
export const settings = {
	apiVersion: 2,
	title,
	description: __( 'Answer a new and inspiring writing prompt each day.', 'jetpack' ),
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	category: getCategoryWithFallbacks( 'text' ),
	keywords: [
		_x( 'writing', 'block search term', 'jetpack' ),
		_x( 'blogging', 'block search term', 'jetpack' ),
	],
	supports: {
		align: false,
		alignWide: false,
		anchor: false,
		className: true,
		color: {
			background: true,
			gradients: true,
			link: true,
			text: true,
		},
		customClassName: true,
		html: false,
		inserter: true,
		multiple: false,
		reusable: true,
		spacing: {
			margin: [ 'top', 'bottom' ],
			padding: true,
			blockGap: false,
		},
	},
	edit,
	save,
	attributes,
	example: {
		attributes: {
			// @TODO: Add default values for block attributes, for generating the block preview.
		},
	},
};
