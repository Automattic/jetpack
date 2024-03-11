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
    // PhanCoalescingNeverNull : 2 occurrences
    // PhanTypeMismatchArgument : 2 occurrences
    // PhanParamTooMany : 1 occurrence
    // PhanRedefinedUsedTrait : 1 occurrence
    // PhanRedundantCondition : 1 occurrence
    // PhanTypeMismatchPropertyProbablyReal : 1 occurrence
    // PhanUndeclaredFunction : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        '/usr/local/src/automattic/jetpack/.phan/config.base.php' => ['PhanCoalescingNeverNull', 'PhanRedundantCondition'],
        'src/lazy-images.php' => ['PhanTypeMismatchPropertyProbablyReal', 'PhanUndeclaredFunction'],
        'tests/php/test_class.lazy-images.php' => ['PhanParamTooMany', 'PhanRedefinedUsedTrait', 'PhanTypeMismatchArgument'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
