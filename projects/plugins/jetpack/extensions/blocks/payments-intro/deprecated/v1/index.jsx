import { InnerBlocks } from '@wordpress/block-editor';
export { default as attributes } from './attributes';
export { default as supports } from './supports';

export const save = () => <InnerBlocks.Content />;
