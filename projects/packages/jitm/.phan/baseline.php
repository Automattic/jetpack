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
    // PhanTypeExpectedObjectPropAccess : 3 occurrences
    // PhanTypeMismatchReturn : 2 occurrences
    // PhanUndeclaredMethod : 2 occurrences
    // PhanPluginSimplifyExpressionBool : 1 occurrence
    // PhanTypeInvalidDimOffset : 1 occurrence
    // PhanTypeMismatchArgument : 1 occurrence
    // PhanTypeMismatchArgumentProbablyReal : 1 occurrence
    // PhanUnreferencedUseNormal : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-post-connection-jitm.php' => ['PhanTypeExpectedObjectPropAccess', 'PhanTypeMismatchArgument', 'PhanTypeMismatchReturn'],
        'src/class-rest-api-endpoints.php' => ['PhanPluginSimplifyExpressionBool'],
        'tests/php/test_JITM.php' => ['PhanTypeMismatchArgumentProbablyReal', 'PhanUnreferencedUseNormal'],
        'tests/php/test_pre_connection_jitm.php' => ['PhanTypeInvalidDimOffset', 'PhanUndeclaredMethod'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
