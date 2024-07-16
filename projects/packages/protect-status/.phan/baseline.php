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
    // PhanParamTooMany : 6 occurrences
    // PhanTypeMismatchArgument : 5 occurrences
    // PhanTypeMismatchProperty : 2 occurrences
    // PhanTypeMismatchReturnProbablyReal : 2 occurrences
    // PhanNoopNew : 1 occurrence
    // PhanPluginSimplifyExpressionBool : 1 occurrence
    // PhanRedundantCondition : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-plan.php' => ['PhanTypeMismatchReturnProbablyReal'],
        'src/class-protect-status.php' => ['PhanPluginDuplicateConditionalNullCoalescing'],
        'src/class-rest-controller.php' => ['PhanParamTooMany'],
        'src/class-scan-status.php' => ['PhanParamTooMany', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanRedundantCondition', 'PhanTypeMismatchArgument', 'PhanTypeMismatchProperty'],
        'src/class-status.php' => ['PhanPluginSimplifyExpressionBool', 'PhanTypeMismatchArgument'],
        'tests/php/test-scan-status.php' => ['PhanTypeMismatchArgument'],
        'tests/php/test-status.php' => ['PhanTypeMismatchArgument'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
