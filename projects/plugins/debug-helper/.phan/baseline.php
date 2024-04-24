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
    // PhanUndeclaredClassMethod : 60+ occurrences
    // PhanNoopNew : 15+ occurrences
    // PhanPluginSimplifyExpressionBool : 9 occurrences
    // PhanPluginDuplicateConditionalNullCoalescing : 4 occurrences
    // PhanUndeclaredClassConstant : 4 occurrences
    // PhanUndeclaredClassStaticProperty : 4 occurrences
    // PhanTypeMismatchArgument : 3 occurrences
    // PhanUndeclaredConstantOfClass : 3 occurrences
    // PhanUndeclaredMethod : 3 occurrences
    // PhanTypeMismatchReturnProbablyReal : 2 occurrences
    // PhanUndeclaredClass : 2 occurrences
    // PhanUndeclaredProperty : 2 occurrences
    // PhanEmptyForeach : 1 occurrence
    // PhanNonClassMethodCall : 1 occurrence
    // PhanParamTooMany : 1 occurrence
    // PhanSuspiciousValueComparison : 1 occurrence
    // PhanTypeConversionFromArray : 1 occurrence
    // PhanTypePossiblyInvalidDimOffset : 1 occurrence
    // PhanUndeclaredFunction : 1 occurrence
    // PhanUndeclaredTypeProperty : 1 occurrence
    // PhanUndeclaredTypeReturnType : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'class-admin.php' => ['PhanNoopNew'],
        'modules/class-autoloader-debug-helper.php' => ['PhanEmptyForeach', 'PhanNoopNew', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanUndeclaredClassMethod', 'PhanUndeclaredConstantOfClass', 'PhanUndeclaredMethod', 'PhanUndeclaredTypeReturnType'],
        'modules/class-broken-token.php' => ['PhanNoopNew', 'PhanUndeclaredClassMethod'],
        'modules/class-cookie-state.php' => ['PhanNoopNew', 'PhanUndeclaredClassMethod'],
        'modules/class-idc-simulator.php' => ['PhanNoopNew', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanPluginSimplifyExpressionBool', 'PhanUndeclaredClassMethod'],
        'modules/class-jetpack-sync-debug-helper.php' => ['PhanNonClassMethodCall'],
        'modules/class-mocker.php' => ['PhanNoopNew'],
        'modules/class-modules-helper.php' => ['PhanNoopNew', 'PhanUndeclaredClassMethod'],
        'modules/class-protect-helper.php' => ['PhanNoopNew', 'PhanPluginSimplifyExpressionBool', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassStaticProperty', 'PhanUndeclaredProperty'],
        'modules/class-rest-api-tester.php' => ['PhanNoopNew'],
        'modules/class-scan-helper.php' => ['PhanNoopNew', 'PhanParamTooMany', 'PhanSuspiciousValueComparison', 'PhanTypeConversionFromArray', 'PhanTypeMismatchReturnProbablyReal'],
        'modules/class-sync-data-settings-tester.php' => ['PhanNoopNew', 'PhanTypePossiblyInvalidDimOffset', 'PhanUndeclaredClass'],
        'modules/class-waf-helper.php' => ['PhanNoopNew', 'PhanPluginSimplifyExpressionBool', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredClassConstant', 'PhanUndeclaredClassMethod'],
        'modules/class-wpcom-api-request-tracker-module.php' => ['PhanNoopNew', 'PhanTypeMismatchArgument'],
        'modules/class-xmlrpc-logger.php' => ['PhanNoopNew', 'PhanUndeclaredFunction'],
        'modules/inc/class-broken-token-connection-errors.php' => ['PhanTypeMismatchArgument', 'PhanUndeclaredClassMethod', 'PhanUndeclaredTypeProperty'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
