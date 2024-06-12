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
    // PhanTypeMismatchArgumentProbablyReal : 30+ occurrences
    // PhanTypeMismatchArgument : 15+ occurrences
    // PhanPluginDuplicateConditionalNullCoalescing : 8 occurrences
    // PhanTypeMismatchReturn : 6 occurrences
    // PhanTypeMismatchReturnProbablyReal : 4 occurrences
    // PhanUndeclaredFunction : 4 occurrences
    // PhanNoopNew : 3 occurrences
    // PhanTypePossiblyInvalidDimOffset : 3 occurrences
    // PhanUndeclaredClassMethod : 3 occurrences
    // PhanEmptyFQSENInCallable : 2 occurrences
    // PhanParamTooMany : 2 occurrences
    // PhanTypeArraySuspicious : 2 occurrences
    // PhanTypeArraySuspiciousNullable : 2 occurrences
    // PhanTypeMismatchArgumentInternal : 2 occurrences
    // PhanTypeMismatchDefault : 2 occurrences
    // PhanTypeMissingReturn : 2 occurrences
    // PhanDeprecatedFunction : 1 occurrence
    // PhanImpossibleTypeComparison : 1 occurrence
    // PhanNonClassMethodCall : 1 occurrence
    // PhanNoopArrayAccess : 1 occurrence
    // PhanPluginSimplifyExpressionBool : 1 occurrence
    // PhanRedefineFunction : 1 occurrence
    // PhanRedundantCondition : 1 occurrence
    // PhanTypeComparisonToArray : 1 occurrence
    // PhanTypeMismatchDimFetch : 1 occurrence
    // PhanTypeMismatchReturnNullable : 1 occurrence
    // PhanTypeNonVarPassByRef : 1 occurrence
    // PhanTypeVoidArgument : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-jetpack-mu-wpcom.php' => ['PhanNoopNew'],
        'src/features/100-year-plan/enhanced-ownership.php' => ['PhanEmptyFQSENInCallable'],
        'src/features/100-year-plan/locked-mode.php' => ['PhanEmptyFQSENInCallable'],
        'src/features/admin-color-schemes/admin-color-schemes.php' => ['PhanNoopNew'],
        'src/features/block-patterns/class-wpcom-block-patterns-utils.php' => ['PhanTypeMismatchReturnNullable'],
        'src/features/coming-soon/coming-soon.php' => ['PhanTypeArraySuspicious', 'PhanTypeMismatchArgumentInternal', 'PhanUndeclaredFunction'],
        'src/features/coming-soon/fallback-coming-soon-page.php' => ['PhanTypeMismatchArgument', 'PhanTypeVoidArgument'],
        'src/features/error-reporting/error-reporting.php' => ['PhanPluginDuplicateConditionalNullCoalescing'],
        'src/features/launchpad/class-launchpad-task-lists.php' => ['PhanNoopArrayAccess', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchDefault', 'PhanTypeMismatchReturn', 'PhanTypePossiblyInvalidDimOffset'],
        'src/features/launchpad/launchpad-task-definitions.php' => ['PhanRedundantCondition', 'PhanTypeArraySuspiciousNullable', 'PhanTypeComparisonToArray', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal', 'PhanTypeMissingReturn', 'PhanTypePossiblyInvalidDimOffset'],
        'src/features/launchpad/launchpad.php' => ['PhanTypeArraySuspiciousNullable', 'PhanTypeMismatchArgument', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal'],
        'src/features/marketplace-products-updater/class-marketplace-products-updater.php' => ['PhanTypeMismatchDimFetch', 'PhanTypeMismatchReturn'],
        'src/features/media/heif-support.php' => ['PhanPluginSimplifyExpressionBool'],
        'src/features/verbum-comments/class-verbum-comments.php' => ['PhanImpossibleTypeComparison', 'PhanNoopNew', 'PhanParamTooMany', 'PhanTypeMismatchArgumentProbablyReal', 'PhanUndeclaredFunction'],
        'src/features/wpcom-block-editor/functions.editor-type.php' => ['PhanUndeclaredFunction'],
        'src/features/wpcom-endpoints/class-wpcom-rest-api-v2-endpoint-launchpad.php' => ['PhanPluginDuplicateConditionalNullCoalescing'],
        'src/features/wpcom-endpoints/class-wpcom-rest-api-v2-endpoint-site-migration-migrate-guru-key.php' => ['PhanUndeclaredClassMethod'],
        'src/features/wpcom-site-menu/wpcom-site-menu.php' => ['PhanTypeMismatchArgumentProbablyReal'],
        'tests/lib/functions-wordpress.php' => ['PhanRedefineFunction'],
        'tests/php/features/block-patterns/class-wpcom-block-patterns-from-api-test.php' => ['PhanDeprecatedFunction'],
        'tests/php/features/coming-soon/class-coming-soon-test.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal'],
        'tests/php/features/launchpad/class-launchpad-jetpack-connection-client-mock.php' => ['PhanTypeMissingReturn'],
        'tests/php/features/launchpad/class-launchpad-task-list-validation-test.php' => ['PhanNonClassMethodCall'],
        'tests/php/features/launchpad/class-launchpad-task-lists-test.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeNonVarPassByRef'],
        'tests/php/features/launchpad/class-launchpad-wpcom-requests-test.php' => ['PhanTypeMismatchArgument'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
