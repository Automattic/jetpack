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
    // PhanUndeclaredTypeParameter : 25+ occurrences
    // PhanUndeclaredFunction : 8 occurrences
    // PhanUndeclaredClassMethod : 7 occurrences
    // PhanTypeArraySuspicious : 5 occurrences
    // PhanUndeclaredClassProperty : 4 occurrences
    // PhanTypeMismatchArgument : 3 occurrences
    // PhanUndeclaredConstant : 3 occurrences
    // PhanTypeArrayUnsetSuspicious : 2 occurrences
    // PhanTypeMismatchArgumentProbablyReal : 2 occurrences
    // PhanParamTooMany : 1 occurrence
    // PhanTypeMismatchReturn : 1 occurrence
    // PhanTypeMismatchReturnProbablyReal : 1 occurrence
    // PhanUndeclaredClassInstanceof : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-blaze.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanUndeclaredClassProperty', 'PhanUndeclaredConstant', 'PhanUndeclaredFunction', 'PhanUndeclaredTypeParameter'],
        'src/class-dashboard-rest-controller.php' => ['PhanTypeArraySuspicious', 'PhanTypeArrayUnsetSuspicious', 'PhanTypeMismatchArgument', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredClassInstanceof', 'PhanUndeclaredClassMethod', 'PhanUndeclaredConstant', 'PhanUndeclaredFunction', 'PhanUndeclaredTypeParameter'],
        'src/class-dashboard.php' => ['PhanUndeclaredConstant'],
        'src/class-rest-controller.php' => ['PhanParamTooMany'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
