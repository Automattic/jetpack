/**
 * The default label for a format's output.
 *
 * Button text and the QR caption are the same label
 * in three places, so they share one default. Applied at render rather than in
 * block.json, whose defaults cannot be translated.
 * render_api_managed_button() repeats it.
 *
 * @package
 */

import { __ } from '@wordpress/i18n';

export const DEFAULT_LABEL = __( 'Buy Now', 'jetpack-paypal-payments' );
