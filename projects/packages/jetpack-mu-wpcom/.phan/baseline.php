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
    // PhanTypeMismatchArgument : 15+ occurrences
    // PhanTypeMismatchArgumentProbablyReal : 15+ occurrences
    // PhanPluginDuplicateConditionalNullCoalescing : 10+ occurrences
    // PhanNoopNew : 6 occurrences
    // PhanTypeMismatchReturn : 6 occurrences
    // PhanUndeclaredClassMethod : 6 occurrences
    // PhanTypeMismatchArgumentInternal : 4 occurrences
    // PhanTypeMismatchReturnProbablyReal : 4 occurrences
    // PhanTypePossiblyInvalidDimOffset : 3 occurrences
    // PhanEmptyFQSENInCallable : 2 occurrences
    // PhanTypeArraySuspicious : 2 occurrences
    // PhanTypeArraySuspiciousNullable : 2 occurrences
    // PhanTypeMismatchDefault : 2 occurrences
    // PhanTypeMissingReturn : 2 occurrences
    // PhanUndeclaredFunction : 2 occurrences
    // PhanImpossibleTypeComparison : 1 occurrence
    // PhanNonClassMethodCall : 1 occurrence
    // PhanNoopArrayAccess : 1 occurrence
    // PhanPluginSimplifyExpressionBool : 1 occurrence
    // PhanRedefineFunction : 1 occurrence
    // PhanRedundantCondition : 1 occurrence
    // PhanTypeComparisonToArray : 1 occurrence
    // PhanTypeMismatchDimFetch : 1 occurrence
    // PhanTypeMismatchReturnNullable : 1 occurrence
    // PhanTypeVoidArgument : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-jetpack-mu-wpcom.php' => ['PhanNoopNew'],
        'src/features/100-year-plan/enhanced-ownership.php' => ['PhanEmptyFQSENInCallable'],
        'src/features/100-year-plan/locked-mode.php' => ['PhanEmptyFQSENInCallable'],
        'src/features/admin-color-schemes/admin-color-schemes.php' => ['PhanNoopNew'],
        'src/features/block-patterns/class-wpcom-block-patterns-utils.php' => ['PhanTypeMismatchReturnNullable'],
        'src/features/coming-soon/coming-soon.php' => ['PhanTypeArraySuspicious', 'PhanTypeMismatchArgumentInternal'],
        'src/features/coming-soon/fallback-coming-soon-page.php' => ['PhanTypeMismatchArgument', 'PhanTypeVoidArgument'],
        'src/features/error-reporting/error-reporting.php' => ['PhanPluginDuplicateConditionalNullCoalescing'],
        'src/features/launchpad/class-launchpad-task-lists.php' => ['PhanNoopArrayAccess', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchDefault', 'PhanTypeMismatchReturn', 'PhanTypePossiblyInvalidDimOffset'],
        'src/features/launchpad/launchpad-task-definitions.php' => ['PhanRedundantCondition', 'PhanTypeArraySuspiciousNullable', 'PhanTypeComparisonToArray', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal', 'PhanTypeMissingReturn', 'PhanTypePossiblyInvalidDimOffset'],
        'src/features/launchpad/launchpad.php' => ['PhanTypeArraySuspiciousNullable', 'PhanTypeMismatchArgument', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal'],
        'src/features/marketplace-products-updater/class-marketplace-products-updater.php' => ['PhanTypeMismatchDimFetch', 'PhanTypeMismatchReturn'],
        'src/features/media/heif-support.php' => ['PhanPluginSimplifyExpressionBool'],
        'src/features/verbum-comments/class-verbum-comments.php' => ['PhanImpossibleTypeComparison', 'PhanNoopNew', 'PhanTypeMismatchArgumentProbablyReal', 'PhanUndeclaredFunction'],
        'src/features/wpcom-endpoints/class-wpcom-rest-api-v2-endpoint-launchpad.php' => ['PhanPluginDuplicateConditionalNullCoalescing'],
        'src/features/wpcom-endpoints/class-wpcom-rest-api-v2-endpoint-site-migration-migrate-guru-key.php' => ['PhanUndeclaredClassMethod'],
        'src/features/wpcom-endpoints/class-wpcom-rest-api-v2-endpoint-site-migration-wpcom-migration-key.php' => ['PhanUndeclaredClassMethod'],
        'tests/lib/functions-wordpress.php' => ['PhanRedefineFunction'],
        'tests/php/features/coming-soon/Coming_Soon_Test.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal'],
        'tests/php/features/launchpad/Launchpad_Task_List_Validation_Test.php' => ['PhanNonClassMethodCall'],
        'tests/php/features/launchpad/Launchpad_Task_Lists_Test.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal'],
        'tests/php/features/launchpad/Launchpad_WPCOM_Requests_Test.php' => ['PhanTypeMismatchArgument'],
        'tests/php/features/launchpad/class-launchpad-jetpack-connection-client-mock.php' => ['PhanTypeMissingReturn'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
