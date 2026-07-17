/**
 * Registers the Divi 5 module icons into the builder's icon library.
 */
import { addFilter } from '@wordpress/hooks';
import * as videoPressLogo from './videopress';

/*
 * Divi looks up a module's `moduleIcon` name in this map. The spread is required:
 * returning only our icon would overwrite every other icon in the library.
 * `@wordpress/hooks` is externalized to Divi's vendored instance (see
 * webpack.config.js), so this registers on the same instance Divi reads from.
 */
addFilter( 'divi.iconLibrary.icon.map', 'jetpack-videopress', icons => ( {
	...icons,
	[ videoPressLogo.name ]: videoPressLogo,
} ) );
