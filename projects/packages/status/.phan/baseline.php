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
    // PhanTypeMismatchArgumentInternal : 4 occurrences
    // PhanTypeMismatchArgumentNullableInternal : 3 occurrences
    // PhanPluginDuplicateConditionalNullCoalescing : 2 occurrences
    // PhanPluginSimplifyExpressionBool : 2 occurrences
    // PhanRedefineFunction : 2 occurrences
    // PhanDeprecatedFunction : 1 occurrence
    // PhanParamTooMany : 1 occurrence
    // PhanPluginRedundantAssignment : 1 occurrence
    // PhanRedundantCondition : 1 occurrence
    // PhanTypeArraySuspicious : 1 occurrence
    // PhanTypeMismatchArgument : 1 occurrence
    // PhanTypeMismatchArgumentNullable : 1 occurrence
    // PhanTypeMismatchArgumentProbablyReal : 1 occurrence
    // PhanTypeMismatchReturnProbablyReal : 1 occurrence
    // PhanUndeclaredFunction : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-cookiestate.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanPluginRedundantAssignment', 'PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchArgumentNullableInternal'],
        'src/class-errors.php' => ['PhanTypeMismatchArgumentInternal'],
        'src/class-host.php' => ['PhanTypeMismatchArgumentNullable'],
        'src/class-modules.php' => ['PhanPluginSimplifyExpressionBool', 'PhanTypeArraySuspicious', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal'],
        'src/class-status.php' => ['PhanRedundantCondition', 'PhanUndeclaredFunction'],
        'tests/php/bootstrap.php' => ['PhanRedefineFunction', 'PhanTypeMismatchReturnProbablyReal'],
        'tests/php/test-host.php' => ['PhanParamTooMany'],
        'tests/php/test-status.php' => ['PhanDeprecatedFunction', 'PhanTypeMismatchArgumentInternal'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
