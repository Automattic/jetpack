<?php
/*
!
 * Admin Page Partial: Settings: Template variant block
 *
 * This block outputs a <select> for a template variant selector setting (e.g. invoice pdf template)
 */

// stop direct access
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

	global $zbs;

				// retrieve any extra templates, e.g. if 'invoices/invoice-pdf.html' -> if added (templates/invoice-pdf*.html)
				$variants        = jpcrm_retrieve_template_variants( $template_file );
				$default_present = false;

if ( is_array( $variants ) && count( $variants ) > 0 ) { ?>              
					<select id="<?php echo esc_attr( $setting_key ); ?>" name="<?php echo esc_attr( $setting_key ); ?>">

						<?php

						// flip them so default is at top
						$variants = array_reverse( $variants );

						foreach ( $variants as $template_path => $template_info ) {

							$default = false;

							// set a value, unless is default
							$option_value = $template_path;
							if ( $option_value == $template_file ) {
								$option_value    = '';
								$default         = true;
								$default_present = true;
							}

							?>
							<option value="<?php echo esc_attr( $option_value ); ?>"
														<?php
														if ( $settings[ $setting_key ] == $option_value ) {
															echo ' selected="selected"'; }
														?>
							>
								<?php
								if ( $default ) {
									esc_html_e( 'Default Template:', 'zero-bs-crm' ) . ' ';}
								?>
								<?php echo esc_html( $template_info['filename'] . ' (' . $template_info['origin'] . ')' ); ?>
							</option>
							<?php

						}

						if ( ! $default_present ) {

							?>
							<option value=""
							<?php
							if ( empty( $settings[ $setting_key ] ) ) {
								echo ' selected="selected"'; }
							?>
							>
								<?php echo esc_html( __( 'Default Template: ', 'zero-bs-crm' ) . $template_file ); ?>
							</option>
							<?php
						}

						?>

					</select>
					<?php
} else {

	// no templates available! show warning
	echo zeroBSCRM_UI2_messageHTML( 'warning', '', sprintf( __( 'Cannot find template for <code>%s</code>!', 'zero-bs-crm' ), $template_file ) );

}
