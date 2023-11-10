/* eslint-disable jsdoc/no-undefined-types */
import { SvgXml } from '@wordpress/primitives';
import getIconColor from './get-icon-color';

/**
 * Generate an icon as a React component from the SVG markup defined in a block.json metadata file.
 * This prevents us from duplicating the markup in various places.
 *
 * Note: using an `img` tag and passing the SVG markup as a data URI doesn't allow us to
 * dynamically set the icon color later on.
 *
 * @param {object} metadata - Block.json content
 * @returns {JSX.Element|string} Icon component
 */
export function getBlockIconComponent( metadata ) {
	// If the SVG has been passed as a string, use SvgXml to correctly parse it.
	if ( typeof metadata.icon === 'string' && metadata.icon.startsWith( '<svg' ) ) {
		return <SvgXml xml={ metadata.icon } />;
	}
	return metadata.icon || '';
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
