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
    // PhanUndeclaredProperty : 40+ occurrences
    // PhanTypeArraySuspiciousNullable : 2 occurrences
    // PhanCompatibleAccessMethodOnTraitDefinition : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/pluggable.php' => ['PhanTypeArraySuspiciousNullable'],
        'tests/php/class-scheduled-updates-test.php' => ['PhanCompatibleAccessMethodOnTraitDefinition', 'PhanUndeclaredProperty'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
