<?php
/**
 * CSV Export Email Template (Plain Text)
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/csv-export-email-plain.php.
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export
 *
 * @var WC_Email $email         Email object.
 * @var string   $report_label  Report label.
 * @var array    $params        Report parameters.
 * @var string   $email_heading Email heading.
 * @var bool     $sent_to_admin Whether sent to admin.
 * @var bool     $is_comparison Whether this is a comparison request.
 *
 * @phan-file-suppress PhanUndeclaredGlobalVariable -- Template variables are provided by wc_get_template_html() via extract(); see the @var block above.
 */

defined( 'ABSPATH' ) || exit;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable -- Template variables are provided by wc_get_template_html() via extract(); see the @var block above.

echo '= ' . esc_html( $email_heading ) . " =\n\n";

esc_html_e( 'Your CSV export is attached to this email.', 'jetpack-premium-analytics' );
echo "\n\n";

echo esc_html( $report_label ) . "\n\n";

echo esc_html__( 'Date Range:', 'jetpack-premium-analytics' ) . ' ';
$from = empty( $params['from'] ) ? '' : gmdate( 'F j, Y', (int) strtotime( $params['from'] ) );
$to   = empty( $params['to'] ) ? '' : gmdate( 'F j, Y', (int) strtotime( $params['to'] ) );
/* translators: 1: Start date, 2: End date */
echo esc_html( sprintf( __( '%1$s to %2$s', 'jetpack-premium-analytics' ), $from, $to ) );
echo "\n\n";

if ( $is_comparison ) {
	echo esc_html__( 'Comparison Period:', 'jetpack-premium-analytics' ) . ' ';
	$compare_from = empty( $params['compare_from'] ) ? '' : gmdate( 'F j, Y', (int) strtotime( $params['compare_from'] ) );
	$compare_to   = empty( $params['compare_to'] ) ? '' : gmdate( 'F j, Y', (int) strtotime( $params['compare_to'] ) );
	/* translators: 1: Start date, 2: End date */
	echo esc_html( sprintf( __( '%1$s to %2$s', 'jetpack-premium-analytics' ), $compare_from, $compare_to ) );
	echo "\n\n";
}

esc_html_e( 'The report is attached as a CSV file.', 'jetpack-premium-analytics' );
echo "\n\n";

echo "\n=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=\n\n";

/**
 * Output email footer text.
 *
 * @hooked woocommerce_email_footer_text filter for footer text
 */
echo esc_html( apply_filters( 'woocommerce_email_footer_text', get_option( 'woocommerce_email_footer_text' ) ) );
