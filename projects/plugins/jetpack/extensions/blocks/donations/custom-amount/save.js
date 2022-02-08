/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

const Save = props => {
	const { attributes } = props;

	return attributes.isVisible ? <InnerBlocks.Content /> : null;
};

export default Save;
