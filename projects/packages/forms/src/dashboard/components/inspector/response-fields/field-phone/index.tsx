/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
/**
 * Internal dependencies
 */
import TextWithFlag from '../../../text-with-flag/index.tsx';

type PhoneDisplayInfo = {
	formattedNumber: string;
	countryCode?: string;
};

type FieldPhoneProps = {
	phone: string;
};

/**
 * Renders a phone number with country flag and international formatting.
 * The libphonenumber-js library is loaded asynchronously to avoid bloating the main bundle.
 *
 * @param {FieldPhoneProps} props       - Component props.
 * @param {string}          props.phone - The phone number string to display.
 * @return {JSX.Element} The rendered phone field.
 */
const FieldPhone = ( { phone }: FieldPhoneProps ) => {
	const [ displayInfo, setDisplayInfo ] = useState< PhoneDisplayInfo >( {
		formattedNumber: phone,
	} );

	useEffect( () => {
		let cancelled = false;

		// Reset to raw phone value immediately when phone changes
		setDisplayInfo( { formattedNumber: phone, countryCode: undefined } );

		const formatPhone = async () => {
			try {
				const { parsePhoneNumber } = await import( 'libphonenumber-js' );
				if ( cancelled ) {
					return;
				}

				const phoneNumber = parsePhoneNumber( phone );
				if ( phoneNumber ) {
					setDisplayInfo( {
						formattedNumber: phoneNumber.formatInternational(),
						countryCode: phoneNumber.country,
					} );
				}
			} catch {
				// Parsing failed, keep the original phone number
			}
		};

		formatPhone();

		return () => {
			cancelled = true;
		};
	}, [ phone ] );

	const { formattedNumber, countryCode } = displayInfo;

	return (
		<TextWithFlag countryCode={ countryCode }>
			<a href={ `tel:${ phone }` }>{ formattedNumber }</a>
		</TextWithFlag>
	);
};

export default FieldPhone;
