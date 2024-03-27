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
    // PhanUndeclaredTypeParameter : 8 occurrences
    // PhanTypeMismatchReturn : 5 occurrences
    // PhanUndeclaredClassMethod : 5 occurrences
    // PhanNoopNew : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'plugins/e2e-beta-autoupdate-api.php' => ['PhanNoopNew', 'PhanUndeclaredClassMethod'],
        'plugins/e2e-plan-data-interceptor.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredTypeParameter'],
        'plugins/e2e-plugin-updater.php' => ['PhanTypeMismatchReturn'],
        'plugins/e2e-search-test-helper.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredTypeParameter'],
        'plugins/e2e-waf-data-interceptor.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredTypeParameter'],
        'plugins/e2e-wpcom-request-interceptor.php' => ['PhanUndeclaredTypeParameter'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
