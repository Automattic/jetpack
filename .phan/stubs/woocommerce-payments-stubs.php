<?php
/**
 * Stubs automatically generated from WooPayments 7.8.0
 * using the definition file `tools/stubs/woocommerce-payments-stub-defs.php` in the Jetpack monorepo.
 *
 * Do not edit this directly! Run tools/stubs/update-stubs.sh to regenerate it.
 */

/**
 * Class handling any account connection functionality
 */
class WC_Payments_Account
{
    /**
     * Wipes the account data option, forcing to re-fetch the account status from WP.com.
     */
    public function clear_cache()
    {
    }
}
/**
 * Main class for the WooPayments extension. Its responsibility is to initialize the extension.
 */
class WC_Payments
{
    /**
     * Returns the WC_Payments_Account instance
     *
     * @return WC_Payments_Account account service instance
     */
    public static function get_account_service()
    {
    }
}
