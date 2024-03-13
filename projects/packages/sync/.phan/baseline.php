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
    // PhanUndeclaredClassMethod : 50+ occurrences
    // PhanTypeMismatchArgument : 45+ occurrences
    // PhanTypeMismatchReturnProbablyReal : 35+ occurrences
    // PhanPluginDuplicateConditionalNullCoalescing : 30+ occurrences
    // PhanUndeclaredConstant : 30+ occurrences
    // PhanTypeMismatchReturn : 20+ occurrences
    // PhanUndeclaredProperty : 20+ occurrences
    // PhanParamSignatureMismatch : 15+ occurrences
    // PhanTypeMismatchArgumentProbablyReal : 15+ occurrences
    // PhanUndeclaredClassProperty : 15+ occurrences
    // PhanTypeMismatchProperty : 10+ occurrences
    // PhanUndeclaredTypeParameter : 10+ occurrences
    // PhanUndeclaredTypeReturnType : 10+ occurrences
    // PhanPluginSimplifyExpressionBool : 7 occurrences
    // PhanPossiblyUndeclaredVariable : 7 occurrences
    // PhanUndeclaredTypeProperty : 7 occurrences
    // PhanPluginDuplicateSwitchCaseLooseEquality : 6 occurrences
    // PhanUndeclaredMethod : 6 occurrences
    // PhanUndeclaredFunction : 5 occurrences
    // PhanTypeExpectedObjectPropAccess : 4 occurrences
    // PhanUndeclaredClassInCallable : 4 occurrences
    // PhanNonClassMethodCall : 3 occurrences
    // PhanRedundantCondition : 3 occurrences
    // PhanTypeArraySuspicious : 3 occurrences
    // PhanTypeArraySuspiciousNullable : 3 occurrences
    // PhanTypeMismatchArgumentInternal : 3 occurrences
    // PhanUndeclaredClassReference : 3 occurrences
    // PhanAccessMethodInternal : 2 occurrences
    // PhanCommentVarInsteadOfParam : 2 occurrences
    // PhanImpossibleCondition : 2 occurrences
    // PhanParamTooMany : 2 occurrences
    // PhanTypeMismatchArgumentNullable : 2 occurrences
    // PhanTypeMismatchPropertyDefault : 2 occurrences
    // PhanTypeMismatchReturnNullable : 2 occurrences
    // PhanTypePossiblyInvalidDimOffset : 2 occurrences
    // PhanTypeSuspiciousStringExpression : 2 occurrences
    // PhanDeprecatedFunction : 1 occurrence
    // PhanNoopNew : 1 occurrence
    // PhanParamTooManyCallable : 1 occurrence
    // PhanPluginNeverReturnMethod : 1 occurrence
    // PhanPluginUseReturnValueInternalKnown : 1 occurrence
    // PhanTypeComparisonFromArray : 1 occurrence
    // PhanTypeInvalidLeftOperandOfNumericOp : 1 occurrence
    // PhanTypeMismatchArgumentNullableInternal : 1 occurrence
    // PhanTypeMismatchDeclaredParam : 1 occurrence
    // PhanTypeMismatchDefault : 1 occurrence
    // PhanTypeMismatchPropertyProbablyReal : 1 occurrence
    // PhanUndeclaredClassInstanceof : 1 occurrence
    // PhanUndeclaredStaticMethod : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-actions.php' => ['PhanPluginSimplifyExpressionBool', 'PhanRedundantCondition', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchProperty', 'PhanUndeclaredClassInCallable', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassReference', 'PhanUndeclaredFunction', 'PhanUndeclaredTypeProperty'],
        'src/class-data-settings.php' => ['PhanPluginDuplicateConditionalNullCoalescing'],
        'src/class-dedicated-sender.php' => ['PhanTypeInvalidLeftOperandOfNumericOp', 'PhanUndeclaredConstant'],
        'src/class-defaults.php' => ['PhanUndeclaredConstant'],
        'src/class-functions.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanRedundantCondition', 'PhanTypeMismatchReturnProbablyReal', 'PhanTypePossiblyInvalidDimOffset', 'PhanUndeclaredClassMethod', 'PhanUndeclaredTypeParameter'],
        'src/class-json-deflate-array-codec.php' => ['PhanTypeMismatchArgument'],
        'src/class-listener.php' => ['PhanNonClassMethodCall', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeArraySuspicious', 'PhanTypeExpectedObjectPropAccess', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal'],
        'src/class-lock.php' => ['PhanTypeMismatchReturn'],
        'src/class-modules.php' => ['PhanTypeMismatchReturn', 'PhanUndeclaredClassInCallable', 'PhanUndeclaredClassMethod', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeReturnType'],
        'src/class-queue.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentNullableInternal', 'PhanTypeMismatchReturn', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassProperty', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeReturnType'],
        'src/class-replicastore.php' => ['PhanAccessMethodInternal', 'PhanParamSignatureMismatch', 'PhanPluginDuplicateSwitchCaseLooseEquality', 'PhanPluginNeverReturnMethod', 'PhanTypeArraySuspiciousNullable', 'PhanTypeMismatchArgument', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnNullable', 'PhanTypeSuspiciousStringExpression', 'PhanUndeclaredStaticMethod'],
        'src/class-rest-endpoints.php' => ['PhanParamTooMany', 'PhanParamTooManyCallable', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal', 'PhanTypePossiblyInvalidDimOffset', 'PhanUndeclaredClassMethod'],
        'src/class-rest-sender.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanUndeclaredClassMethod'],
        'src/class-sender.php' => ['PhanNonClassMethodCall', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchProperty', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassProperty', 'PhanUndeclaredConstant', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeProperty', 'PhanUndeclaredTypeReturnType'],
        'src/class-server.php' => ['PhanTypeMismatchDeclaredParam', 'PhanTypeMismatchProperty', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredClassInCallable', 'PhanUndeclaredTypeProperty'],
        'src/class-settings.php' => ['PhanPossiblyUndeclaredVariable', 'PhanTypeMismatchArgumentProbablyReal'],
        'src/class-utils.php' => ['PhanTypeExpectedObjectPropAccess'],
        'src/modules/class-callables.php' => ['PhanParamSignatureMismatch', 'PhanParamTooMany', 'PhanTypeArraySuspicious', 'PhanTypeMismatchArgument', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredConstant', 'PhanUndeclaredMethod'],
        'src/modules/class-comments.php' => ['PhanParamSignatureMismatch', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredClassMethod'],
        'src/modules/class-constants.php' => ['PhanParamSignatureMismatch', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredProperty'],
        'src/modules/class-full-sync-immediately.php' => ['PhanCommentVarInsteadOfParam', 'PhanPluginSimplifyExpressionBool', 'PhanPossiblyUndeclaredVariable', 'PhanTypeMismatchReturn', 'PhanUndeclaredClassMethod'],
        'src/modules/class-full-sync.php' => ['PhanCommentVarInsteadOfParam', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanPluginSimplifyExpressionBool', 'PhanPossiblyUndeclaredVariable', 'PhanTypeComparisonFromArray', 'PhanUndeclaredMethod'],
        'src/modules/class-import.php' => ['PhanTypeMismatchArgumentInternal'],
        'src/modules/class-meta.php' => ['PhanParamSignatureMismatch', 'PhanTypeArraySuspicious', 'PhanTypeMismatchArgumentProbablyReal', 'PhanUndeclaredConstant'],
        'src/modules/class-module.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredConstant'],
        'src/modules/class-network-options.php' => ['PhanParamSignatureMismatch', 'PhanTypeMismatchReturnProbablyReal'],
        'src/modules/class-options.php' => ['PhanParamSignatureMismatch', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredFunction'],
        'src/modules/class-plugins.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanUndeclaredConstant', 'PhanUndeclaredMethod', 'PhanUndeclaredTypeParameter'],
        'src/modules/class-posts.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanPluginUseReturnValueInternalKnown', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredFunction'],
        'src/modules/class-protect.php' => ['PhanUndeclaredClassMethod'],
        'src/modules/class-term-relationships.php' => ['PhanParamSignatureMismatch', 'PhanTypeMismatchArgument', 'PhanUndeclaredConstant'],
        'src/modules/class-terms.php' => ['PhanAccessMethodInternal', 'PhanParamSignatureMismatch'],
        'src/modules/class-themes.php' => ['PhanParamSignatureMismatch', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredMethod'],
        'src/modules/class-updates.php' => ['PhanImpossibleCondition', 'PhanParamSignatureMismatch', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal'],
        'src/modules/class-users.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchDefault', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal'],
        'src/modules/class-woocommerce-hpos-orders.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredClassInstanceof', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassReference', 'PhanUndeclaredFunction', 'PhanUndeclaredTypeParameter'],
        'src/modules/class-woocommerce.php' => ['PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredConstant'],
        'src/replicastore/class-table-checksum-usermeta.php' => ['PhanUndeclaredClassMethod'],
        'src/replicastore/class-table-checksum-users.php' => ['PhanUndeclaredConstant'],
        'src/replicastore/class-table-checksum.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchPropertyDefault', 'PhanTypeMismatchPropertyProbablyReal', 'PhanUndeclaredConstant'],
        'src/sync-queue/class-queue-storage-options.php' => ['PhanUndeclaredConstant'],
        'src/sync-queue/class-queue-storage-table.php' => ['PhanUndeclaredClassProperty', 'PhanUndeclaredConstant', 'PhanUndeclaredTypeReturnType'],
        'tests/php/test-actions.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal'],
        'tests/php/test-dedicated-sender.php' => ['PhanDeprecatedFunction', 'PhanUndeclaredConstant', 'PhanUndeclaredProperty'],
        'tests/php/test-rest-endpoints.php' => ['PhanNoopNew', 'PhanTypeMismatchReturn'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
