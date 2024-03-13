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
    // PhanUndeclaredProperty : 25+ occurrences
    // PhanUndeclaredConstant : 6 occurrences
    // PhanPluginMixedKeyNoKey : 2 occurrences
    // PhanRedundantCondition : 2 occurrences
    // PhanTypeArraySuspiciousNullable : 2 occurrences
    // PhanUndeclaredClassMethod : 2 occurrences
    // PhanCompatibleAccessMethodOnTraitDefinition : 1 occurrence
    // PhanNoopNew : 1 occurrence
    // PhanTypeArraySuspicious : 1 occurrence
    // PhanTypeMismatchArgumentProbablyReal : 1 occurrence
    // PhanTypeMismatchDimFetch : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-scheduled-updates.php' => ['PhanRedundantCondition', 'PhanTypeArraySuspicious', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchDimFetch', 'PhanUndeclaredClassMethod', 'PhanUndeclaredConstant'],
        'src/pluggable.php' => ['PhanTypeArraySuspiciousNullable'],
        'src/wpcom-endpoints/class-wpcom-rest-api-v2-endpoint-update-schedules.php' => ['PhanPluginMixedKeyNoKey'],
        'tests/php/class-scheduled-updates-test.php' => ['PhanCompatibleAccessMethodOnTraitDefinition', 'PhanUndeclaredConstant', 'PhanUndeclaredProperty'],
        'tests/php/class-wpcom-rest-api-v2-endpoint-update-schedules-test.php' => ['PhanNoopNew', 'PhanUndeclaredConstant'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
