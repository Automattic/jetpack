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
    // PhanParamTooMany : 7 occurrences
    // PhanTypeVoidAssignment : 4 occurrences
    // PhanPluginDuplicateConditionalNullCoalescing : 2 occurrences
    // PhanDeprecatedFunction : 1 occurrence
    // PhanTypeMismatchReturn : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-tracking-pixel.php' => ['PhanPluginDuplicateConditionalNullCoalescing'],
        'src/class-wpcom-stats.php' => ['PhanTypeMismatchReturn'],
        'tests/php/test-main.php' => ['PhanParamTooMany', 'PhanTypeVoidAssignment'],
        'tests/php/test-options.php' => ['PhanTypeVoidAssignment'],
        'tests/php/test-wpcom-stats.php' => ['PhanDeprecatedFunction'],
        'tests/php/test-xmlrpc-provider.php' => ['PhanParamTooMany', 'PhanTypeVoidAssignment'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
