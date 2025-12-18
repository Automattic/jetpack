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
    // PhanPluginSimplifyExpressionBool : 80+ occurrences
    // PhanUndeclaredGlobalVariable : 45+ occurrences
    // PhanPossiblyUndeclaredVariable : 20+ occurrences
    // PhanUndeclaredVariable : 20+ occurrences
    // PhanTypeMismatchArgument : 10+ occurrences
    // PhanTypeMismatchArgumentNullableInternal : 10+ occurrences
    // PhanTypeMismatchReturn : 10+ occurrences
    // PhanTypeNonVarPassByRef : 10+ occurrences
    // PhanTypePossiblyInvalidDimOffset : 10+ occurrences
    // PhanUndeclaredFunctionInCallable : 10+ occurrences
    // PhanUndeclaredFunction : 8 occurrences
    // PhanSuspiciousValueComparison : 6 occurrences
    // PhanTypeArraySuspiciousNull : 6 occurrences
    // PhanTypeInvalidDimOffset : 6 occurrences
    // PhanUndeclaredVariableDim : 6 occurrences
    // PhanTypeArraySuspiciousNullable : 5 occurrences
    // PhanTypeMismatchArgumentProbablyReal : 5 occurrences
    // PhanTypeMismatchArgumentInternalProbablyReal : 4 occurrences
    // PhanTypeMismatchArgumentInternalReal : 4 occurrences
    // PhanPluginDuplicateConditionalNullCoalescing : 3 occurrences
    // PhanTypeInvalidLeftOperandOfNumericOp : 3 occurrences
    // PhanTypeSuspiciousNonTraversableForeach : 3 occurrences
    // PhanUndeclaredClassMethod : 3 occurrences
    // PhanPluginDuplicateAdjacentStatement : 2 occurrences
    // PhanPluginDuplicateExpressionAssignmentOperation : 2 occurrences
    // PhanPluginNeverReturnFunction : 2 occurrences
    // PhanPluginUnreachableCode : 2 occurrences
    // PhanPossiblyUndeclaredGlobalVariable : 2 occurrences
    // PhanTypeMismatchArgumentNullable : 2 occurrences
    // PhanTypeSuspiciousStringExpression : 2 occurrences
    // PhanCommentParamWithoutRealParam : 1 occurrence
    // PhanTypeConversionFromArray : 1 occurrence
    // PhanTypeInvalidLeftOperandOfBitwiseOp : 1 occurrence
    // PhanTypeInvalidRightOperandOfAdd : 1 occurrence
    // PhanTypeInvalidRightOperandOfBitwiseOp : 1 occurrence
    // PhanTypeMismatchArgumentInternal : 1 occurrence
    // PhanTypeMismatchDimAssignment : 1 occurrence
    // PhanTypeMismatchProperty : 1 occurrence
    // PhanTypeMissingReturn : 1 occurrence
    // PhanUndeclaredConstant : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'advanced-cache.php' => ['PhanPluginSimplifyExpressionBool'],
        'inc/delete-cache-button.php' => ['PhanPluginNeverReturnFunction', 'PhanTypeMismatchArgument'],
        'ossdl-cdn.php' => ['PhanUndeclaredClassMethod'],
        'partials/advanced.php' => ['PhanPluginSimplifyExpressionBool', 'PhanPossiblyUndeclaredGlobalVariable', 'PhanTypeMismatchArgument', 'PhanTypeNonVarPassByRef', 'PhanUndeclaredGlobalVariable'],
        'partials/debug.php' => ['PhanTypeNonVarPassByRef', 'PhanUndeclaredGlobalVariable'],
        'partials/easy.php' => ['PhanPluginSimplifyExpressionBool', 'PhanTypeArraySuspiciousNull', 'PhanTypeInvalidDimOffset', 'PhanTypeMismatchArgumentInternalReal', 'PhanTypeMismatchArgumentProbablyReal', 'PhanUndeclaredConstant', 'PhanUndeclaredGlobalVariable'],
        'partials/lockdown.php' => ['PhanUndeclaredGlobalVariable'],
        'partials/preload.php' => ['PhanPluginDuplicateAdjacentStatement', 'PhanPluginSimplifyExpressionBool', 'PhanPossiblyUndeclaredGlobalVariable', 'PhanTypeMismatchDimAssignment', 'PhanUndeclaredGlobalVariable'],
        'partials/tracking_parameters.php' => ['PhanUndeclaredGlobalVariable'],
        'plugins/domain-mapping.php' => ['PhanUndeclaredFunction'],
        'plugins/jetpack.php' => ['PhanPluginSimplifyExpressionBool'],
        'plugins/wptouch.php' => ['PhanPluginSimplifyExpressionBool', 'PhanUndeclaredFunction'],
        'rest/class.wp-super-cache-rest-get-cache.php' => ['PhanPluginSimplifyExpressionBool'],
        'rest/class.wp-super-cache-rest-get-settings.php' => ['PhanPluginSimplifyExpressionBool', 'PhanSuspiciousValueComparison', 'PhanTypeMismatchReturn', 'PhanUndeclaredFunctionInCallable', 'PhanUndeclaredVariable'],
        'rest/class.wp-super-cache-rest-get-status.php' => ['PhanPluginSimplifyExpressionBool', 'PhanSuspiciousValueComparison', 'PhanTypeNonVarPassByRef', 'PhanUndeclaredVariable'],
        'rest/class.wp-super-cache-rest-test-cache.php' => ['PhanPluginSimplifyExpressionBool', 'PhanTypeConversionFromArray', 'PhanTypePossiblyInvalidDimOffset', 'PhanUndeclaredVariableDim'],
        'rest/class.wp-super-cache-rest-update-settings.php' => ['PhanCommentParamWithoutRealParam', 'PhanPluginSimplifyExpressionBool', 'PhanTypeMissingReturn'],
        'src/device-detection/class-user-agent-info.php' => ['PhanPluginSimplifyExpressionBool', 'PhanTypeMismatchProperty', 'PhanTypeMismatchReturn'],
        'tests/e2e/tools/mu-test-helpers.php' => ['PhanTypeMismatchArgument'],
        'wp-cache-base.php' => ['PhanTypeMismatchArgumentNullableInternal'],
        'wp-cache-phase1.php' => ['PhanTypeNonVarPassByRef'],
        'wp-cache-phase2.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanPluginSimplifyExpressionBool', 'PhanPluginUnreachableCode', 'PhanPossiblyUndeclaredVariable', 'PhanSuspiciousValueComparison', 'PhanTypeArraySuspiciousNullable', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentInternalProbablyReal', 'PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchArgumentNullableInternal', 'PhanTypeNonVarPassByRef', 'PhanTypePossiblyInvalidDimOffset', 'PhanTypeSuspiciousNonTraversableForeach', 'PhanTypeSuspiciousStringExpression', 'PhanUndeclaredVariableDim'],
        'wp-cache.php' => ['PhanPluginDuplicateAdjacentStatement', 'PhanPluginDuplicateExpressionAssignmentOperation', 'PhanPluginNeverReturnFunction', 'PhanPluginSimplifyExpressionBool', 'PhanPossiblyUndeclaredVariable', 'PhanSuspiciousValueComparison', 'PhanTypeArraySuspiciousNullable', 'PhanTypeInvalidDimOffset', 'PhanTypeInvalidLeftOperandOfBitwiseOp', 'PhanTypeInvalidLeftOperandOfNumericOp', 'PhanTypeInvalidRightOperandOfAdd', 'PhanTypeInvalidRightOperandOfBitwiseOp', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchArgumentInternalProbablyReal', 'PhanTypeMismatchArgumentInternalReal', 'PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchArgumentNullableInternal', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeNonVarPassByRef', 'PhanTypePossiblyInvalidDimOffset', 'PhanTypeSuspiciousNonTraversableForeach', 'PhanUndeclaredFunction', 'PhanUndeclaredVariable', 'PhanUndeclaredVariableDim'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
