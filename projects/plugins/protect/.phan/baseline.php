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
    // PhanParamTooMany : 2 occurrences
    // PhanNoopNew : 1 occurrence
    // PhanPluginDuplicateConditionalNullCoalescing : 1 occurrence
    // PhanTypeMismatchReturnProbablyReal : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'jetpack-protect.php' => ['PhanNoopNew'],
        'src/class-credentials.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchReturnProbablyReal'],
        'src/class-rest-controller.php' => ['PhanParamTooMany'],
        'src/class-threats.php' => ['PhanParamTooMany'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
