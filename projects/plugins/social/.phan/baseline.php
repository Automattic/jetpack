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
    // PhanUndeclaredProperty : 20+ occurrences
    // PhanTypeMismatchArgument : 4 occurrences
    // PhanUndeclaredTypeParameter : 3 occurrences
    // PhanCoalescingNeverNull : 2 occurrences
    // PhanMisspelledAnnotation : 2 occurrences
    // PhanUndeclaredClassMethod : 2 occurrences
    // PhanDeprecatedFunction : 1 occurrence
    // PhanNoopNew : 1 occurrence
    // PhanRedundantCondition : 1 occurrence
    // PhanTypeMismatchReturnProbablyReal : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        '/usr/local/src/automattic/jetpack/.phan/config.base.php' => ['PhanCoalescingNeverNull', 'PhanRedundantCondition'],
        'jetpack-social.php' => ['PhanNoopNew'],
        'src/class-jetpack-social.php' => ['PhanMisspelledAnnotation', 'PhanTypeMismatchArgument', 'PhanTypeMismatchReturnProbablyReal'],
        'src/class-meta-tags.php' => ['PhanUndeclaredTypeParameter'],
        'src/class-note.php' => ['PhanTypeMismatchArgument'],
        'src/class-rest-social-note-controller.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredTypeParameter'],
        'tests/php/test-class-jetpack-social.php' => ['PhanDeprecatedFunction', 'PhanUndeclaredProperty'],
        'tests/php/test-class-meta-tags.php' => ['PhanUndeclaredProperty'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
