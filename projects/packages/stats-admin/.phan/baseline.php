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
    // PhanTypeMismatchReturn : 8 occurrences
    // PhanTypeMismatchArgumentProbablyReal : 7 occurrences
    // PhanPluginDuplicateConditionalNullCoalescing : 4 occurrences
    // PhanTypeMismatchReturnProbablyReal : 2 occurrences
    // PhanTypeMismatchReturnNullable : 1 occurrence
    // PhanUndeclaredStaticProperty : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-notices.php' => ['PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchReturn'],
        'src/class-rest-controller.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnNullable', 'PhanTypeMismatchReturnProbablyReal'],
        'src/class-wpcom-client.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchReturnProbablyReal'],
        'tests/php/test-stats-dashboard.php' => ['PhanUndeclaredStaticProperty'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
