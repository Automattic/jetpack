/**
 * PayPal Payment Buttons — A saved button the current user cannot edit.
 *
 * @package
 */

import { useBlockProps } from '@wordpress/block-editor';
import { Notice } from '@wordpress/ui';
import PayPalButtonPreview from './paypal-button-preview';

/**
 * Preview of a saved button with one line saying why it cannot be edited here.
 *
 * @param {object} props            - Component props.
 * @param {object} props.attributes - Block attributes.
 * @param {string} props.message    - Why the button cannot be edited.
 * @return {Element} Read-only preview.
 */
export default function ReadOnlyBlock( { attributes, message } ) {
	const blockProps = useBlockProps();
	const {
		format,
		productName,
		price,
		currencyCode,
		productDescription,
		paymentLink,
		variantsEnabled,
		variants,
		imageUrl,
		buttonText,
		linkText,
		qrShowCaption,
		qrCaption,
	} = attributes;

	return (
		<div { ...blockProps }>
			<Notice.Root intent="info">
				<Notice.Description>{ message }</Notice.Description>
			</Notice.Root>
			<PayPalButtonPreview
				format={ format }
				productName={ productName }
				price={ price }
				currencyCode={ currencyCode }
				productDescription={ productDescription }
				paymentLink={ paymentLink }
				variantsEnabled={ variantsEnabled }
				variants={ variants }
				imageUrl={ imageUrl }
				buttonText={ buttonText }
				linkText={ linkText }
				qrShowCaption={ qrShowCaption }
				qrCaption={ qrCaption }
				attributes={ attributes }
			/>
		</div>
	);
}
