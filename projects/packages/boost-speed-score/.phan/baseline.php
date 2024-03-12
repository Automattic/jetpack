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
    // PhanTypeExpectedObjectPropAccess : 4 occurrences
    // PhanUndeclaredTypeParameter : 3 occurrences
    // PhanUndeclaredTypeProperty : 3 occurrences
    // PhanTypeMismatchArgumentNullable : 2 occurrences
    // PhanTypeMismatchProperty : 2 occurrences
    // PhanTypeMismatchReturnProbablyReal : 2 occurrences
    // PhanUndeclaredClassMethod : 2 occurrences
    // PhanRedefineFunction : 1 occurrence
    // PhanRedefinedExtendedClass : 1 occurrence
    // PhanTypeMismatchPropertyDefault : 1 occurrence
    // PhanTypeMismatchPropertyProbablyReal : 1 occurrence
    // PhanTypeMismatchReturnNullable : 1 occurrence
    // PhanUndeclaredConstant : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-jetpack-boost-modules.php' => ['PhanTypeMismatchPropertyDefault'],
        'src/class-speed-score-graph-history-request.php' => ['PhanTypeMismatchProperty', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeProperty'],
        'src/class-speed-score-history.php' => ['PhanUndeclaredConstant'],
        'src/class-speed-score-request.php' => ['PhanTypeMismatchProperty', 'PhanTypeMismatchPropertyProbablyReal', 'PhanTypeMismatchReturnProbablyReal'],
        'src/class-speed-score.php' => ['PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchReturnNullable', 'PhanUndeclaredClassMethod', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeProperty'],
        'tests/bootstrap.php' => ['PhanRedefineFunction', 'PhanTypeMismatchReturnProbablyReal'],
        'tests/php/class-base-test-case.php' => ['PhanRedefinedExtendedClass'],
        'tests/php/lib/test-class-speed-score-history.php' => ['PhanTypeExpectedObjectPropAccess'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
