<?php
/**
 * Stub config for WooPayments classes and such needed in the Jetpack monorepo.
 *
 * @package automattic/jetpack-monorepo
 */

// phpcs:disable PHPCompatibility.Syntax.NewFlexibleHeredocNowdoc.ClosingMarkerNoNewLine -- https://github.com/PHPCompatibility/PHPCompatibility/issues/1696

$work_dir = getenv( 'WORK_DIR' );
if ( ! is_dir( $work_dir ) ) {
	throw new RuntimeException( 'WORK_DIR is not set or does not refer to a directory' );
}

$data = file_get_contents( "$work_dir/woocommerce-payments/woocommerce-payments.php" );
if ( ! preg_match( '/^ \* Version: (\d+\.\d+.*)/m', (string) $data, $m ) ) {
	throw new RuntimeException( "Failed to extract version from $work_dir/woocommerce-payments/woocommerce-payments.php" );
}
$version = $m[1];

return array(
	'header'  => <<<HEAD
	/**
	 * Stubs automatically generated from WooPayments $version
	 * using the definition file `tools/stubs/woocommerce-payments-stub-defs.php` in the Jetpack monorepo.
	 *
	 * Do not edit this directly! Run tools/stubs/update-stubs.sh to regenerate it.
	 */
	HEAD,
	'basedir' => "$work_dir/woocommerce-payments/",
	'files'   => array(
		'includes/class-wc-payments-account.php' => array(
			'class' => array(
				'WC_Payments_Account' => array(
					'method' => array( 'clear_cache' ),
				),
			),
		),
		'includes/class-wc-payments.php'         => array(
			'class' => array(
				'WC_Payments' => array(
					'method' => array(
						'get_account_service',
					),
				),
			),
		),
	),
);
