/**
 * Returns a class based on the context a color is being used and its slug.
 * Note: This helper function was copied from core @wordpress/block-editor lib,
 * in order to avoid requiring not-needed dependencies to reduce the size
 * of compiled files used in the front-end.
 *
 * @example
 * const className = getColorClassName( 'color', canvasPrimaryColor );
 * @param colorContextName - Context/place where color is being used e.g: background, text etc...
 * @param colorSlug -        Slug of the color.
 * @returns String with the class corresponding to the color in the provided context.
 * Returns undefined if either colorContextName or colorSlug are not provided.
 */
export function getColorClassName( colorContextName, colorSlug ) {
	if ( ! colorContextName || ! colorSlug ) {
		return undefined;
	}

	return `has-${ colorSlug }-${ colorContextName }`;
}

/**
 * Creates a wrapper around a promise which allows it to be programmatically
 * cancelled. See: https://reactjs.org/blog/2015/12/16/ismounted-antipattern.html
 *
 * @example
 * const somePromise = makeCancellable( fetch('http://wordpress.org') );
 * somePromise.promise.then()
 * @param promise - the Promise to make cancelable
 * @returns Object containing original promise object and cancel method.
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
