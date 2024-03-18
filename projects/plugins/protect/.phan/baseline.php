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
    // PhanPluginDuplicateConditionalNullCoalescing : 45+ occurrences
    // PhanTypeArraySuspicious : 8 occurrences
    // PhanParamTooMany : 6 occurrences
    // PhanTypeMismatchArgument : 5 occurrences
    // PhanTypeMismatchArgumentProbablyReal : 5 occurrences
    // PhanUndeclaredTypeParameter : 5 occurrences
    // PhanTypeMismatchProperty : 2 occurrences
    // PhanTypeMismatchReturnProbablyReal : 2 occurrences
    // PhanUndeclaredConstant : 2 occurrences
    // PhanNoopNew : 1 occurrence
    // PhanPluginSimplifyExpressionBool : 1 occurrence
    // PhanRedundantCondition : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'jetpack-protect.php' => ['PhanNoopNew'],
        'src/class-credentials.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchReturnProbablyReal'],
        'src/class-plan.php' => ['PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredConstant'],
        'src/class-protect-status.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchArgumentProbablyReal'],
        'src/class-rest-controller.php' => ['PhanParamTooMany', 'PhanTypeArraySuspicious', 'PhanUndeclaredTypeParameter'],
        'src/class-scan-status.php' => ['PhanParamTooMany', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanRedundantCondition', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchProperty'],
        'src/class-status.php' => ['PhanPluginSimplifyExpressionBool', 'PhanTypeMismatchArgument', 'PhanUndeclaredConstant'],
        'src/class-threats.php' => ['PhanParamTooMany', 'PhanTypeMismatchArgumentProbablyReal'],
        'tests/php/test-scan-status.php' => ['PhanTypeMismatchArgument'],
        'tests/php/test-status.php' => ['PhanTypeMismatchArgument'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
