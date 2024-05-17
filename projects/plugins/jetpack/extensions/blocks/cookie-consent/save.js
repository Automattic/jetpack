/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/#useblockprops
 */
import { InnerBlocks, useBlockProps, RichText } from '@wordpress/block-editor';
import { DEFAULT_TEXT } from './constants';

/**
 * The save function defines the way in which the different attributes should
 * be combined into the final markup, which is then serialized by the block
 * editor into `post_content`.
 *
 * @param {object} props - Save props.
 * @param {object} props.attributes - Block attributes.
 * @see https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#save
 * @returns {object} Element to render.
 */
export default function save( { attributes } ) {
	const blockProps = useBlockProps.save();
	const { text = DEFAULT_TEXT, consentExpiryDays } = attributes;

	return (
		<div { ...blockProps } style={ blockProps.style } role="dialog" aria-modal="true">
			<RichText.Content tagName="p" value={ text } />
			<InnerBlocks.Content />
			<span>{ consentExpiryDays }</span>
		</div>
	);
}
