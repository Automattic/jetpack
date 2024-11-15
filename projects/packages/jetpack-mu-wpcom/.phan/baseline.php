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
    // PhanTypeMismatchArgument : 35+ occurrences
    // PhanPluginDuplicateConditionalNullCoalescing : 20+ occurrences
    // PhanUndeclaredClassMethod : 20+ occurrences
    // PhanTypeMismatchArgumentProbablyReal : 15+ occurrences
    // PhanTypeMismatchReturnProbablyReal : 10+ occurrences
    // PhanUndeclaredFunction : 10+ occurrences
    // PhanTypeMismatchReturn : 8 occurrences
    // PhanUndeclaredConstant : 7 occurrences
    // PhanTypeArraySuspiciousNullable : 6 occurrences
    // PhanNoopNew : 5 occurrences
    // PhanParamTooMany : 4 occurrences
    // PhanUnextractableAnnotationSuffix : 4 occurrences
    // PhanDeprecatedProperty : 3 occurrences
    // PhanPluginDuplicateExpressionAssignmentOperation : 3 occurrences
    // PhanTypePossiblyInvalidDimOffset : 3 occurrences
    // PhanTypeSuspiciousNonTraversableForeach : 3 occurrences
    // PhanUndeclaredClassReference : 3 occurrences
    // PhanUndeclaredGlobalVariable : 3 occurrences
    // PhanEmptyFQSENInCallable : 2 occurrences
    // PhanPluginMixedKeyNoKey : 2 occurrences
    // PhanTypeArraySuspicious : 2 occurrences
    // PhanTypeMismatchArgumentInternal : 2 occurrences
    // PhanTypeMismatchDefault : 2 occurrences
    // PhanTypeMissingReturn : 2 occurrences
    // PhanDeprecatedFunction : 1 occurrence
    // PhanImpossibleTypeComparison : 1 occurrence
    // PhanNonClassMethodCall : 1 occurrence
    // PhanNoopArrayAccess : 1 occurrence
    // PhanPluginRedundantAssignment : 1 occurrence
    // PhanPluginSimplifyExpressionBool : 1 occurrence
    // PhanPossiblyUndeclaredVariable : 1 occurrence
    // PhanRedefineFunction : 1 occurrence
    // PhanRedundantCondition : 1 occurrence
    // PhanTypeComparisonToArray : 1 occurrence
    // PhanTypeInvalidLeftOperandOfBitwiseOp : 1 occurrence
    // PhanTypeInvalidRightOperandOfBitwiseOp : 1 occurrence
    // PhanTypeMismatchArgumentNullable : 1 occurrence
    // PhanTypeMismatchArgumentNullableInternal : 1 occurrence
    // PhanTypeMismatchDimFetch : 1 occurrence
    // PhanTypeMismatchProperty : 1 occurrence
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
        'src/features/coming-soon/coming-soon.php' => ['PhanTypeArraySuspicious', 'PhanTypeMismatchArgumentInternal'],
        'src/features/coming-soon/fallback-coming-soon-page.php' => ['PhanTypeMismatchArgument', 'PhanTypeVoidArgument'],
        'src/features/error-reporting/error-reporting.php' => ['PhanPluginDuplicateConditionalNullCoalescing'],
        'src/features/launchpad/class-launchpad-task-lists.php' => ['PhanNoopArrayAccess', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchDefault', 'PhanTypeMismatchReturn', 'PhanTypePossiblyInvalidDimOffset'],
        'src/features/launchpad/launchpad-task-definitions.php' => ['PhanRedundantCondition', 'PhanTypeArraySuspiciousNullable', 'PhanTypeComparisonToArray', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal', 'PhanTypeMissingReturn', 'PhanTypePossiblyInvalidDimOffset'],
        'src/features/launchpad/launchpad.php' => ['PhanTypeArraySuspiciousNullable', 'PhanTypeMismatchArgument', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal'],
        'src/features/marketplace-products-updater/class-marketplace-products-updater.php' => ['PhanTypeMismatchDimFetch', 'PhanTypeMismatchReturn'],
        'src/features/media/heif-support.php' => ['PhanPluginSimplifyExpressionBool'],
        'src/features/newspack-blocks/synced-newspack-blocks/blocks/carousel/view.php' => ['PhanParamTooMany', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanPossiblyUndeclaredVariable', 'PhanTypeMismatchArgument', 'PhanTypeMismatchReturnProbablyReal'],
        'src/features/newspack-blocks/synced-newspack-blocks/blocks/homepage-articles/class-wp-rest-newspack-articles-controller.php' => ['PhanTypeArraySuspiciousNullable'],
        'src/features/newspack-blocks/synced-newspack-blocks/blocks/homepage-articles/templates/article.php' => ['PhanTypeMismatchArgument', 'PhanUndeclaredGlobalVariable'],
        'src/features/newspack-blocks/synced-newspack-blocks/blocks/homepage-articles/templates/articles-list.php' => ['PhanUndeclaredGlobalVariable'],
        'src/features/newspack-blocks/synced-newspack-blocks/blocks/homepage-articles/templates/articles-loop.php' => ['PhanUndeclaredGlobalVariable'],
        'src/features/newspack-blocks/synced-newspack-blocks/blocks/homepage-articles/view.php' => ['PhanPluginDuplicateExpressionAssignmentOperation', 'PhanTypeArraySuspiciousNullable', 'PhanTypeMismatchArgumentNullableInternal', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredClassMethod'],
        'src/features/newspack-blocks/synced-newspack-blocks/class-newspack-blocks-api.php' => ['PhanParamTooMany', 'PhanTypeMismatchArgument', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredClassMethod', 'PhanUndeclaredFunction', 'PhanUnextractableAnnotationSuffix'],
        'src/features/newspack-blocks/synced-newspack-blocks/class-newspack-blocks.php' => ['PhanDeprecatedProperty', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanPluginDuplicateExpressionAssignmentOperation', 'PhanPluginMixedKeyNoKey', 'PhanPluginRedundantAssignment', 'PhanTypeInvalidLeftOperandOfBitwiseOp', 'PhanTypeInvalidRightOperandOfBitwiseOp', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchProperty', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal', 'PhanTypeSuspiciousNonTraversableForeach', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassReference', 'PhanUndeclaredConstant', 'PhanUndeclaredFunction'],
        'src/features/verbum-comments/class-verbum-comments.php' => ['PhanImpossibleTypeComparison', 'PhanNoopNew', 'PhanParamTooMany', 'PhanTypeMismatchArgumentProbablyReal', 'PhanUndeclaredFunction'],
        'src/features/wpcom-endpoints/class-wpcom-rest-api-v2-endpoint-launchpad.php' => ['PhanPluginDuplicateConditionalNullCoalescing'],
        'src/features/wpcom-endpoints/class-wpcom-rest-api-v2-endpoint-site-migration-migrate-guru-key.php' => ['PhanUndeclaredClassMethod'],
        'src/features/wpcom-endpoints/class-wpcom-rest-api-v2-endpoint-site-migration-wpcom-migration-key.php' => ['PhanUndeclaredClassMethod'],
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
