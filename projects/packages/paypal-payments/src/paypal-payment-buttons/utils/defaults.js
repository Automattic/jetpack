/**
 * Label defaults.
 *
 * The attributes default to an empty string and the label is filled in at
 * render, so a merchant who never touches the control gets a translated label
 * rather than an English one baked into block.json. The PHP side repeats these
 * in render_api_managed_button().
 *
 * @package
 */

import { __ } from '@wordpress/i18n';

export const DEFAULT_BUTTON_TEXT = __( 'Buy Now', 'jetpack-paypal-payments' );
export const DEFAULT_QR_CAPTION = __( 'Buy Now', 'jetpack-paypal-payments' );
