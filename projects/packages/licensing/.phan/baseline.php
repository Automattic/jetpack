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
    // PhanTypeArraySuspicious : 7 occurrences
    // PhanUndeclaredTypeParameter : 7 occurrences
    // PhanUndeclaredClassMethod : 6 occurrences
    // PhanUndeclaredTypeReturnType : 4 occurrences
    // PhanTypeMismatchArgumentProbablyReal : 3 occurrences
    // PhanTypeMismatchArgument : 2 occurrences
    // PhanTypeMismatchReturnProbablyReal : 2 occurrences
    // PhanUndeclaredConstant : 2 occurrences
    // PhanTypeMismatchProperty : 1 occurrence
    // PhanTypeMismatchPropertyDefault : 1 occurrence
    // PhanTypeMismatchReturn : 1 occurrence
    // PhanTypeSuspiciousNonTraversableForeach : 1 occurrence
    // PhanUndeclaredClassProperty : 1 occurrence
    // PhanUndeclaredTypeProperty : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-endpoints.php' => ['PhanTypeArraySuspicious', 'PhanTypeMismatchArgument', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeReturnType'],
        'src/class-licensing.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchPropertyDefault', 'PhanTypeSuspiciousNonTraversableForeach'],
        'tests/php/bootstrap.php' => ['PhanUndeclaredConstant'],
        'tests/php/class-test-licensing-endpoints.php' => ['PhanTypeMismatchProperty', 'PhanTypeMismatchReturn', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassProperty', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeProperty', 'PhanUndeclaredTypeReturnType'],
        'tests/php/class-test-licensing.php' => ['PhanTypeMismatchArgumentProbablyReal', 'PhanUndeclaredMethod'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
