import { __ } from '@wordpress/i18n';

const licenseRegexp = /^jp-[A-Za-z]*[0-9]{14}$/;

/**
 * Performs a client-side validation on a jetpack license. Returns any issues that we can chack with the form
 *
 * @param {string} license -- The license to check
 * @returns {string|null} -- license error or null if no errors
 */
const validateLicense = license => {
	if (!licenseRegexp.test(license)) {
		return __('License should have the form jp-[product][14 numbers].', 'jetpack');
	}

	return null;
};

export default validateLicense;
