import { RichText } from '@wordpress/block-editor';
import clsx from 'clsx';
import attr from '../../attributes';
import { whatsAppURL } from '../../index';

export default {
	attributes: attr,
	supports: {
		html: false,
		reusable: false,
	},
	save: function ( { attributes, className } ) {
		const {
			countryCode,
			phoneNumber,
			firstMessage,
			colorClass,
			buttonText,
			backgroundColor,
			openInNewTab,
		} = attributes;

		const target = openInNewTab ? '_blank' : '_self';

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
			className,
			colorClass ? 'is-color-' + colorClass : undefined,
			! buttonText.length ? 'has-no-text' : undefined
		);

		return (
			<div className={ cssClassNames }>
				<a
					className="whatsapp-block__button"
					href={ getWhatsAppUrl() }
					style={ {
						backgroundColor: backgroundColor,
					} }
					target={ target }
					rel="noopener noreferrer"
				>
					<RichText.Content value={ buttonText } />
				</a>
			</div>
		);
	},
};
