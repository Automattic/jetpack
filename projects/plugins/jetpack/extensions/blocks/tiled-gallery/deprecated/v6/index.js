import attributes from './attributes';
import save from './save';
import supports from './supports';

export default {
	attributes,
	migrate: oldAttributes => {
		// If the old block has classNames set, clean up any old "is-style-*" classes
		// that will clash with the new one we're adding.
		const className = (
			( oldAttributes.className || '' ).replace( /is-style-[^ ]+/, '' ) +
			` is-style-${ oldAttributes.mapStyle }`
		)
			.replace( /\s+/g, ' ' )
			.trim();
		const { mapStyle, ...newAttributes } = oldAttributes;
		return {
			...newAttributes,
			showFullscreenButton: true,
			className,
		};
	},
	supports,
	save,
};
