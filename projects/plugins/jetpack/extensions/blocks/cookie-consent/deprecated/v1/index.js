import save from '../../save';

/**
 * Deprecation reason:
 * Added fallback colors to CSS custom properties in the default style attributes.
 */
export default {
	attributes: {
		text: {
			type: 'string',
			source: 'html',
			selector: 'p',
		},
		style: {
			type: 'object',
			default: {
				color: {
					text: 'var(--wp--preset--color--contrast)',
					background: 'var(--wp--preset--color--tertiary)',
					link: 'var(--wp--preset--color--contrast)',
				},
				spacing: {
					padding: {
						top: '1em',
						right: '1em',
						bottom: '1em',
						left: '1em',
					},
				},
			},
		},
		align: {
			type: 'string',
			default: 'wide',
		},
		consentExpiryDays: {
			type: 'integer',
			default: 365,
		},
		showOverlay: {
			type: 'boolean',
			default: false,
		},
	},
	migrate: attributes => {
		const { style = {} } = attributes;
		const { color = {} } = style;

		// Add fallbacks to color properties that don't have them
		const migratedColor = {};
		if (
			typeof color.text === 'string' &&
			color.text.startsWith( 'var(' ) &&
			! color.text.includes( ', #' )
		) {
			migratedColor.text = `${ color.text }, #000000`;
		}
		if (
			typeof color.background === 'string' &&
			color.background.startsWith( 'var(' ) &&
			! color.background.includes( ', #' )
		) {
			migratedColor.background = `${ color.background }, #f0f0f0`;
		}
		if (
			typeof color.link === 'string' &&
			color.link.startsWith( 'var(' ) &&
			! color.link.includes( ', #' )
		) {
			migratedColor.link = `${ color.link }, #000000`;
		}

		return {
			...attributes,
			style: {
				...style,
				color: {
					...color,
					...migratedColor,
				},
			},
		};
	},
	isEligible: attributes => {
		const { style } = attributes;
		return style?.color?.text?.startsWith( 'var(' ) && ! style.color.text.includes( ',' );
	},
	save,
};
