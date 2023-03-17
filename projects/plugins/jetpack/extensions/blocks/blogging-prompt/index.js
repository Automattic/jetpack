import { ExternalLink } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
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
	description: (
		<Fragment>
			<p>{ __( 'Answer a new and inspiring writing prompt each day.', 'jetpack' ) }</p>
			{ /* @TODO add link */ }
			<ExternalLink href="#">{ __( 'Learn more.', 'jetpack' ) }</ExternalLink>
		</Fragment>
	),
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	category: 'jetpack',
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
