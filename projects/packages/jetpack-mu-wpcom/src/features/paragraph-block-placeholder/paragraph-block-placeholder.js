import { addFilter } from '@wordpress/hooks';

addFilter(
	'blocks.registerBlockType',
	'jetpack-mu-wpcom/paragraph-block-placeholder',
	( settings, name ) => {
		if ( name !== 'core/paragraph' || ! window.wpcomParagraphBlock ) {
			return settings;
		}

		return {
			...settings,
			attributes: {
				...settings.attributes,
				placeholder: {
					...settings.attributes.placeholder,
					default: window.wpcomParagraphBlock.placeholder,
				},
			},
		};
	}
);
