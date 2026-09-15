/**
 * Shared QR generation options.
 *
 * The frontend script and the editor preview both draw from these, so a QR in
 * the canvas is the same image as the one on the published page.
 *
 * @package
 */

export const QR_OPTIONS = {
	width: 200,
	margin: 2,
	errorCorrectionLevel: 'M',
	color: {
		dark: '#253B80', // PayPal dark blue
		light: '#FFFFFF',
	},
};
