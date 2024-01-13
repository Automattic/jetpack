import { registerFormatType } from '@wordpress/rich-text';
import formats from '@wordpress/format-library/build/default-formats';

export const loadTextFormatting = () => {
	// Only register the formats we need
	formats.forEach( ( { name, ...settings } ) => {
		if ( [ 'core/bold', 'core/italic', 'core/link' ].includes( name ) ) {
			registerFormatType( name, settings );
		}
	} );
};
