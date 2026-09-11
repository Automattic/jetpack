/**
 * Label defaults, filled in at render rather than in block.json so merchants
 * get a translated label. render_api_managed_button() repeats them.
 *
 * @package
 */

import { __ } from '@wordpress/i18n';

export const DEFAULT_BUTTON_TEXT = __( 'Buy Now', 'jetpack-paypal-payments' );
export const DEFAULT_QR_CAPTION = __( 'Buy Now', 'jetpack-paypal-payments' );
