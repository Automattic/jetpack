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
    // PhanUndeclaredConstant : 45+ occurrences
    // PhanTypeMismatchPropertyDefault : 15+ occurrences
    // PhanParamTooMany : 10+ occurrences
    // PhanTypeMismatchArgumentProbablyReal : 10+ occurrences
    // PhanTypeMismatchReturnProbablyReal : 10+ occurrences
    // PhanAbstractStaticMethodCallInStatic : 8 occurrences
    // PhanUndeclaredClassMethod : 8 occurrences
    // PhanTypeMismatchReturn : 7 occurrences
    // PhanNoopNew : 6 occurrences
    // PhanUndeclaredStaticProperty : 6 occurrences
    // PhanPluginDuplicateConditionalNullCoalescing : 5 occurrences
    // PhanTypeMismatchArgument : 4 occurrences
    // PhanUndeclaredTypeParameter : 4 occurrences
    // PhanUndeclaredTypeReturnType : 4 occurrences
    // PhanUnextractableAnnotation : 4 occurrences
    // PhanTypeArraySuspicious : 3 occurrences
    // PhanTypeMismatchReturnNullable : 3 occurrences
    // PhanImpossibleCondition : 2 occurrences
    // PhanNonClassMethodCall : 2 occurrences
    // PhanPluginMixedKeyNoKey : 1 occurrence
    // PhanRedundantCondition : 1 occurrence
    // PhanTypeMismatchArgumentInternal : 1 occurrence
    // PhanTypeMismatchArgumentNullableInternal : 1 occurrence
    // PhanUndeclaredClassProperty : 1 occurrence
    // PhanUndeclaredClassStaticProperty : 1 occurrence
    // PhanUndeclaredFunction : 1 occurrence
    // PhanUndeclaredTypeProperty : 1 occurrence
    // PhanUnextractableAnnotationSuffix : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-activitylog.php' => ['PhanTypeMismatchArgumentProbablyReal'],
        'src/class-initializer.php' => ['PhanImpossibleCondition', 'PhanNoopNew', 'PhanParamTooMany', 'PhanRedundantCondition', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnNullable', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassProperty', 'PhanUndeclaredConstant', 'PhanUndeclaredTypeProperty', 'PhanUndeclaredTypeReturnType'],
        'src/class-jetpack-manage.php' => ['PhanTypeMismatchArgumentProbablyReal', 'PhanUndeclaredConstant'],
        'src/class-products.php' => ['PhanNonClassMethodCall'],
        'src/class-rest-product-data.php' => ['PhanParamTooMany', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchReturn'],
        'src/class-rest-products.php' => ['PhanParamTooMany', 'PhanPluginMixedKeyNoKey', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal'],
        'src/class-rest-purchases.php' => ['PhanParamTooMany', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredTypeReturnType'],
        'src/class-rest-zendesk-chat.php' => ['PhanParamTooMany', 'PhanTypeMismatchArgumentProbablyReal', 'PhanUndeclaredConstant', 'PhanUndeclaredFunction', 'PhanUnextractableAnnotationSuffix'],
        'src/class-wpcom-products.php' => ['PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredConstant', 'PhanUnextractableAnnotation'],
        'src/products/class-anti-spam.php' => ['PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchPropertyDefault'],
        'src/products/class-backup.php' => ['PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchPropertyDefault'],
        'src/products/class-boost.php' => ['PhanTypeMismatchPropertyDefault', 'PhanUndeclaredTypeParameter'],
        'src/products/class-creator.php' => ['PhanTypeMismatchPropertyDefault', 'PhanTypeMismatchReturnProbablyReal'],
        'src/products/class-crm.php' => ['PhanTypeMismatchPropertyDefault'],
        'src/products/class-extras.php' => ['PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchPropertyDefault', 'PhanUndeclaredTypeReturnType'],
        'src/products/class-hybrid-product.php' => ['PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchReturnNullable', 'PhanUndeclaredStaticProperty'],
        'src/products/class-jetpack-ai.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredClassMethod'],
        'src/products/class-module-product.php' => ['PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredClassMethod'],
        'src/products/class-product.php' => ['PhanAbstractStaticMethodCallInStatic', 'PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchPropertyDefault'],
        'src/products/class-protect.php' => ['PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchPropertyDefault'],
        'src/products/class-scan.php' => ['PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchArgumentProbablyReal'],
        'src/products/class-search-stats.php' => ['PhanTypeMismatchArgumentProbablyReal', 'PhanUndeclaredConstant'],
        'src/products/class-search.php' => ['PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchPropertyDefault', 'PhanTypeMismatchReturnNullable', 'PhanUndeclaredClassMethod'],
        'src/products/class-security.php' => ['PhanTypeMismatchArgumentNullable'],
        'src/products/class-social.php' => ['PhanTypeMismatchPropertyDefault'],
        'src/products/class-starter.php' => ['PhanTypeMismatchArgumentNullable'],
        'src/products/class-stats.php' => ['PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchArgumentNullableInternal'],
        'src/products/class-videopress.php' => ['PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchPropertyDefault'],
        'tests/php/test-backup-product.php' => ['PhanTypeMismatchArgumentNullable', 'PhanUndeclaredConstant'],
        'tests/php/test-hybrid-product.php' => ['PhanTypeMismatchArgumentNullable', 'PhanUndeclaredConstant'],
        'tests/php/test-module-product.php' => ['PhanUndeclaredClassStaticProperty', 'PhanUndeclaredConstant'],
        'tests/php/test-product-multiple-filenames.php' => ['PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchPropertyDefault', 'PhanUndeclaredConstant'],
        'tests/php/test-products-rest.php' => ['PhanUndeclaredConstant'],
        'tests/php/test-products.php' => ['PhanNonClassMethodCall', 'PhanTypeArraySuspicious', 'PhanUndeclaredTypeParameter'],
        'tests/php/test-search-product.php' => ['PhanTypeMismatchArgumentNullable', 'PhanUndeclaredConstant'],
        'tests/php/test-social-product.php' => ['PhanTypeMismatchArgumentNullable', 'PhanUndeclaredConstant'],
        'tests/php/test-videopress-product.php' => ['PhanTypeMismatchArgumentNullable', 'PhanUndeclaredConstant'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
