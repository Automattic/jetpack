import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { lineDashed } from '@wordpress/icons';
import { getIconColor } from '../contact-form/util/block-icons';
import edit from './edit';
import save from './save';

const name = 'dropzone';
const settings = {
	apiVersion: 3,
	title: __( 'File upload dropzone', 'jetpack-forms' ),
	description: __( 'A dropzone for file uploads.', 'jetpack-forms' ),
	parent: [ 'jetpack/field-file' ],
	allowedBlocks: [
		'core/buttons',
		'core/heading',
		'core/image',
		'core/list',
		'core/paragraph',
		'core/separator',
		'core/spacer',
	],
	category: 'contact-form',
	icon: {
		foreground: getIconColor(),
		src: <Icon icon={ lineDashed } />,
	},
	attributes: {
		style: {
			type: 'object',
			default: {
				layout: {
					type: 'flex',
					justifyContent: 'center',
					orientation: 'vertical',
				},
				spacing: {
					padding: {
						top: '48px',
						bottom: '48px',
						left: '48px',
						right: '48px',
					},
					margin: {
						top: '8px',
						bottom: '8px',
					},
				},
				border: {
					style: 'dashed',
					width: '1px',
					color: 'rgba(125,125,125,0.3)',
				},
			},
		},
	},
	supports: {
		reusable: false,
		html: false,
		// Mimic the layout settings of the core Group block.
		layout: {
			type: 'flex',
			allowSwitching: false,
			allowInheriting: false,
			allowJustification: true,
			allowVerticalAlignment: false,
			allowOrientation: false,
			default: {
				type: 'flex',
			},
		},
		color: {
			gradients: true,
			heading: true,
			button: true,
			link: true,
			__experimentalDefaultControls: {
				background: true,
				text: true,
			},
		},
		spacing: {
			margin: [ 'top', 'bottom' ],
			padding: true,
		},
		dimensions: {
			minHeight: true,
		},
		__experimentalBorder: {
			color: true,
			radius: true,
			style: true,
			width: true,
			__experimentalDefaultControls: {
				color: true,
				radius: true,
				style: true,
				width: true,
			},
		},
		align: [ 'wide', 'full' ],
	},
	edit,
	save,
};

export default {
	name,
	settings,
};
