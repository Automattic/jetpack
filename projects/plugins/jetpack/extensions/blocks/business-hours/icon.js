import { getIconColor } from '../../shared/block-icons';
import metadata from './block.json';

// Generate the icon as a React component from the SVG markup defined in block.json.
// This avoids duplication of the SVG markup.
// Note: using an `img` tag and passing the SVG markup as a data URI doesn't allow
// us to dynamically set the icon color later on.
/* eslint-disable-next-line react/no-danger */
const icon = <span dangerouslySetInnerHTML={ { __html: metadata.icon } } />;

export default icon;

export const blockIconProp = {
	src: icon,
	foreground: getIconColor(),
};
