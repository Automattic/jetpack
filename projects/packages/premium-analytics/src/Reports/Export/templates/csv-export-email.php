<?php
/**
 * CSV Export Email Template (HTML)
 *
 * This template can be overridden by copying it to yourtheme/woocommerce/emails/csv-export-email.php.
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export
 *
 * @var WC_Email $email         Email object.
 * @var string   $report_label    Report label.
 * @var array    $params          Report parameters.
 * @var string   $file_url        Download URL.
 * @var string   $email_heading   Email heading.
 * @var bool     $sent_to_admin   Whether sent to admin.
 * @var bool     $is_comparison   Whether this is a comparison request.
 * @var int      $retention_hours Retention period in hours.
 */

defined( 'ABSPATH' ) || exit;

/**
 * Output the email header.
 *
 * @hooked WC_Emails::email_header() Output the email header
 */
do_action( 'woocommerce_email_header', $email_heading, $email ); ?>

<p><?php esc_html_e( 'Your CSV export is ready for download!', 'jetpack-premium-analytics' ); ?></p>

<h2><?php echo esc_html( $report_label ); ?></h2>

<p>
	<strong><?php esc_html_e( 'Date Range:', 'jetpack-premium-analytics' ); ?></strong>
	<?php
	$from = gmdate( 'F j, Y', strtotime( $params['from'] ) );
	$to   = gmdate( 'F j, Y', strtotime( $params['to'] ) );
	/* translators: 1: Start date, 2: End date */
	echo esc_html( sprintf( __( '%1$s to %2$s', 'jetpack-premium-analytics' ), $from, $to ) );
	?>
</p>

<?php if ( $is_comparison ) : ?>
	<p>
		<strong><?php esc_html_e( 'Comparison Period:', 'jetpack-premium-analytics' ); ?></strong>
		<?php
		$compare_from = gmdate( 'F j, Y', strtotime( $params['compare_from'] ) );
		$compare_to   = gmdate( 'F j, Y', strtotime( $params['compare_to'] ) );
		/* translators: 1: Start date, 2: End date */
		echo esc_html( sprintf( __( '%1$s to %2$s', 'jetpack-premium-analytics' ), $compare_from, $compare_to ) );
		?>
	</p>
<?php endif; ?>

<p style="margin: 30px 0;">
	<a href="<?php echo esc_url( $file_url ); ?>"
		style="background-color: #7f54b3; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
		<?php esc_html_e( 'Download CSV File', 'jetpack-premium-analytics' ); ?>
	</a>
</p>

<p style="color: #666; font-size: 12px;">
	<?php
	/* translators: %d: Number of hours until link expires */
	echo esc_html( sprintf( _n( 'Note: This download link will expire in %d hour.', 'Note: This download link will expire in %d hours.', $retention_hours, 'jetpack-premium-analytics' ), $retention_hours ) );
	?>
</p>

<?php
/**
 * Output the email footer.
 *
 * @hooked WC_Emails::email_footer() Output the email footer
 */
do_action( 'woocommerce_email_footer', $email );
