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
    // PhanUndeclaredConstant : 95+ occurrences
    // PhanUndeclaredGlobalVariable : 55+ occurrences
    // PhanTypeMismatchArgumentInternal : 30+ occurrences
    // PhanTypeMismatchArgumentNullableInternal : 25+ occurrences
    // PhanPossiblyUndeclaredVariable : 20+ occurrences
    // PhanUndeclaredVariable : 20+ occurrences
    // PhanTypeNonVarPassByRef : 10+ occurrences
    // PhanTypePossiblyInvalidDimOffset : 10+ occurrences
    // PhanTypeSuspiciousStringExpression : 10+ occurrences
    // PhanUndeclaredFunctionInCallable : 10+ occurrences
    // PhanTypeMismatchArgument : 9 occurrences
    // PhanUndeclaredFunction : 9 occurrences
    // PhanTypeInvalidDimOffset : 8 occurrences
    // PhanTypeArraySuspiciousNull : 7 occurrences
    // PhanTypeArraySuspiciousNullable : 7 occurrences
    // PhanUndeclaredVariableDim : 7 occurrences
    // PhanTypeMismatchArgumentProbablyReal : 5 occurrences
    // PhanTypeMismatchArgumentInternalProbablyReal : 4 occurrences
    // PhanTypeMismatchArgumentInternalReal : 4 occurrences
    // PhanTypeInvalidLeftOperandOfNumericOp : 3 occurrences
    // PhanTypeSuspiciousNonTraversableForeach : 3 occurrences
    // PhanUndeclaredClassMethod : 3 occurrences
    // PhanPossiblyUndeclaredGlobalVariable : 2 occurrences
    // PhanTypeArraySuspicious : 2 occurrences
    // PhanTypeMismatchReturn : 2 occurrences
    // PhanCommentParamWithoutRealParam : 1 occurrence
    // PhanRedefineFunctionInternal : 1 occurrence
    // PhanTypeConversionFromArray : 1 occurrence
    // PhanTypeInvalidLeftOperandOfBitwiseOp : 1 occurrence
    // PhanTypeInvalidRightOperandOfAdd : 1 occurrence
    // PhanTypeInvalidRightOperandOfBitwiseOp : 1 occurrence
    // PhanTypeMismatchArgumentNullable : 1 occurrence
    // PhanTypeMismatchDimAssignment : 1 occurrence
    // PhanTypeMissingReturn : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'inc/delete-cache-button.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentInternal', 'PhanUndeclaredFunction'],
        'ossdl-cdn.php' => ['PhanUndeclaredClassMethod'],
        'partials/advanced.php' => ['PhanPossiblyUndeclaredGlobalVariable', 'PhanTypeMismatchArgument', 'PhanTypeNonVarPassByRef', 'PhanUndeclaredConstant', 'PhanUndeclaredGlobalVariable'],
        'partials/debug.php' => ['PhanTypeNonVarPassByRef', 'PhanUndeclaredGlobalVariable'],
        'partials/easy.php' => ['PhanTypeArraySuspiciousNull', 'PhanTypeInvalidDimOffset', 'PhanTypeMismatchArgumentInternalReal', 'PhanTypeMismatchArgumentProbablyReal', 'PhanUndeclaredConstant', 'PhanUndeclaredGlobalVariable'],
        'partials/lockdown.php' => ['PhanUndeclaredConstant', 'PhanUndeclaredGlobalVariable'],
        'partials/preload.php' => ['PhanPossiblyUndeclaredGlobalVariable', 'PhanTypeMismatchDimAssignment', 'PhanUndeclaredGlobalVariable'],
        'partials/rejected_user_agents.php' => ['PhanUndeclaredGlobalVariable'],
        'partials/tracking_parameters.php' => ['PhanUndeclaredGlobalVariable'],
        'plugins/badbehaviour.php' => ['PhanUndeclaredConstant'],
        'plugins/domain-mapping.php' => ['PhanUndeclaredFunction'],
        'plugins/wptouch.php' => ['PhanUndeclaredFunction'],
        'rest/class.wp-super-cache-rest-get-settings.php' => ['PhanTypeMismatchReturn', 'PhanUndeclaredConstant', 'PhanUndeclaredFunctionInCallable', 'PhanUndeclaredVariable'],
        'rest/class.wp-super-cache-rest-get-status.php' => ['PhanTypeNonVarPassByRef', 'PhanUndeclaredConstant', 'PhanUndeclaredVariable'],
        'rest/class.wp-super-cache-rest-test-cache.php' => ['PhanTypeConversionFromArray', 'PhanTypePossiblyInvalidDimOffset', 'PhanUndeclaredVariableDim'],
        'rest/class.wp-super-cache-rest-update-settings.php' => ['PhanCommentParamWithoutRealParam', 'PhanTypeMissingReturn', 'PhanUndeclaredConstant'],
        'tests/e2e/tools/mu-test-helpers.php' => ['PhanTypeMismatchArgument'],
        'wp-cache-base.php' => ['PhanTypeMismatchArgumentNullableInternal'],
        'wp-cache-config-sample.php' => ['PhanUndeclaredConstant', 'PhanUndeclaredVariableDim'],
        'wp-cache-phase1.php' => ['PhanTypeNonVarPassByRef', 'PhanUndeclaredConstant'],
        'wp-cache-phase2.php' => ['PhanPossiblyUndeclaredVariable', 'PhanRedefineFunctionInternal', 'PhanTypeArraySuspicious', 'PhanTypeArraySuspiciousNull', 'PhanTypeArraySuspiciousNullable', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchArgumentInternalProbablyReal', 'PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchArgumentNullableInternal', 'PhanTypeNonVarPassByRef', 'PhanTypePossiblyInvalidDimOffset', 'PhanTypeSuspiciousNonTraversableForeach', 'PhanTypeSuspiciousStringExpression', 'PhanUndeclaredConstant', 'PhanUndeclaredVariableDim'],
        'wp-cache.php' => ['PhanPossiblyUndeclaredVariable', 'PhanTypeArraySuspicious', 'PhanTypeArraySuspiciousNullable', 'PhanTypeInvalidDimOffset', 'PhanTypeInvalidLeftOperandOfBitwiseOp', 'PhanTypeInvalidLeftOperandOfNumericOp', 'PhanTypeInvalidRightOperandOfAdd', 'PhanTypeInvalidRightOperandOfBitwiseOp', 'PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchArgumentInternalProbablyReal', 'PhanTypeMismatchArgumentInternalReal', 'PhanTypeMismatchArgumentNullableInternal', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeNonVarPassByRef', 'PhanTypePossiblyInvalidDimOffset', 'PhanTypeSuspiciousNonTraversableForeach', 'PhanTypeSuspiciousStringExpression', 'PhanUndeclaredConstant', 'PhanUndeclaredFunction', 'PhanUndeclaredVariable', 'PhanUndeclaredVariableDim'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
