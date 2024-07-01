<?php
/**
 * Stubs automatically generated from WooCommerce 8.9.2
 * using the definition file `tools/stubs/woocommerce-internal-stub-defs.php` in the Jetpack monorepo.
 *
 * Do not edit this directly! Run tools/stubs/update-stubs.sh to regenerate it.
 */

namespace {
    /**
     * Product helpers.
     *
     * @package WooCommerce\Tests
     */
    /**
     * Class WC_Helper_Product.
     *
     * This helper class should ONLY be used for unit tests!.
     */
    class WC_Helper_Product
    {
        /**
         * Create simple product.
         *
         * @since 2.3
         * @param bool  $save Save or return object.
         * @param array $props Properties to be set in the new product, as an associative array.
         * @return WC_Product_Simple
         */
        public static function create_simple_product($save = \true, $props = array())
        {
        }
    }
}
namespace Automattic\WooCommerce\Internal\DataStores\Orders {
    /**
     * This is the main class that controls the custom orders tables feature. Its responsibilities are:
     *
     * - Displaying UI components (entries in the tools page and in settings)
     * - Providing the proper data store for orders via 'woocommerce_order_data_store' hook
     *
     * ...and in general, any functionality that doesn't imply database access.
     */
    class CustomOrdersTableController
    {
        use \Automattic\WooCommerce\Internal\Traits\AccessiblePrivateMethods;
    }
    /**
     * This class is the standard data store to be used when the custom orders table is in use.
     */
    class OrdersTableDataStore extends \Abstract_WC_Order_Data_Store_CPT implements \WC_Object_Data_Store_Interface, \WC_Order_Data_Store_Interface
    {
        /**
         * Get the custom orders table name.
         *
         * @return string The custom orders table name.
         */
        public static function get_orders_table_name()
        {
        }
        /**
         * Get the order addresses table name.
         *
         * @return string The order addresses table name.
         */
        public static function get_addresses_table_name()
        {
        }
        /**
         * Get the orders operational data table name.
         *
         * @return string The orders operational data table name.
         */
        public static function get_operational_data_table_name()
        {
        }
        /**
         * Get the orders meta data table name.
         *
         * @return string Name of order meta data table.
         */
        public static function get_meta_table_name()
        {
        }
    }
}
