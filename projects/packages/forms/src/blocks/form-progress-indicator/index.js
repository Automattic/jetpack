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
		spacing: {
			margin: [ 'top', 'bottom' ],
			padding: true,
		},
		color: {
			text: true,
			background: true,
			gradients: true,
			__experimentalDefaultControls: {
				text: true,
				background: true,
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
	attributes: {
		progressColor: {
			type: 'string',
		},
		progressBackgroundColor: {
			type: 'string',
		},
	},
	usesContext: [ 'jetpack/form-steps', 'jetpack/form-current-step' ],
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
	example: {
		attributes: {
			className: 'is-style-dots',
		},
		innerBlocks: [],
	},
	deprecated: [
		// Previous versions with different supports or structure
		{
			apiVersion: 2,
			attributes: {
				progressColor: {
					type: 'string',
				},
				progressBackgroundColor: {
					type: 'string',
				},
			},
			supports: {
				html: false,
				reusable: false,
				dimensions: {
					minHeight: true,
				},
				spacing: {
					margin: true,
					padding: true,
				},
				color: {
					text: true,
					background: true,
					gradients: true,
					__experimentalDefaultControls: {
						text: true,
						background: true,
					},
				},
			},
			save() {
				return (
					<div className="jetpack-form-progress-indicator--wrapper">
						<div className="wp-block-jetpack-form-progress-indicator">
							<div className="jetpack-form-progress-indicator-bar"></div>
						</div>
					</div>
				);
			},
			migrate( attributes ) {
				const newAttributes = { ...attributes };

				if ( attributes.style ) {
					const newStyle = { ...attributes.style };

					// Convert horizontal margins to padding if they exist
					if ( newStyle.spacing?.margin ) {
						const { margin } = newStyle.spacing;

						// Initialize padding if it doesn't exist
						if ( ! newStyle.spacing.padding ) {
							newStyle.spacing.padding = {};
						}

						// Convert left/right margins to left/right padding
						if ( margin.left && ! newStyle.spacing.padding.left ) {
							newStyle.spacing.padding.left = margin.left;
						}
						if ( margin.right && ! newStyle.spacing.padding.right ) {
							newStyle.spacing.padding.right = margin.right;
						}

						// Keep only top/bottom margins
						newStyle.spacing.margin = {
							...( margin.top && { top: margin.top } ),
							...( margin.bottom && { bottom: margin.bottom } ),
						};
					}

					// Remove minHeight from dimensions since it's no longer supported
					if ( newStyle.dimensions?.minHeight ) {
						const { minHeight, ...remainingDimensions } = newStyle.dimensions;
						if ( Object.keys( remainingDimensions ).length === 0 ) {
							delete newStyle.dimensions;
						} else {
							newStyle.dimensions = remainingDimensions;
						}
					}

					// Migrate standard colors to custom semantic colors
					if ( newStyle.color?.background && ! newAttributes.progressBackgroundColor ) {
						newAttributes.progressBackgroundColor = newStyle.color.background;
					}
					if ( newStyle.color?.text && ! newAttributes.progressColor ) {
						newAttributes.progressColor = newStyle.color.text;
					}

					newAttributes.style = newStyle;
				}

				return newAttributes;
			},
		},
	],
};

export default {
	name,
	settings,
};
