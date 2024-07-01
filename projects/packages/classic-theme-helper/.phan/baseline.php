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
    // PhanTypeMismatchArgumentInternal : 10+ occurrences
    // PhanUndeclaredClassMethod : 5 occurrences
    // PhanTypeInvalidDimOffset : 2 occurrences
    // PhanTypeMismatchArgument : 2 occurrences
    // PhanNonClassMethodCall : 1 occurrence
    // PhanTypeComparisonToArray : 1 occurrence
    // PhanTypeMismatchArgumentProbablyReal : 1 occurrence
    // PhanTypeMismatchProperty : 1 occurrence
    // PhanTypeMismatchPropertyProbablyReal : 1 occurrence
    // PhanTypePossiblyInvalidDimOffset : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        '_inc/lib/tonesque.php' => ['PhanNonClassMethodCall', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchPropertyProbablyReal', 'PhanUndeclaredClassMethod'],
        'src/class-featured-content.php' => ['PhanTypeComparisonToArray', 'PhanTypeInvalidDimOffset', 'PhanTypeMismatchArgument', 'PhanTypeMismatchProperty', 'PhanTypePossiblyInvalidDimOffset'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
