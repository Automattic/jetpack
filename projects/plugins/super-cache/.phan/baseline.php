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
    // PhanPluginSimplifyExpressionBool : 85+ occurrences
    // PhanUndeclaredGlobalVariable : 45+ occurrences
    // PhanTypeMismatchArgumentInternal : 30+ occurrences
    // PhanTypeMismatchArgumentNullableInternal : 25+ occurrences
    // PhanPossiblyUndeclaredVariable : 20+ occurrences
    // PhanUndeclaredVariable : 20+ occurrences
    // PhanRedundantCondition : 15+ occurrences
    // PhanTypeNonVarPassByRef : 10+ occurrences
    // PhanTypePossiblyInvalidDimOffset : 10+ occurrences
    // PhanTypeSuspiciousStringExpression : 10+ occurrences
    // PhanUndeclaredFunctionInCallable : 10+ occurrences
    // PhanTypeMismatchArgument : 9 occurrences
    // PhanTypeInvalidDimOffset : 8 occurrences
    // PhanUndeclaredFunction : 8 occurrences
    // PhanTypeArraySuspiciousNull : 7 occurrences
    // PhanTypeArraySuspiciousNullable : 7 occurrences
    // PhanSuspiciousValueComparison : 6 occurrences
    // PhanUndeclaredVariableDim : 6 occurrences
    // PhanTypeMismatchArgumentProbablyReal : 5 occurrences
    // PhanTypeMismatchArgumentInternalProbablyReal : 4 occurrences
    // PhanTypeMismatchArgumentInternalReal : 4 occurrences
    // PhanUndeclaredConstant : 4 occurrences
    // PhanPluginDuplicateConditionalNullCoalescing : 3 occurrences
    // PhanPluginRedundantAssignment : 3 occurrences
    // PhanTypeInvalidLeftOperandOfNumericOp : 3 occurrences
    // PhanTypeSuspiciousNonTraversableForeach : 3 occurrences
    // PhanUndeclaredClassMethod : 3 occurrences
    // PhanImpossibleCondition : 2 occurrences
    // PhanPluginDuplicateAdjacentStatement : 2 occurrences
    // PhanPluginDuplicateExpressionAssignmentOperation : 2 occurrences
    // PhanPluginNeverReturnFunction : 2 occurrences
    // PhanPluginUnreachableCode : 2 occurrences
    // PhanPossiblyUndeclaredGlobalVariable : 2 occurrences
    // PhanRedundantConditionInGlobalScope : 2 occurrences
    // PhanTypeMismatchReturn : 2 occurrences
    // PhanCommentParamWithoutRealParam : 1 occurrence
    // PhanPluginDuplicateIfCondition : 1 occurrence
    // PhanRedefineFunctionInternal : 1 occurrence
    // PhanRedundantConditionInLoop : 1 occurrence
    // PhanTypeArraySuspicious : 1 occurrence
    // PhanTypeConversionFromArray : 1 occurrence
    // PhanTypeInvalidLeftOperandOfBitwiseOp : 1 occurrence
    // PhanTypeInvalidRightOperandOfAdd : 1 occurrence
    // PhanTypeInvalidRightOperandOfBitwiseOp : 1 occurrence
    // PhanTypeMismatchArgumentNullable : 1 occurrence
    // PhanTypeMismatchDimAssignment : 1 occurrence
    // PhanTypeMissingReturn : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'advanced-cache.php' => ['PhanPluginSimplifyExpressionBool'],
        'inc/delete-cache-button.php' => ['PhanPluginNeverReturnFunction', 'PhanRedundantCondition', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentInternal'],
        'ossdl-cdn.php' => ['PhanUndeclaredClassMethod'],
        'partials/advanced.php' => ['PhanPluginSimplifyExpressionBool', 'PhanPossiblyUndeclaredGlobalVariable', 'PhanRedundantConditionInGlobalScope', 'PhanTypeMismatchArgument', 'PhanTypeNonVarPassByRef', 'PhanUndeclaredGlobalVariable'],
        'partials/debug.php' => ['PhanTypeNonVarPassByRef', 'PhanUndeclaredGlobalVariable'],
        'partials/easy.php' => ['PhanPluginSimplifyExpressionBool', 'PhanTypeArraySuspiciousNull', 'PhanTypeInvalidDimOffset', 'PhanTypeMismatchArgumentInternalReal', 'PhanTypeMismatchArgumentProbablyReal', 'PhanUndeclaredConstant', 'PhanUndeclaredGlobalVariable'],
        'partials/lockdown.php' => ['PhanUndeclaredGlobalVariable'],
        'partials/preload.php' => ['PhanPluginDuplicateAdjacentStatement', 'PhanPluginSimplifyExpressionBool', 'PhanPossiblyUndeclaredGlobalVariable', 'PhanTypeMismatchDimAssignment', 'PhanUndeclaredGlobalVariable'],
        'partials/tracking_parameters.php' => ['PhanUndeclaredGlobalVariable'],
        'plugins/badbehaviour.php' => ['PhanRedundantCondition'],
        'plugins/domain-mapping.php' => ['PhanRedundantCondition', 'PhanUndeclaredFunction'],
        'plugins/jetpack.php' => ['PhanPluginSimplifyExpressionBool'],
        'plugins/wptouch.php' => ['PhanPluginSimplifyExpressionBool', 'PhanUndeclaredFunction'],
        'rest/class.wp-super-cache-rest-get-cache.php' => ['PhanPluginSimplifyExpressionBool'],
        'rest/class.wp-super-cache-rest-get-settings.php' => ['PhanPluginSimplifyExpressionBool', 'PhanSuspiciousValueComparison', 'PhanTypeMismatchReturn', 'PhanUndeclaredFunctionInCallable', 'PhanUndeclaredVariable'],
        'rest/class.wp-super-cache-rest-get-status.php' => ['PhanPluginSimplifyExpressionBool', 'PhanSuspiciousValueComparison', 'PhanTypeNonVarPassByRef', 'PhanUndeclaredVariable'],
        'rest/class.wp-super-cache-rest-test-cache.php' => ['PhanPluginSimplifyExpressionBool', 'PhanTypeConversionFromArray', 'PhanTypePossiblyInvalidDimOffset', 'PhanUndeclaredVariableDim'],
        'rest/class.wp-super-cache-rest-update-settings.php' => ['PhanCommentParamWithoutRealParam', 'PhanPluginRedundantAssignment', 'PhanPluginSimplifyExpressionBool', 'PhanTypeMissingReturn'],
        'tests/e2e/tools/mu-test-helpers.php' => ['PhanTypeMismatchArgument'],
        'wp-cache-base.php' => ['PhanTypeMismatchArgumentNullableInternal'],
        'wp-cache-phase1.php' => ['PhanRedundantConditionInGlobalScope', 'PhanTypeNonVarPassByRef'],
        'wp-cache-phase2.php' => ['PhanImpossibleCondition', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanPluginDuplicateIfCondition', 'PhanPluginRedundantAssignment', 'PhanPluginSimplifyExpressionBool', 'PhanPluginUnreachableCode', 'PhanPossiblyUndeclaredVariable', 'PhanRedefineFunctionInternal', 'PhanRedundantCondition', 'PhanSuspiciousValueComparison', 'PhanTypeArraySuspicious', 'PhanTypeArraySuspiciousNull', 'PhanTypeArraySuspiciousNullable', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchArgumentInternalProbablyReal', 'PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchArgumentNullableInternal', 'PhanTypeNonVarPassByRef', 'PhanTypePossiblyInvalidDimOffset', 'PhanTypeSuspiciousNonTraversableForeach', 'PhanTypeSuspiciousStringExpression', 'PhanUndeclaredConstant', 'PhanUndeclaredVariableDim'],
        'wp-cache.php' => ['PhanImpossibleCondition', 'PhanPluginDuplicateAdjacentStatement', 'PhanPluginDuplicateExpressionAssignmentOperation', 'PhanPluginNeverReturnFunction', 'PhanPluginSimplifyExpressionBool', 'PhanPossiblyUndeclaredVariable', 'PhanRedundantCondition', 'PhanRedundantConditionInLoop', 'PhanSuspiciousValueComparison', 'PhanTypeArraySuspiciousNullable', 'PhanTypeInvalidDimOffset', 'PhanTypeInvalidLeftOperandOfBitwiseOp', 'PhanTypeInvalidLeftOperandOfNumericOp', 'PhanTypeInvalidRightOperandOfAdd', 'PhanTypeInvalidRightOperandOfBitwiseOp', 'PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchArgumentInternalProbablyReal', 'PhanTypeMismatchArgumentInternalReal', 'PhanTypeMismatchArgumentNullableInternal', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeNonVarPassByRef', 'PhanTypePossiblyInvalidDimOffset', 'PhanTypeSuspiciousNonTraversableForeach', 'PhanTypeSuspiciousStringExpression', 'PhanUndeclaredConstant', 'PhanUndeclaredFunction', 'PhanUndeclaredVariable', 'PhanUndeclaredVariableDim'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
