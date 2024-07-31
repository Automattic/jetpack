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
    // PhanNonClassMethodCall : 10+ occurrences
    // PhanParamTooFew : 5 occurrences
    // PhanTypeMismatchArgumentProbablyReal : 2 occurrences
    // PhanImpossibleCondition : 1 occurrence
    // PhanImpossibleTypeComparison : 1 occurrence
    // PhanParamTooMany : 1 occurrence
    // PhanRedundantCondition : 1 occurrence
    // PhanTypeMismatchArgumentNullable : 1 occurrence
    // PhanTypeMismatchReturn : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-schema.php' => ['PhanParamTooMany'],
        'src/class-utils.php' => ['PhanImpossibleCondition', 'PhanRedundantCondition'],
        'src/types/class-type-assoc-array.php' => ['PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchReturn'],
        'src/types/class-type-string.php' => ['PhanImpossibleTypeComparison'],
        'tests/php/integration/test-integration-fallback-values.php' => ['PhanNonClassMethodCall'],
        'tests/php/integration/test-integration-parsing-errors.php' => ['PhanNonClassMethodCall', 'PhanParamTooFew'],
        'tests/php/type/test-type-assoc-array.php' => ['PhanTypeMismatchArgumentProbablyReal'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
