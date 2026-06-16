<?php
/**
 * This is an automatically generated baseline for Phan issues.
 * When Phan is invoked with --load-baseline=path/to/baseline.php,
 * The pre-existing issues listed in this file won't be emitted.
 *
 * This file can be updated by invoking Phan with --save-baseline=path/to/baseline.php
 * (can be combined with --load-baseline)
 */
return [
    // # Issue statistics:
    // PhanUndeclaredMethod : 10+ occurrences
    // PhanUndeclaredClassReference : 3 occurrences
    // PhanUndeclaredClassMethod : 2 occurrences
    // PhanUndeclaredClassConstant : 1 occurrence

    // These are WooCommerce runtime symbols that this TEMPORARY sync-module port (WOOA7S-1550)
    // references but Phan cannot resolve from the bundled WooCommerce stubs: methods that
    // WooCommerce Analytics mixes onto WC_Order/WC_Order_Item via runtime trait/subclass overrides
    // (e.g. get_report_customer_id, is_returning_customer, get_item_shipping_amount, get_taxes),
    // and internal classes absent from the stubs (FulfillmentUtils, FeaturesController,
    // OrderInternalStatus). All are guarded behind a WooCommerce-active check at runtime.
    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/Sync/class-woocommerce-analytics-module.php' => ['PhanUndeclaredClassConstant', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassReference', 'PhanUndeclaredMethod'],
        'src/Sync/trait-utilities.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredClassReference'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
