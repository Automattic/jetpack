import { InnerBlocks } from '@wordpress/block-editor';
import attributes from './attributes';
import supports from './supports';

export default {
	attributes,
	supports,
	save: () => <InnerBlocks.Content />,
};
