<?php
/**
 * Stub config for WooCommerce classes and such needed in the Jetpack monorepo.
 *
 * @package automattic/jetpack-monorepo
 */

// phpcs:disable PHPCompatibility.Syntax.NewFlexibleHeredocNowdoc.ClosingMarkerNoNewLine -- https://github.com/PHPCompatibility/PHPCompatibility/issues/1696

$work_dir = getenv( 'WORK_DIR' );
if ( ! is_dir( $work_dir ) ) {
	throw new RuntimeException( 'WORK_DIR is not set or does not refer to a directory' );
}

$data = file_get_contents( "$work_dir/woocommerce/woocommerce/plugins/woocommerce/woocommerce.php" );
if ( ! preg_match( '/^ \* Version: (\d+\.\d+.*)/m', (string) $data, $m ) ) {
	throw new RuntimeException( "Failed to extract version from $work_dir/woocommerce/woocommerce/plugins/woocommerce/woocommerce.php" );
}
$version = $m[1];

return array(
	'header'  => <<<HEAD
	/**
	 * Stubs automatically generated from WooCommerce $version
	 * using the definition file `tools/stubs/woocommerce-internal-stub-defs.php` in the Jetpack monorepo.
	 *
	 * Do not edit this directly! Run tools/stubs/update-stubs.sh to regenerate it.
	 */
	HEAD,
	'basedir' => "$work_dir/woocommerce/woocommerce/",
	'files'   => array(
		'plugins/woocommerce/src/Internal/DataStores/Orders/CustomOrdersTableController.php' => array(
			'class' => array(
				'Automattic\WooCommerce\Internal\DataStores\Orders\CustomOrdersTableController' => array(),
			),
		),
		'plugins/woocommerce/src/Internal/DataStores/Orders/OrdersTableDataStore.php' => array(
			'class' => array(
				'Automattic\WooCommerce\Internal\DataStores\Orders\OrdersTableDataStore' => array(
					'method' => array( 'get_addresses_table_name', 'get_meta_table_name', 'get_operational_data_table_name', 'get_orders_table_name' ),
				),
			),
		),
		'plugins/woocommerce/tests/legacy/framework/helpers/class-wc-helper-product.php' => array(
			'class' => array(
				'WC_Helper_Product' => array(
					'method' => array( 'create_simple_product' ),
				),
			),
		),
	),
);
