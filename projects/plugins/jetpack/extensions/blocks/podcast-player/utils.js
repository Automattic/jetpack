import clsx from 'clsx';
import { memoize } from 'lodash';

/**
 * Returns a class based on the context a color is being used and its slug.
 * Note: This helper function was copied from core @wordpress/block-editor lib,
 * in order to avoid requiring not-needed dependencies to reduce the size of
 * compiled files used in the front-end.
 *
 * @example
 * const className = getColorClassName( 'color', canvasPrimaryColor );
 *
 * @param {string} colorContextName - Context/place where color is being used
 * e.g: background, text etc...
 * @param {string} colorSlug - Slug of the color.
 *
 * @returns {string|undefined} String with the class corresponding to the color
 * in the provided context. Undefined if either colorContextName or colorSlug
 * are not provided.
 */
export function getColorClassName( colorContextName, colorSlug ) {
	if ( ! colorContextName || ! colorSlug ) {
		return undefined;
	}

	return `has-${ colorSlug }-${ colorContextName }`;
}

/**
 * Creates a wrapper around a promise which allows it to be programmatically
 * cancelled.
 *
 * @see {@link https://reactjs.org/blog/2015/12/16/ismounted-antipattern.html}
 *
 * @example
 * const somePromise = makeCancellable( fetch( 'http://wordpress.org' ) );
 * somePromise.promise.then();
 *
 * @param {Promise} promise - the Promise to make cancelable
 *
 * @returns {object} Object containing original promise object and cancel
 * method.
 */
export function makeCancellable( promise ) {
	let hasCanceled_ = false;

	const wrappedPromise = new Promise( ( resolve, reject ) => {
		promise.then(
			val => ( hasCanceled_ ? reject( { isCanceled: true } ) : resolve( val ) ),
			error => ( hasCanceled_ ? reject( { isCanceled: true } ) : reject( error ) )
		);
	} );

	return {
		promise: wrappedPromise,
		cancel() {
			hasCanceled_ = true;
		},
	};
}

/**
 * Returns object with detailed color settings computed from the basic configuration.
 *
 * @example
 * const colors = generateColorsObject( {
 *   primaryColor: '…',
 *   customPrimaryColor: '…',
 * } );
 * @param Object config with all color-related block attributes.
 * @returns Object with color details.
 */
const generateColorsObject = ( {
	primaryColor,
	customPrimaryColor,
	secondaryColor,
	customSecondaryColor,
	backgroundColor,
	customBackgroundColor,
} ) => {
	// Set CSS classes string.
	const primaryColorClass = getColorClassName( 'color', primaryColor );
	const secondaryColorClass = getColorClassName( 'color', secondaryColor );
	const backgroundColorClass = getColorClassName( 'background-color', backgroundColor );

	// Generate colors object.
	return {
		primary: {
			name: primaryColor,
			custom: customPrimaryColor,
			classes: clsx( {
				'has-primary': primaryColorClass || customPrimaryColor,
				[ primaryColorClass ]: primaryColorClass,
			} ),
		},
		secondary: {
			name: secondaryColor,
			custom: customSecondaryColor,
			classes: clsx( {
				'has-secondary': secondaryColorClass || customSecondaryColor,
				[ secondaryColorClass ]: secondaryColorClass,
			} ),
		},
		background: {
			name: backgroundColor,
			custom: customBackgroundColor,
			classes: clsx( {
				'has-background': backgroundColorClass || customBackgroundColor,
				[ backgroundColorClass ]: backgroundColorClass,
			} ),
		},
	};
};

/**
 * Memoized version of generateColorsObject.
 * @see {@link generateColorsObject} for params and return type.
 */
export const getColorsObject = memoize( generateColorsObject, config => {
	// Cache key is a string with all arguments joined into one string.
	return Object.values( config ).join();
} );
