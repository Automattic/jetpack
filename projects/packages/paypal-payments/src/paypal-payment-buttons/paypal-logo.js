/**
 * PayPal Logo SVG Component — Shared across editor preview and frontend save.
 *
 * Per PayPal brand guidelines, the PayPal wordmark must appear on any
 * button or call-to-action that initiates a PayPal payment flow.
 *
 * Dimensions are omitted from the SVG element — CSS controls the rendered
 * size via .jetpack-paypal-button__logo to keep sizing consistent across
 * the editor preview and frontend.
 *
 * @package
 * @since 0.9.0
 */

/**
 * PayPal logo SVG path data.
 *
 * Each entry is { d, fill } corresponding to a <path> element in the
 * official PayPal wordmark SVG (viewBox 0 0 101 32).
 */
export const PAYPAL_LOGO_PATHS = [
	{
		d: 'M12.5 4.7h-7c-.5 0-.9.3-1 .8L1.6 25c0 .3.2.6.6.6h3.3c.5 0 .9-.3 1-.8l.8-5.4c0-.5.5-.8 1-.8h2.3c4.7 0 7.4-2.3 8.1-6.8.3-2 0-3.5-.9-4.6C16.7 5.5 14.9 4.7 12.5 4.7zm.8 6.7c-.4 2.6-2.3 2.6-4.2 2.6h-1l.8-4.8c0-.3.3-.5.6-.5h.5c1.3 0 2.5 0 3.1.7.4.5.5 1.2.2 2z',
		fill: '#253B80',
	},
	{
		d: 'M35.2 11.3h-3.3c-.3 0-.5.2-.6.5l-.1.9-.2-.3c-.7-1-2.2-1.3-3.7-1.3-3.5 0-6.4 2.6-7 6.3-.3 1.8.1 3.6 1.2 4.8 1 1.1 2.4 1.6 4.1 1.6 2.9 0 4.5-1.9 4.5-1.9l-.1.9c0 .3.2.6.6.6h3c.5 0 .9-.3 1-.8l1.8-11.5c-.1-.4-.4-.8-.7-.8zm-4.5 6.1c-.3 1.8-1.8 3-3.6 3-.9 0-1.6-.3-2.1-.8-.4-.5-.6-1.3-.5-2.1.3-1.8 1.8-3 3.6-3 .9 0 1.6.3 2.1.8.4.6.6 1.3.5 2.1z',
		fill: '#253B80',
	},
	{
		d: 'M55.1 11.3h-3.4c-.3 0-.6.2-.8.4l-4.5 6.6-1.9-6.4c-.1-.4-.5-.6-.9-.6h-3.3c-.4 0-.7.4-.5.7l3.6 10.5-3.4 4.8c-.3.4 0 .9.4.9h3.3c.3 0 .6-.1.8-.4l10.9-15.7c.3-.4 0-.8-.3-.8z',
		fill: '#253B80',
	},
	{
		d: 'M67.4 4.7h-7c-.5 0-.9.3-1 .8L56.5 25c0 .3.2.6.6.6h3.5c.3 0 .6-.2.7-.6l.8-5.2c0-.5.5-.8 1-.8h2.3c4.7 0 7.4-2.3 8.1-6.8.3-2 0-3.5-.9-4.6-1.1-1.2-2.9-1.9-5.2-1.9zm.8 6.7c-.4 2.6-2.3 2.6-4.2 2.6h-1l.8-4.8c0-.3.3-.5.6-.5h.5c1.3 0 2.5 0 3.1.7.3.5.4 1.2.2 2z',
		fill: '#179BD7',
	},
	{
		d: 'M90.1 11.3h-3.3c-.3 0-.5.2-.6.5l-.1.9-.2-.3c-.7-1-2.2-1.3-3.7-1.3-3.5 0-6.4 2.6-7 6.3-.3 1.8.1 3.6 1.2 4.8 1 1.1 2.4 1.6 4.1 1.6 2.9 0 4.5-1.9 4.5-1.9l-.1.9c0 .3.2.6.6.6h3c.5 0 .9-.3 1-.8l1.8-11.5c-.1-.4-.3-.8-.7-.8zm-4.5 6.1c-.3 1.8-1.8 3-3.6 3-.9 0-1.6-.3-2.1-.8-.4-.5-.6-1.3-.5-2.1.3-1.8 1.8-3 3.6-3 .9 0 1.6.3 2.1.8.4.6.5 1.3.5 2.1z',
		fill: '#179BD7',
	},
	{
		d: 'M95.1 5.2l-3 19.9c0 .3.2.6.6.6h2.9c.5 0 .9-.3 1-.8L99.5 5.5c0-.3-.2-.6-.6-.6h-3.2c-.2 0-.5.1-.6.3z',
		fill: '#179BD7',
	},
];

/**
 * PayPal logo SVG component.
 *
 * @return {Element} PayPal logo SVG.
 */
export default function PayPalLogo() {
	return (
		<svg
			className="jetpack-paypal-button__logo"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 101 32"
			aria-hidden="true"
			focusable="false"
		>
			{ PAYPAL_LOGO_PATHS.map( ( pathData, index ) => (
				<path key={ index } d={ pathData.d } fill={ pathData.fill } />
			) ) }
		</svg>
	);
}
