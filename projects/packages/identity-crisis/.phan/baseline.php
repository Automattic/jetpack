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
    // PhanTypeMismatchArgument : 5 occurrences
    // PhanNoopNew : 1 occurrence
    // PhanParamTooMany : 1 occurrence
    // PhanPluginRedundantAssignment : 1 occurrence
    // PhanRedundantCondition : 1 occurrence
    // PhanTypeMismatchArgumentInternal : 1 occurrence
    // PhanTypeMismatchArgumentProbablyReal : 1 occurrence
    // PhanTypeMismatchProperty : 1 occurrence
    // PhanTypeMismatchReturnNullable : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-identity-crisis.php' => ['PhanPluginRedundantAssignment', 'PhanRedundantCondition'],
        'src/class-rest-endpoints.php' => ['PhanTypeMismatchArgumentProbablyReal'],
        'src/class-url-secret.php' => ['PhanTypeMismatchProperty', 'PhanTypeMismatchReturnNullable'],
        'tests/php/test-identity-crisis.php' => ['PhanParamTooMany', 'PhanTypeMismatchArgument'],
        'tests/php/test-rest-endpoints.php' => ['PhanNoopNew'],
        'tests/php/test-url-secret.php' => ['PhanTypeMismatchArgumentInternal'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
