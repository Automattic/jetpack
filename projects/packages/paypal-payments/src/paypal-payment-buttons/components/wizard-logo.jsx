/**
 * PayPal Payment Buttons — PayPal wordmark.
 *
 * @package
 */

import paypalWordmark from '../images/paypal-wordmark-color.svg';

/**
 * PayPal's wordmark for the wizard welcome step, unmodified.
 * Decorative, since the heading above says PayPal.
 */
export const wizardLogo = (
	<img className="jetpack-paypal-wizard__logo" src={ paypalWordmark } alt="" />
);
