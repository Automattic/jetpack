import { Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { getIconColor } from '../contact-form/util/block-icons';
import renderMaterialIcon from '../contact-form/util/render-material-icon';
import edit from './edit';
import save from './save';

const name = 'dropzone';
const settings = {
	apiVersion: 3,
	title: __( 'File upload dropzone', 'jetpack-forms' ),
	description: __( 'A dropzone for file uploads.', 'jetpack-forms' ),
	parent: [],
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
		src: renderMaterialIcon(
			<Path d="M3.5 16.5a.5.5 0 0 0 .5.5h1.333v1.5H4l-.204-.01a1.98 1.98 0 0 1-.16-.024l-.076-.018-.072-.016a1.998 1.998 0 0 1-.246-.082l-.008-.003v-.001a2.003 2.003 0 0 1-1.082-1.082l-.006-.017a1.993 1.993 0 0 1-.055-.155l-.022-.072a1.962 1.962 0 0 1-.024-.105c-.004-.02-.01-.04-.013-.061a1.972 1.972 0 0 1-.021-.15L2 16.5v-1.125h1.5V16.5Zm7.167 2H8V17h2.667v1.5Zm5.333 0h-2.667V17H16v1.5Zm6-2-.01.204c-.006.05-.013.1-.022.15-.006.033-.015.065-.023.098l-.011.052a2 2 0 0 1-1.296 1.39l-.017.004a1.93 1.93 0 0 1-.117.036l-.052.011c-.03.007-.061.015-.093.02-.05.01-.102.019-.155.024L20 18.5h-1.333V17H20a.5.5 0 0 0 .5-.5v-1.125H22V16.5ZM3.5 13.125H2v-2.25h1.5v2.25Zm18.5 0h-1.5v-2.25H22v2.25ZM5.333 7H4a.5.5 0 0 0-.5.5v1.125H2V7.5c0-.13.012-.259.036-.383.007-.036.017-.072.026-.107l.022-.085.019-.056a2.004 2.004 0 0 1 1.131-1.217l.011-.005.046-.016c.026-.01.051-.02.077-.028l.06-.02.035-.009a1.98 1.98 0 0 1 .333-.063L4 5.5h1.333V7Zm14.871-1.49c.05.006.098.013.146.021l.04.007c.018.003.034.009.051.013l.09.021a1.985 1.985 0 0 1 .16.053l.053.019.02.008A2 2 0 0 1 22 7.5v1.125h-1.5V7.5A.5.5 0 0 0 20 7h-1.333V5.5H20l.204.01ZM10.667 7H8V5.5h2.667V7ZM16 7h-2.667V5.5H16V7Z" />
		),
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
