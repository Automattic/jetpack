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
			text: true,
			background: true, // Keep background support for backward compatibility
			gradients: true,
			__experimentalDefaultControls: {
				background: true,
				text: true,
				gradient: true,
			},
		},
		__experimentalBorder: {
			color: true,
			radius: true,
			width: true,
		},
	},
	usesContext: [ 'jetpack/form-steps' ],
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
	attributes: {
		showStepNames: {
			type: 'boolean',
			default: false,
		},
		progressColor: {
			type: 'string',
		},
		backgroundColor: {
			type: 'string',
		},
	},
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
	// Accept legacy markup (single progress bar div) as still valid to avoid validation errors.
	isValid: ( attrs, innerBlocks, { innerHTML } ) => {
		return (
			innerHTML &&
			innerHTML.includes( 'jetpack-form-progress-indicator-bar' ) &&
			! innerHTML.includes( 'jetpack-form-progress-indicator-steps' )
		);
	},
	deprecated: [
		// v1 – original implementation with only progress bar (no steps container)
		{
			// When block was saved before attributes like showStepNames existed.
			attributes: {
				showStepNames: { type: 'boolean' },
				progressColor: { type: 'string' },
				backgroundColor: { type: 'string' },
			},
			isEligible: attrs => attrs.showStepNames === undefined,
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
			migrate: attributes => ( {
				...attributes,
				showStepNames: false,
			} ),
		},
		{
			attributes: {
				showStepNames: {
					type: 'boolean',
					default: false,
				},
				progressColor: {
					type: 'string',
				},
				backgroundColor: {
					type: 'string',
				},
			},
			save: () => {
				// Legacy output only included the progress bar element.
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
				// Eligible when markup contains the legacy bar element but NOT the new steps container.
				return (
					innerHTML &&
					innerHTML.includes( 'jetpack-form-progress-indicator-bar' ) &&
					! innerHTML.includes( 'jetpack-form-progress-indicator-steps' )
				);
			},
			migrate: attributes => {
				// Ensure showStepNames defaults to false if not set
				return {
					...attributes,
					showStepNames: attributes.showStepNames !== undefined ? attributes.showStepNames : false,
				};
			},
		},
	],
};

export default {
	name,
	settings,
};
