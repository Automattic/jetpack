import { InnerBlocks, useBlockProps, RichText } from '@wordpress/block-editor';

export default {
	save: ( { attributes } ) => {
		const blockProps = useBlockProps.save();

		return (
			<div { ...blockProps } style={ blockProps.style } role="dialog" aria-modal="true">
				<RichText.Content tagName="p" value={ attributes.text } />
				<InnerBlocks.Content />
				<span>{ attributes.consentExpiryDays }</span>
			</div>
		);
	},
	isEligible: attributes => ! attributes.hasOwnProperty( 'isInWarningState' ),
};
