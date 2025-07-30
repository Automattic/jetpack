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
			background: false, // Disable default background to avoid wrapper styling
			__experimentalDefaultControls: {
				text: true,
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
	deprecated: [
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
			save: ( { attributes } ) => {
				const { showStepNames, progressColor, backgroundColor } = attributes;
				const blockProps = useBlockProps.save( {
					style: {
						'--jetpack-progress-color': progressColor || undefined,
						'--jetpack-progress-bg-color': backgroundColor || undefined,
					},
				} );

				return (
					<div
						className="jetpack-form-progress-indicator--wrapper"
						data-show-step-names={ showStepNames }
					>
						<div { ...blockProps }>
							<div className="jetpack-form-progress-indicator-bar"></div>
							<div className="jetpack-form-progress-indicator-steps"></div>
						</div>
					</div>
				);
			},
		},
	],
};

export default {
	name,
	settings,
};
