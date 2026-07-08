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
    // PhanUndeclaredClassMethod : 65+ occurrences
    // PhanUndeclaredClassStaticProperty : 4 occurrences
    // PhanUndeclaredClassConstant : 3 occurrences
    // PhanUndeclaredConstantOfClass : 3 occurrences
    // PhanUndeclaredMethod : 3 occurrences
    // PhanTypeMismatchArgument : 2 occurrences
    // PhanTypeMismatchReturnProbablyReal : 2 occurrences
    // PhanUndeclaredClass : 2 occurrences
    // PhanEmptyForeach : 1 occurrence
    // PhanNonClassMethodCall : 1 occurrence
    // PhanSuspiciousValueComparison : 1 occurrence
    // PhanTypeConversionFromArray : 1 occurrence
    // PhanTypePossiblyInvalidDimOffset : 1 occurrence
    // PhanUndeclaredFunction : 1 occurrence
    // PhanUndeclaredTypeProperty : 1 occurrence
    // PhanUndeclaredTypeReturnType : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'modules/class-autoloader-debug-helper.php' => ['PhanEmptyForeach', 'PhanUndeclaredClassMethod', 'PhanUndeclaredConstantOfClass', 'PhanUndeclaredMethod', 'PhanUndeclaredTypeReturnType'],
        'modules/class-broken-token.php' => ['PhanUndeclaredClassMethod'],
        'modules/class-cookie-state.php' => ['PhanUndeclaredClassMethod'],
        'modules/class-idc-simulator.php' => ['PhanUndeclaredClassMethod'],
        'modules/class-jetpack-sync-debug-helper.php' => ['PhanNonClassMethodCall'],
        'modules/class-modules-helper.php' => ['PhanUndeclaredClassMethod'],
        'modules/class-protect-helper.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredClassStaticProperty'],
        'modules/class-scan-helper.php' => ['PhanSuspiciousValueComparison', 'PhanTypeConversionFromArray', 'PhanTypeMismatchReturnProbablyReal'],
        'modules/class-sync-data-settings-tester.php' => ['PhanTypePossiblyInvalidDimOffset', 'PhanUndeclaredClass'],
        'modules/class-waf-helper.php' => ['PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredClassConstant', 'PhanUndeclaredClassMethod'],
        'modules/class-wpcom-api-request-faker-module.php' => ['PhanUndeclaredClassMethod'],
        'modules/class-wpcom-api-request-tracker-module.php' => ['PhanTypeMismatchArgument'],
        'modules/class-xmlrpc-logger.php' => ['PhanUndeclaredFunction'],
        'modules/inc/class-broken-token-connection-errors.php' => ['PhanTypeMismatchArgument', 'PhanUndeclaredClassMethod', 'PhanUndeclaredTypeProperty'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
