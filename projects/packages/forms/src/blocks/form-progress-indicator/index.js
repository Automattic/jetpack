import { useBlockProps } from '@wordpress/block-editor';
import { Rect } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import renderMaterialIcon from '../shared/components/render-material-icon';
import { getIconColor } from '../shared/util/block-icons';
import edit from './edit';
import save from './save';

export const name = 'form-progress-indicator';

export const settings = {
	apiVersion: 3,
	category: 'contact-form',
	ancestor: [ 'jetpack/contact-form' ],
	usesContext: [ 'jetpack/contact-form-id', 'jetpack/contact-form-steps' ],
	supports: {
		html: false,
		reusable: false,
		dimensions: {
			minHeight: true,
		},
		spacing: {
			margin: true,
		},
		color: {
			background: true,
			text: true,
			gradients: true,
			__experimentalDefaultControls: {
				background: true,
				text: true,
				gradient: true,
			},
		},
	},
	title: __( 'Progress indicator', 'jetpack-forms' ),
	description: __(
		'Show a visual indicator of progress through multi-step forms.',
		'jetpack-forms'
	),
	icon: {
		foreground: getIconColor(),
		src: renderMaterialIcon(
			<>
				<Rect
					x="3.75"
					y="9.75"
					width="16.5"
					height="4.5"
					rx="2.25"
					stroke="currentColor"
					fill="none"
					strokeWidth="1.5"
				/>
				<Rect x="2" y="9" width="8" height="6" rx="3" />
			</>
		),
	},
	edit: edit,
	save: save,
	attributes: {},
	styles: [
		{
			name: 'line',
			label: __( 'Line', 'jetpack-forms' ),
			isDefault: true,
		},
		{
			name: 'dots',
			label: __( 'Dots', 'jetpack-forms' ),
		},
	],
	transforms: {},
	example: {},
	deprecated: [
		// Deprecate old "default" style name in favor of explicit "line" style
		{
			attributes: {},
			styles: [
				{
					name: 'default',
					label: __( 'Default', 'jetpack-forms' ),
					isDefault: true,
				},
				{
					name: 'dots',
					label: __( 'Dots', 'jetpack-forms' ),
				},
			],
			save: () => {
				const blockProps = useBlockProps.save();
				return (
					<div className="jetpack-form-progress-indicator--wrapper">
						<div { ...blockProps }>
							<div className="jetpack-form-progress-indicator-steps"></div>
						</div>
					</div>
				);
			},
			isEligible: ( attributes, innerBlocks, { innerHTML } ) => {
				return (
					innerHTML &&
					innerHTML.includes( 'jetpack-form-progress-indicator-steps' ) &&
					innerHTML.includes( 'is-style-default' )
				);
			},
			migrate: ( attributes, innerBlocks, { innerHTML } ) => {
				// Replace is-style-default with is-style-line in innerHTML
				// Use regex to handle multiple occurrences and variations in spacing/formatting
				const updatedInnerHTML = innerHTML.replace( /is-style-default/g, 'is-style-line' );

				return [ attributes, innerBlocks, { innerHTML: updatedInnerHTML } ];
			},
		},
		// Deprecate old progress bar structure
		{
			attributes: {},
			save: () => {
				const blockProps = useBlockProps.save();
				return (
					<div className="jetpack-form-progress-indicator--wrapper">
						<div { ...blockProps }>
							<div className="jetpack-form-progress-indicator-bar"></div>
						</div>
					</div>
				);
			},
			isEligible: ( attributes, innerBlocks, { innerHTML } ) => {
				return (
					innerHTML &&
					innerHTML.includes( 'jetpack-form-progress-indicator-bar' ) &&
					! innerHTML.includes( 'jetpack-form-progress-indicator-steps' )
				);
			},
			migrate: attributes => attributes,
		},
	],
};

export default {
	name,
	settings,
};
