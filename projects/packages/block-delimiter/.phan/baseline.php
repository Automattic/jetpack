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
    // PhanPossiblyUndeclaredVariable : 20+ occurrences
    // PhanPossiblyNullTypeMismatchProperty : 10+ occurrences
    // PhanRedefinedClassReference : 9 occurrences
    // PhanTypeMismatchArgumentInternalProbablyReal : 2 occurrences
    // PhanRedefineClass : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-block-delimiter.php' => ['PhanPossiblyNullTypeMismatchProperty', 'PhanPossiblyUndeclaredVariable', 'PhanTypeMismatchArgumentInternalProbablyReal'],
        'src/class-block-scanner.php' => ['PhanPossiblyNullTypeMismatchProperty', 'PhanPossiblyUndeclaredVariable', 'PhanRedefinedClassReference', 'PhanTypeMismatchArgumentInternalProbablyReal'],
        'tests/php/Block_Scanner_Test.php' => ['PhanRedefinedClassReference'],
        'tests/stubs/class-wp-html-span.php' => ['PhanRedefineClass'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
