/**
 * External dependencies
 */
import { RichText } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { whatsAppURL } from './index';

export default function SendAMessageSave( props ) {
	const {
		countryCode,
		phoneNumber,
		firstMessage,
		buttonText,
		backgroundColor,
		colorClass,
	} = props.attributes;

	const fullPhoneNumber = countryCode.replace( /\D+/g, '' ) + phoneNumber.replace( /\D+/g, '' );

	const getWhatsAppUrl = () => {
		let url = whatsAppURL + fullPhoneNumber;

		if ( '' !== firstMessage ) {
			url += '&text=' + encodeURIComponent( firstMessage );
		}

		return url;
	};

	return (
		<div className={ props.className + ' is-color-' + colorClass }>
			<a
				className="whatsapp-block__button"
				href={ getWhatsAppUrl() }
				style={ { backgroundColor: backgroundColor } }
			>
				<RichText.Content value={ buttonText } />
			</a>
		</div>
	);
}
