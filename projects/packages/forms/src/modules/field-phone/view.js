import { store, getContext } from '@wordpress/interactivity';

const NAMESPACE = 'jetpack/form';

store( NAMESPACE, {
	state: {
		get getPhoneNumber() {
			const context = getContext();
			return context.phoneNumber;
		},
		get getCountryCode() {
			const context = getContext();
			return context.phoneCountryCode;
		},
		get getFullPhoneNumber() {
			const context = getContext();
			return `${ context.phoneCountryCode } ${ context.phoneNumber }`;
		},
	},
	actions: {
		onReset() {
			const context = getContext();
			context.phoneCountryCode = context.defaultCountry;
			context.phoneNumber = '';
		},
		onPhoneNumberChange( event ) {
			const context = getContext();
			const value = event.target.value;

			// Check for country code pattern: + followed by 1-3 digits
			const countryCodeMatch = value.match( /^\+(\d{1,3})/ );

			if ( countryCodeMatch ) {
				const potentialCode = countryCodeMatch[ 0 ];

				const countryCode = context.countryCodes?.find( code => code === potentialCode );

				context.phoneCountryCode = countryCode || context.phoneCountryCode;
				// If there's a space after the country code, split the input
				if ( value.charAt( potentialCode.length ) === ' ' ) {
					context.phoneNumber = value.substring( potentialCode.length + 1 );
				} else {
					// If no space yet, keep the whole input in phoneNumber
					context.phoneNumber = value;
				}
			} else {
				context.phoneNumber = value;
			}
		},
		onPhoneCountryChange( event ) {
			const context = getContext();
			context.phoneCountryCode = event.target.value;
		},
	},
} );
