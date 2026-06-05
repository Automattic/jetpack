import { __ } from '@wordpress/i18n';
import { Circle, Rect, SVG } from '@wordpress/primitives';
import edit from './edit.js';

const lineIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
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
	</SVG>
);

const dotsIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Circle cx="6" cy="12" r="2" fill="currentColor" />
		<Circle cx="12" cy="12" r="2" fill="currentColor" />
		<Circle cx="18" cy="12" r="2" fill="currentColor" />
	</SVG>
);

export const name = 'form-progress-indicator';

export const form_editor = {
	category: 'multistep',
};

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
			gradients: true,
			__experimentalDefaultControls: {
				text: true,
			},
		},
	},
	title: __( 'Progress indicator', 'jetpack-forms' ),
	description: __(
		'Show a visual indicator of progress through multi-step forms.',
		'jetpack-forms'
	),
	icon: {
		src: lineIcon,
	},
	edit: edit,
	save: () => null,
	attributes: {
		variant: {
			type: 'string',
			default: 'line',
		},
		progressColor: {
			type: 'string',
		},
		progressBackgroundColor: {
			type: 'string',
		},
	},
	usesContext: [ 'jetpack/form-steps', 'jetpack/form-current-step' ],
	variations: [
		{
			name: 'line',
			title: __( 'Line', 'jetpack-forms' ),
			description: __( 'Display progress as a continuous line', 'jetpack-forms' ),
			scope: [ 'transform' ],
			isDefault: true,
			attributes: {
				variant: 'line',
			},
			isActive: [ 'variant' ],
			icon: lineIcon,
		},
		{
			name: 'dots',
			title: __( 'Dots', 'jetpack-forms' ),
			description: __( 'Display progress as dots for each step', 'jetpack-forms' ),
			scope: [ 'transform' ],
			attributes: {
				variant: 'dots',
			},
			isActive: [ 'variant' ],
			icon: dotsIcon,
		},
	],
	transforms: {},
	example: {
		attributes: {
			variant: 'dots',
		},
		innerBlocks: [],
	},
	deprecated: [
		// Previous versions with different supports or structure
		{
			apiVersion: 2,
			attributes: {
				variant: {
					type: 'string',
					default: 'line',
				},
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
				// Simply add the default variant
				return {
					...attributes,
					variant: attributes.variant || 'line',
				};
			},
		},
	],
};

export default {
	name,
	settings,
	form_editor,
};
