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
    // PhanTypeMismatchArgumentProbablyReal : 15+ occurrences
    // PhanTypeMismatchArgumentInternal : 3 occurrences
    // PhanTypeMismatchForeach : 2 occurrences

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-helper-script-manager-impl.php' => ['PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchForeach'],
        'tests/php/test-class-throw-on-errors.php' => ['PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchArgumentProbablyReal'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
