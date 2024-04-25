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
    // PhanTypeMismatchArgumentProbablyReal : 50+ occurrences
    // PhanTypeMismatchArgument : 30+ occurrences
    // PhanTypeArraySuspicious : 25+ occurrences
    // PhanUndeclaredTypeParameter : 15+ occurrences
    // PhanPluginDuplicateConditionalNullCoalescing : 8 occurrences
    // PhanTypeMismatchReturnProbablyReal : 7 occurrences
    // PhanUndeclaredTypeReturnType : 6 occurrences
    // PhanTypeMismatchReturn : 5 occurrences
    // PhanUndeclaredClassMethod : 4 occurrences
    // PhanNoopNew : 3 occurrences
    // PhanUndeclaredFunction : 3 occurrences
    // PhanUndeclaredTypeProperty : 3 occurrences
    // PhanEmptyFQSENInCallable : 2 occurrences
    // PhanParamTooMany : 2 occurrences
    // PhanTypeArraySuspiciousNullable : 2 occurrences
    // PhanTypeMismatchArgumentInternal : 2 occurrences
    // PhanTypeMismatchDefault : 2 occurrences
    // PhanTypeMissingReturn : 2 occurrences
    // PhanUndeclaredFunctionInCallable : 2 occurrences
    // PhanDeprecatedFunction : 1 occurrence
    // PhanImpossibleTypeComparison : 1 occurrence
    // PhanNonClassMethodCall : 1 occurrence
    // PhanNoopArrayAccess : 1 occurrence
    // PhanPluginSimplifyExpressionBool : 1 occurrence
    // PhanRedefineFunction : 1 occurrence
    // PhanRedundantCondition : 1 occurrence
    // PhanTypeComparisonToArray : 1 occurrence
    // PhanTypeMismatchDimFetch : 1 occurrence
    // PhanTypeMismatchProperty : 1 occurrence
    // PhanTypeMismatchReturnNullable : 1 occurrence
    // PhanTypeNonVarPassByRef : 1 occurrence
    // PhanTypeVoidArgument : 1 occurrence
    // PhanUndeclaredClassInCallable : 1 occurrence
    // PhanUndeclaredConstant : 1 occurrence
    // PhanUnextractableAnnotationSuffix : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-jetpack-mu-wpcom.php' => ['PhanNoopNew'],
        'src/features/100-year-plan/enhanced-ownership.php' => ['PhanEmptyFQSENInCallable'],
        'src/features/100-year-plan/locked-mode.php' => ['PhanEmptyFQSENInCallable'],
        'src/features/admin-color-schemes/admin-color-schemes.php' => ['PhanUndeclaredConstant'],
        'src/features/block-patterns/block-patterns.php' => ['PhanTypeMismatchArgumentProbablyReal', 'PhanUndeclaredTypeParameter'],
        'src/features/block-patterns/class-wpcom-block-patterns-utils.php' => ['PhanTypeMismatchReturnNullable'],
        'src/features/coming-soon/coming-soon.php' => ['PhanTypeArraySuspicious', 'PhanTypeMismatchArgumentInternal', 'PhanUndeclaredFunction', 'PhanUndeclaredFunctionInCallable'],
        'src/features/coming-soon/fallback-coming-soon-page.php' => ['PhanTypeMismatchArgument', 'PhanTypeVoidArgument'],
        'src/features/error-reporting/error-reporting.php' => ['PhanPluginDuplicateConditionalNullCoalescing'],
        'src/features/launchpad/class-launchpad-task-lists.php' => ['PhanNoopArrayAccess', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeArraySuspicious', 'PhanTypeMismatchArgument', 'PhanTypeMismatchDefault', 'PhanTypeMismatchProperty', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeProperty', 'PhanUndeclaredTypeReturnType'],
        'src/features/launchpad/launchpad-task-definitions.php' => ['PhanRedundantCondition', 'PhanTypeArraySuspiciousNullable', 'PhanTypeComparisonToArray', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal', 'PhanTypeMissingReturn'],
        'src/features/launchpad/launchpad.php' => ['PhanTypeArraySuspiciousNullable', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredClassMethod', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeReturnType'],
        'src/features/marketplace-products-updater/class-marketplace-products-updater.php' => ['PhanTypeMismatchDimFetch', 'PhanTypeMismatchReturn', 'PhanUnextractableAnnotationSuffix'],
        'src/features/media/heif-support.php' => ['PhanPluginSimplifyExpressionBool'],
        'src/features/verbum-comments/class-verbum-comments.php' => ['PhanImpossibleTypeComparison', 'PhanNoopNew', 'PhanParamTooMany', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchReturn', 'PhanUndeclaredFunction', 'PhanUndeclaredTypeReturnType'],
        'src/features/wpcom-endpoints/class-wpcom-rest-api-v2-endpoint-launchpad.php' => ['PhanPluginDuplicateConditionalNullCoalescing'],
        'src/features/wpcom-endpoints/class-wpcom-rest-api-v2-endpoint-site-migration-migrate-guru-key.php' => ['PhanUndeclaredClassMethod'],
        'src/features/wpcom-site-menu/wpcom-site-menu.php' => ['PhanTypeMismatchArgumentProbablyReal', 'PhanUndeclaredClassInCallable', 'PhanUndeclaredFunctionInCallable'],
        'tests/lib/functions-wordpress.php' => ['PhanRedefineFunction'],
        'tests/php/features/block-patterns/class-wpcom-block-patterns-from-api-test.php' => ['PhanDeprecatedFunction', 'PhanTypeMismatchArgumentProbablyReal'],
        'tests/php/features/coming-soon/class-coming-soon-test.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal'],
        'tests/php/features/launchpad/class-launchpad-jetpack-connection-client-mock.php' => ['PhanTypeMissingReturn'],
        'tests/php/features/launchpad/class-launchpad-task-list-validation-test.php' => ['PhanNonClassMethodCall', 'PhanTypeMismatchArgument'],
        'tests/php/features/launchpad/class-launchpad-task-lists-test.php' => ['PhanTypeArraySuspicious', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeNonVarPassByRef'],
        'tests/php/features/launchpad/class-launchpad-wpcom-requests-test.php' => ['PhanTypeMismatchArgument'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
