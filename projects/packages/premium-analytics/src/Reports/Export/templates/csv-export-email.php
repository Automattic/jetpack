<?php
/**
 * CSV Export Email Template (HTML)
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/csv-export-email.php.
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

/**
 * Output the email header.
 *
 * @hooked WC_Emails::email_header() Output the email header
 */
do_action( 'woocommerce_email_header', $email_heading, $email ); ?>

<p><?php esc_html_e( 'Your CSV export is attached to this email.', 'jetpack-premium-analytics' ); ?></p>

<h2><?php echo esc_html( $report_label ); ?></h2>

<p>
	<strong><?php esc_html_e( 'Date Range:', 'jetpack-premium-analytics' ); ?></strong>
	<?php
	$from = empty( $params['from'] ) ? '' : gmdate( 'F j, Y', (int) strtotime( $params['from'] ) );
	$to   = empty( $params['to'] ) ? '' : gmdate( 'F j, Y', (int) strtotime( $params['to'] ) );
	/* translators: 1: Start date, 2: End date */
	echo esc_html( sprintf( __( '%1$s to %2$s', 'jetpack-premium-analytics' ), $from, $to ) );
	?>
</p>

<?php if ( $is_comparison ) : ?>
	<p>
		<strong><?php esc_html_e( 'Comparison Period:', 'jetpack-premium-analytics' ); ?></strong>
		<?php
		$compare_from = empty( $params['compare_from'] ) ? '' : gmdate( 'F j, Y', (int) strtotime( $params['compare_from'] ) );
		$compare_to   = empty( $params['compare_to'] ) ? '' : gmdate( 'F j, Y', (int) strtotime( $params['compare_to'] ) );
		/* translators: 1: Start date, 2: End date */
		echo esc_html( sprintf( __( '%1$s to %2$s', 'jetpack-premium-analytics' ), $compare_from, $compare_to ) );
		?>
	</p>
<?php endif; ?>

<p><?php esc_html_e( 'The report is attached as a CSV file.', 'jetpack-premium-analytics' ); ?></p>

<?php
/**
 * Output the email footer.
 *
 * @hooked WC_Emails::email_footer() Output the email footer
 */
do_action( 'woocommerce_email_footer', $email );
