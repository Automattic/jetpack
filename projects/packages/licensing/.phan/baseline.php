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
    // PhanTypeMismatchArgumentProbablyReal : 3 occurrences
    // PhanTypeMismatchArgument : 2 occurrences
    // PhanTypeMismatchReturnProbablyReal : 2 occurrences
    // PhanTypeMismatchPropertyDefault : 1 occurrence
    // PhanTypeSuspiciousNonTraversableForeach : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-endpoints.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchReturnProbablyReal'],
        'src/class-licensing.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchPropertyDefault', 'PhanTypeSuspiciousNonTraversableForeach'],
        'tests/php/class-test-licensing.php' => ['PhanTypeMismatchArgumentProbablyReal', 'PhanUndeclaredMethod'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
