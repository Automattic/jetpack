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
    // PhanUndeclaredClassProperty : 7 occurrences
    // PhanTypeMismatchArgument : 2 occurrences
    // PhanUndeclaredClassMethod : 2 occurrences
    // PhanRedefinedUsedTrait : 1 occurrence
    // PhanTypeMismatchArgumentNullableInternal : 1 occurrence
    // PhanUndeclaredClassInCallable : 1 occurrence
    // PhanUndeclaredClassReference : 1 occurrence
    // PhanUndeclaredFunction : 1 occurrence
    // PhanUndeclaredTypeReturnType : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-blocks.php' => ['PhanTypeMismatchArgumentNullableInternal', 'PhanUndeclaredClassInCallable', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassReference', 'PhanUndeclaredFunction', 'PhanUndeclaredTypeReturnType'],
        'tests/php/test-blocks.php' => ['PhanRedefinedUsedTrait', 'PhanTypeMismatchArgument', 'PhanUndeclaredClassProperty'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
