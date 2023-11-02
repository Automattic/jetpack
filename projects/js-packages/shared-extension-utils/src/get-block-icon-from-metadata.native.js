/* eslint-disable jsdoc/no-undefined-types */
import { SvgXml } from 'react-native-svg';
import getIconColor from './get-icon-color';

/**
 * Generate an icon as a React component from the SVG markup defined in a block.json metadata file.
 * This prevents us from duplicating the markup in various places.
 *
 * Note: using an `img` tag and passing the SVG markup as a data URI doesn't allow us to
 * dynamically set the icon color later on.
 *
 * @param {object} metadata - Block.json content
 * @returns {JSX.Element} Icon component
 */
export function getBlockIconComponent( metadata ) {
	return <SvgXml xml={ metadata.icon } />;
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
