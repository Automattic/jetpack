import { useInnerBlocksProps } from '@wordpress/block-editor';

export default function RatingFieldSave() {
	const innerBlocksProps = useInnerBlocksProps.save();
	return <div { ...innerBlocksProps } />;
}
