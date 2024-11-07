import { InnerBlocks } from '@wordpress/block-editor';
import supports from './supports';

export { default as attributes } from './attributes';

export const save = () => <InnerBlocks.Content />;

export default {
	supports,
};
