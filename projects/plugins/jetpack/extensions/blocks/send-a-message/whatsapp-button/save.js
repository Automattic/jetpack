import { RichText, useBlockProps } from '@wordpress/block-editor';
import clsx from 'clsx';
import { whatsAppURL } from './index';

export default function SendAMessageSave( { attributes } ) {
	const {
		countryCode,
		phoneNumber,
		firstMessage,
		buttonText,
		backgroundColor,
		colorClass,
		openInNewTab,
	} = attributes;
	const blockProps = useBlockProps.save();

	const fullPhoneNumber =
		countryCode && phoneNumber
			? countryCode.replace( /\D+/g, '' ) + phoneNumber.replace( /\D+/g, '' )
			: '';

	const getWhatsAppUrl = () => {
		let url = whatsAppURL + fullPhoneNumber;

		if ( '' !== firstMessage ) {
			url += '&text=' + encodeURIComponent( firstMessage );
		}

		return url;
	};

	const cssClassNames = clsx(
		blockProps?.className,
		colorClass ? 'is-color-' + colorClass : undefined,
		! buttonText.length ? 'has-no-text' : undefined
	);

	const target = openInNewTab ? '_blank' : '_self';

	return (
		<div { ...blockProps } className={ cssClassNames }>
			<a
				className="whatsapp-block__button"
				href={ getWhatsAppUrl() }
				style={ {
					backgroundColor: backgroundColor,
					color: 'dark' === colorClass ? '#fff' : '#465B64',
				} }
				target={ target }
				rel="noopener noreferrer"
			>
				<RichText.Content value={ buttonText } />
			</a>
		</div>
	);
}
