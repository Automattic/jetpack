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
    // PhanTypeMismatchArgumentNullable : 60+ occurrences
    // PhanTypeMismatchPropertyDefault : 15+ occurrences
    // PhanParamTooMany : 10+ occurrences
    // PhanTypeMismatchReturnProbablyReal : 10+ occurrences
    // PhanAbstractStaticMethodCallInStatic : 8 occurrences
    // PhanNoopNew : 6 occurrences
    // PhanTypeMismatchReturn : 6 occurrences
    // PhanPluginDuplicateConditionalNullCoalescing : 5 occurrences
    // PhanTypeMismatchReturnNullable : 3 occurrences
    // PhanImpossibleCondition : 2 occurrences
    // PhanNonClassMethodCall : 2 occurrences
    // PhanTypeMismatchArgumentProbablyReal : 2 occurrences
    // PhanPluginMixedKeyNoKey : 1 occurrence
    // PhanRedundantCondition : 1 occurrence
    // PhanTypeMismatchArgumentInternal : 1 occurrence
    // PhanTypeMismatchArgumentNullableInternal : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-activitylog.php' => ['PhanTypeMismatchArgumentProbablyReal'],
        'src/class-initializer.php' => ['PhanImpossibleCondition', 'PhanNoopNew', 'PhanParamTooMany', 'PhanRedundantCondition', 'PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnNullable', 'PhanTypeMismatchReturnProbablyReal'],
        'src/class-jetpack-manage.php' => ['PhanTypeMismatchArgumentProbablyReal'],
        'src/class-products.php' => ['PhanNonClassMethodCall'],
        'src/class-rest-product-data.php' => ['PhanParamTooMany', 'PhanTypeMismatchReturn'],
        'src/class-rest-products.php' => ['PhanParamTooMany', 'PhanPluginMixedKeyNoKey', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal'],
        'src/class-rest-purchases.php' => ['PhanParamTooMany', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal'],
        'src/class-rest-zendesk-chat.php' => ['PhanParamTooMany'],
        'src/class-wpcom-products.php' => ['PhanTypeMismatchReturnProbablyReal'],
        'src/products/class-anti-spam.php' => ['PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchPropertyDefault'],
        'src/products/class-backup.php' => ['PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchPropertyDefault'],
        'src/products/class-boost.php' => ['PhanTypeMismatchPropertyDefault'],
        'src/products/class-creator.php' => ['PhanTypeMismatchPropertyDefault', 'PhanTypeMismatchReturnProbablyReal'],
        'src/products/class-crm.php' => ['PhanTypeMismatchPropertyDefault'],
        'src/products/class-extras.php' => ['PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchPropertyDefault'],
        'src/products/class-hybrid-product.php' => ['PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchReturnNullable'],
        'src/products/class-jetpack-ai.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal'],
        'src/products/class-module-product.php' => ['PhanTypeMismatchReturnProbablyReal'],
        'src/products/class-product.php' => ['PhanAbstractStaticMethodCallInStatic', 'PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchPropertyDefault'],
        'src/products/class-protect.php' => ['PhanTypeMismatchPropertyDefault'],
        'src/products/class-scan.php' => ['PhanTypeMismatchArgumentNullable'],
        'src/products/class-search.php' => ['PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchPropertyDefault', 'PhanTypeMismatchReturnNullable'],
        'src/products/class-security.php' => ['PhanTypeMismatchArgumentNullable'],
        'src/products/class-social.php' => ['PhanTypeMismatchPropertyDefault'],
        'src/products/class-starter.php' => ['PhanTypeMismatchArgumentNullable'],
        'src/products/class-stats.php' => ['PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchArgumentNullableInternal'],
        'src/products/class-videopress.php' => ['PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchPropertyDefault'],
        'tests/php/test-backup-product.php' => ['PhanTypeMismatchArgumentNullable'],
        'tests/php/test-hybrid-product.php' => ['PhanTypeMismatchArgumentNullable'],
        'tests/php/test-product-multiple-filenames.php' => ['PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchPropertyDefault'],
        'tests/php/test-products.php' => ['PhanNonClassMethodCall'],
        'tests/php/test-search-product.php' => ['PhanTypeMismatchArgumentNullable'],
        'tests/php/test-social-product.php' => ['PhanTypeMismatchArgumentNullable'],
        'tests/php/test-videopress-product.php' => ['PhanTypeMismatchArgumentNullable'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
