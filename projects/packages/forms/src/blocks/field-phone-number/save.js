import { useInnerBlocksProps } from '@wordpress/block-editor';

export default function PhoneNumberFieldSave() {
	const innerBlocksProps = useInnerBlocksProps.save();
	return <div { ...innerBlocksProps } />;
}
