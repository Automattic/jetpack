/* eslint-disable jsdoc/no-undefined-types */
import { createElement } from '@wordpress/element';
import getIconColor from './get-icon-color';

/**
 * Generate an icon as a React component from the SVG markup defined in a block.json metadata file.
 * This prevents us from duplicating the markup in various places.
 *
 * Note: using an `img` tag and passing the SVG markup as a data URI doesn't allow us to
 * dynamically set the icon color later on.
 *
 * @param {object} metadata - Block.json content
 * @returns {React.Component} Icon component
 */
export function getBlockIconComponent( metadata ) {
	// Set default values
	const attrs = {};
	let tagName = 'span';
	let markup = metadata.icon;

	// Convert SVG from string to HTML element
	const placeholder = document.createElement( 'div' );
	placeholder.innerHTML = metadata.icon;
	const svg = placeholder.querySelector( 'svg' );

	// Get SVG attributes and content
	if ( svg ) {
		tagName = 'svg';
		markup = svg.innerHTML;

		Array.from( svg.attributes ).forEach(
			( { nodeName, nodeValue } ) => ( attrs[ nodeName ] = nodeValue )
		);
	}

	return createElement( tagName, {
		...attrs,
		dangerouslySetInnerHTML: { __html: markup || '' },
	} );
}

/**
 * A block icon needs to be redefined on the front end as a React component, since a string - even
 * SVG markup - is interpreted as a dashicon. This function returns the object that must be passed
 * to the `icon` attribute when registering the block in the front end. It also sets the color
 * of the icon.
 *
 * @param {object} metadata - Block.json content
 * @returns {object} Icon property for client registration
 */
export function getBlockIconProp( metadata ) {
	return {
		src: getBlockIconComponent( metadata ),
		foreground: getIconColor(),
	};
}
