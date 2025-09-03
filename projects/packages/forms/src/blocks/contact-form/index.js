import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import { __, _x } from '@wordpress/i18n';
import './editor.scss';
import FormsIcon from '../shared/components/forms-icon';
import { getIconColor } from '../shared/util/block-icons';
import defaultAttributes from './attributes';
import deprecated from './deprecated';
import edit from './edit';
import transforms from './transforms';
import variations from './variations';

export const name = 'contact-form';

export const settings = {
	apiVersion: 3,
	title: __( 'Form', 'jetpack-forms' ),
	description: __(
		'Create forms to collect data from site visitors and manage their responses.',
		'jetpack-forms'
	),
	icon: { src: FormsIcon, foreground: getIconColor() },
	keywords: [
		_x( 'email', 'block search term', 'jetpack-forms' ),
		_x( 'feedback', 'block search term', 'jetpack-forms' ),
		_x( 'contact form', 'block search term', 'jetpack-forms' ),
	],
	supports: {
		color: {
			link: true,
			gradients: true,
		},
		html: false,
		spacing: {
			padding: true,
			margin: true,
		},
		align: [ 'wide', 'full' ],
	},
	attributes: defaultAttributes,
	providesContext: {
		'jetpack/form-class-name': 'className',
	},
	edit,
	save: () => {
		const blockProps = useBlockProps.save();
		return (
			<div { ...blockProps }>
				<InnerBlocks.Content />
			</div>
		);
	},
	example: {
		innerBlocks: [
			{
				name: 'jetpack/field-name',
				attributes: { required: true, label: __( 'Name', 'jetpack-forms' ) },
			},
			{
				name: 'jetpack/field-email',
				attributes: { required: true, label: __( 'Email', 'jetpack-forms' ) },
			},
			{
				name: 'jetpack/field-textarea',
				attributes: { label: __( 'Message', 'jetpack-forms' ) },
			},
			{
				name: 'jetpack/button',
				attributes: {
					text: __( 'Contact Us', 'jetpack-forms' ),
					element: 'button',
					lock: { remove: true },
				},
			},
		],
	},
	styles: [
		{ name: 'default', label: __( 'Default', 'jetpack-forms' ), isDefault: true },
		{ name: 'animated', label: __( 'Animated', 'jetpack-forms' ) },
		{ name: 'outlined', label: __( 'Outlined', 'jetpack-forms' ) },
		// Need to figure out some details. Putting on hold for now
		// { name: 'below', label: 'Below' },
	],
	variations,
	category: 'contact-form',
	transforms,
	deprecated,
};
