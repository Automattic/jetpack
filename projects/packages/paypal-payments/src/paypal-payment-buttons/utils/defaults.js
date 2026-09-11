/**
 * The default label for a format's output.
 *
 * The button face and the QR caption use the same label, so they share one
 * default. Applied at render rather than in block.json, whose defaults cannot be
 * translated. render_api_managed_button() repeats it.
 *
 * @package
 */

import { __ } from '@wordpress/i18n';

export const DEFAULT_LABEL = __( 'Buy Now', 'jetpack-paypal-payments' );
