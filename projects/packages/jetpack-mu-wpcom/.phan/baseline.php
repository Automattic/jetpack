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
    // PhanUndeclaredFunction : 75+ occurrences
    // PhanUndeclaredClassMethod : 60+ occurrences
    // PhanTypeMismatchArgumentProbablyReal : 55+ occurrences
    // PhanTypeMismatchArgument : 40+ occurrences
    // PhanTypeArraySuspicious : 30+ occurrences
    // PhanUndeclaredTypeParameter : 15+ occurrences
    // PhanUndeclaredFunctionInCallable : 10+ occurrences
    // PhanUndeclaredTypeReturnType : 9 occurrences
    // PhanPluginDuplicateConditionalNullCoalescing : 8 occurrences
    // PhanUndeclaredClassConstant : 8 occurrences
    // PhanTypeMismatchReturn : 7 occurrences
    // PhanTypeMismatchReturnProbablyReal : 7 occurrences
    // PhanUndeclaredConstant : 5 occurrences
    // PhanUndeclaredTypeProperty : 4 occurrences
    // PhanUndeclaredClassInCallable : 3 occurrences
    // PhanUndeclaredClassReference : 3 occurrences
    // PhanEmptyFQSENInCallable : 2 occurrences
    // PhanNoopNew : 2 occurrences
    // PhanParamTooMany : 2 occurrences
    // PhanTypeMismatchArgumentInternal : 2 occurrences
    // PhanTypeMismatchDefault : 2 occurrences
    // PhanTypeMissingReturn : 2 occurrences
    // PhanImpossibleTypeComparison : 1 occurrence
    // PhanNonClassMethodCall : 1 occurrence
    // PhanNoopArrayAccess : 1 occurrence
    // PhanPluginDuplicateExpressionAssignmentOperation : 1 occurrence
    // PhanPluginSimplifyExpressionBool : 1 occurrence
    // PhanRedefineFunction : 1 occurrence
    // PhanRedundantCondition : 1 occurrence
    // PhanRedundantConditionInLoop : 1 occurrence
    // PhanTypeComparisonToArray : 1 occurrence
    // PhanTypeInvalidLeftOperandOfNumericOp : 1 occurrence
    // PhanTypeMismatchDimFetch : 1 occurrence
    // PhanTypeMismatchProperty : 1 occurrence
    // PhanTypeMismatchPropertyDefault : 1 occurrence
    // PhanTypeMismatchReturnNullable : 1 occurrence
    // PhanTypeNonVarPassByRef : 1 occurrence
    // PhanTypeVoidArgument : 1 occurrence
    // PhanUnextractableAnnotationSuffix : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-jetpack-mu-wpcom.php' => ['PhanNoopNew', 'PhanUndeclaredConstant', 'PhanUndeclaredFunction'],
        'src/features/100-year-plan/enhanced-ownership.php' => ['PhanEmptyFQSENInCallable', 'PhanUndeclaredClassConstant', 'PhanUndeclaredFunction'],
        'src/features/100-year-plan/locked-mode.php' => ['PhanEmptyFQSENInCallable', 'PhanUndeclaredClassConstant', 'PhanUndeclaredFunction'],
        'src/features/admin-color-schemes/admin-color-schemes.php' => ['PhanUndeclaredConstant', 'PhanUndeclaredFunction'],
        'src/features/block-patterns/block-patterns.php' => ['PhanTypeMismatchArgumentProbablyReal', 'PhanUndeclaredTypeParameter'],
        'src/features/block-patterns/class-wpcom-block-patterns-from-api.php' => ['PhanRedundantConditionInLoop'],
        'src/features/block-patterns/class-wpcom-block-patterns-utils.php' => ['PhanTypeMismatchReturnNullable', 'PhanUndeclaredFunction'],
        'src/features/block-theme-previews/block-theme-previews.php' => ['PhanUndeclaredFunction'],
        'src/features/coming-soon/coming-soon.php' => ['PhanTypeArraySuspicious', 'PhanTypeMismatchArgumentInternal', 'PhanUndeclaredFunction', 'PhanUndeclaredFunctionInCallable'],
        'src/features/coming-soon/fallback-coming-soon-page.php' => ['PhanTypeMismatchArgument', 'PhanTypeVoidArgument', 'PhanUndeclaredFunction'],
        'src/features/error-reporting/error-reporting.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanUndeclaredFunction'],
        'src/features/first-posts-stream/first-posts-stream-helpers.php' => ['PhanUndeclaredClassMethod'],
        'src/features/launchpad/class-launchpad-task-lists.php' => ['PhanNoopArrayAccess', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeArraySuspicious', 'PhanTypeMismatchArgument', 'PhanTypeMismatchDefault', 'PhanTypeMismatchProperty', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeProperty', 'PhanUndeclaredTypeReturnType'],
        'src/features/launchpad/launchpad-task-definitions.php' => ['PhanRedundantCondition', 'PhanTypeComparisonToArray', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal', 'PhanTypeMissingReturn', 'PhanUndeclaredClassInCallable', 'PhanUndeclaredClassMethod', 'PhanUndeclaredFunction', 'PhanUndeclaredTypeParameter'],
        'src/features/launchpad/launchpad.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredClassMethod', 'PhanUndeclaredFunction', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeReturnType'],
        'src/features/marketplace-products-updater/class-marketplace-products-updater.php' => ['PhanTypeMismatchDimFetch', 'PhanTypeMismatchReturn', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassReference', 'PhanUnextractableAnnotationSuffix'],
        'src/features/media/heif-support.php' => ['PhanPluginSimplifyExpressionBool', 'PhanUndeclaredClassMethod', 'PhanUndeclaredFunction'],
        'src/features/verbum-comments/assets/class-wpcom-rest-api-v2-verbum-auth.php' => ['PhanUndeclaredFunction'],
        'src/features/verbum-comments/class-verbum-comments.php' => ['PhanImpossibleTypeComparison', 'PhanNoopNew', 'PhanParamTooMany', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchReturn', 'PhanUndeclaredClassMethod', 'PhanUndeclaredConstant', 'PhanUndeclaredFunction', 'PhanUndeclaredFunctionInCallable', 'PhanUndeclaredTypeReturnType'],
        'src/features/wpcom-command-palette/wpcom-command-palette.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredFunction'],
        'src/features/wpcom-endpoints/class-wpcom-rest-api-v2-endpoint-launchpad.php' => ['PhanPluginDuplicateConditionalNullCoalescing'],
        'src/features/wpcom-endpoints/class-wpcom-rest-api-v2-endpoint-site-migration-migrate-guru-key.php' => ['PhanUndeclaredClassMethod'],
        'src/features/wpcom-site-menu/wpcom-site-menu.php' => ['PhanPluginDuplicateExpressionAssignmentOperation', 'PhanTypeInvalidLeftOperandOfNumericOp', 'PhanTypeMismatchArgumentProbablyReal', 'PhanUndeclaredClassInCallable', 'PhanUndeclaredClassMethod', 'PhanUndeclaredFunction', 'PhanUndeclaredFunctionInCallable'],
        'src/utils.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredClassReference'],
        'tests/lib/functions-wordpress.php' => ['PhanRedefineFunction'],
        'tests/php/features/block-patterns/class-wpcom-block-patterns-from-api-test.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchReturn', 'PhanUndeclaredClassMethod', 'PhanUndeclaredTypeReturnType'],
        'tests/php/features/coming-soon/class-coming-soon-test.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchPropertyDefault', 'PhanUndeclaredTypeProperty'],
        'tests/php/features/launchpad/class-launchpad-jetpack-connection-client-mock.php' => ['PhanTypeMissingReturn'],
        'tests/php/features/launchpad/class-launchpad-task-list-validation-test.php' => ['PhanNonClassMethodCall', 'PhanTypeMismatchArgument'],
        'tests/php/features/launchpad/class-launchpad-task-lists-test.php' => ['PhanTypeArraySuspicious', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeNonVarPassByRef'],
        'tests/php/features/launchpad/class-launchpad-wpcom-requests-test.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanUndeclaredClassReference'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
