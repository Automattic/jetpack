/**
 * External dependencies
 */
import classnames from 'classnames';
import { RichText } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { whatsAppURL } from '../../index';
import attr from '../../attributes';

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

		const cssClassNames = classnames(
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
