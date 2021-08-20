/**
 * WordPress dependencies
 */
import { render } from '@wordpress/element';

/**
 * Render things.
 *
 * @param {string} id - The selector to render.
 */
export function init( id ) {
	render( <div>Widget Visibility</div>, document.getElementById( id ) );
}
