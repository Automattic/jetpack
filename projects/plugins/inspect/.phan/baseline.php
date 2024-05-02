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
    // PhanParamTooMany : 3 occurrences
    // PhanTypeMismatchArgumentInternal : 2 occurrences
    // PhanAccessMethodInternal : 1 occurrence
    // PhanTypeMismatchReturn : 1 occurrence
    // PhanUndeclaredInvokeInCallable : 1 occurrence
    // PhanUndeclaredMethodInCallable : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'app/Monitor.php' => ['PhanUndeclaredMethodInCallable'],
        'app/Options/Monitor_Status.php' => ['PhanTypeMismatchReturn'],
        'app/Options/Observer_Settings.php' => ['PhanTypeMismatchArgumentInternal'],
        'app/REST_API/Endpoints/Send_Request.php' => ['PhanTypeMismatchArgumentInternal', 'PhanUndeclaredInvokeInCallable'],
        'app/REST_API/Permissions/Nonce.php' => ['PhanParamTooMany'],
        'functions.php' => ['PhanAccessMethodInternal'],
        'packages/Async_Option/Async_Option.php' => ['PhanParamTooMany'],
        'packages/Async_Option/Endpoint.php' => ['PhanParamTooMany'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
