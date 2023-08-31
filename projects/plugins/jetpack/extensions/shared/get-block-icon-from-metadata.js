/* eslint-disable jsdoc/no-undefined-types */
import { getIconColor } from './block-icons';

/**
 * Generate the icon as a React component from the SVG markup defined in block.json. This avoids
 * duplication of the SVG markup.
 *
 * @param {object} metadata - Block.json content
 * @returns {React.Component} Icon component
 */
export default function getBlockIconFromMetadata( metadata ) {
	// Note: using an `img` tag and passing the SVG markup as a data URI doesn't allow
	// us to dynamically set the icon color later on.
	/* eslint-disable-next-line react/no-danger */
	return <span dangerouslySetInnerHTML={ { __html: metadata.icon } } />;
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
export function getClientBlockIconProp( metadata ) {
	return {
		src: getBlockIconFromMetadata( metadata ),
		foreground: getIconColor(),
	};
}
