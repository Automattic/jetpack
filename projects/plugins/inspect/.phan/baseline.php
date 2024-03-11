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
    // PhanUndeclaredClassMethod : 5 occurrences
    // PhanParamTooMany : 3 occurrences
    // PhanCoalescingNeverNull : 2 occurrences
    // PhanCommentParamWithoutRealParam : 2 occurrences
    // PhanUndeclaredConstant : 2 occurrences
    // PhanUndeclaredProperty : 2 occurrences
    // PhanUndeclaredTypeParameter : 2 occurrences
    // PhanAccessMethodInternal : 1 occurrence
    // PhanImpossibleCondition : 1 occurrence
    // PhanRedundantCondition : 1 occurrence
    // PhanTypeMismatchReturn : 1 occurrence
    // PhanUndeclaredInvokeInCallable : 1 occurrence
    // PhanUndeclaredMethodInCallable : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        '/usr/local/src/automattic/jetpack/.phan/config.base.php' => ['PhanCoalescingNeverNull', 'PhanRedundantCondition'],
        'app/Monitor.php' => ['PhanUndeclaredMethodInCallable'],
        'app/Options/Monitor_Status.php' => ['PhanTypeMismatchReturn'],
        'app/Options/Observer_Settings.php' => ['PhanUndeclaredConstant'],
        'app/REST_API/Endpoints/Send_Request.php' => ['PhanImpossibleCondition', 'PhanUndeclaredClassMethod', 'PhanUndeclaredConstant', 'PhanUndeclaredInvokeInCallable', 'PhanUndeclaredTypeParameter'],
        'app/REST_API/Permissions/Nonce.php' => ['PhanParamTooMany'],
        'functions.php' => ['PhanAccessMethodInternal'],
        'packages/Async_Option/Async_Option.php' => ['PhanParamTooMany'],
        'packages/Async_Option/Endpoint.php' => ['PhanParamTooMany'],
        'packages/Async_Option/Registry.php' => ['PhanCommentParamWithoutRealParam'],
        'packages/Async_Option/Storage/WP_Option.php' => ['PhanUndeclaredProperty'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
