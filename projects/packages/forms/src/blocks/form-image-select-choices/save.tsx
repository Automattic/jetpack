/**
 * External dependencies
 */
import { useInnerBlocksProps } from '@wordpress/block-editor';

export default () => {
	const innerBlocksProps = useInnerBlocksProps.save();

	return <div { ...innerBlocksProps } />;
};
