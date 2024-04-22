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
    // PhanTypeMismatchArgument : 40+ occurrences
    // PhanTypeMismatchReturnProbablyReal : 35+ occurrences
    // PhanPluginDuplicateConditionalNullCoalescing : 30+ occurrences
    // PhanTypeMismatchReturn : 20+ occurrences
    // PhanUndeclaredProperty : 20+ occurrences
    // PhanParamSignatureMismatch : 15+ occurrences
    // PhanTypeMismatchArgumentProbablyReal : 15+ occurrences
    // PhanUndeclaredMethod : 15+ occurrences
    // PhanPluginSimplifyExpressionBool : 9 occurrences
    // PhanPossiblyUndeclaredVariable : 8 occurrences
    // PhanPluginDuplicateSwitchCaseLooseEquality : 6 occurrences
    // PhanUndeclaredClassMethod : 6 occurrences
    // PhanRedundantCondition : 4 occurrences
    // PhanTypeExpectedObjectPropAccess : 4 occurrences
    // PhanTypeMismatchArgumentInternal : 4 occurrences
    // PhanUndeclaredClassProperty : 4 occurrences
    // PhanUndeclaredTypeReturnType : 4 occurrences
    // PhanNonClassMethodCall : 3 occurrences
    // PhanTypeArraySuspicious : 3 occurrences
    // PhanTypeArraySuspiciousNullable : 3 occurrences
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
    // PhanPluginUseReturnValueInternalKnown : 1 occurrence
    // PhanTypeComparisonFromArray : 1 occurrence
    // PhanTypeInvalidLeftOperandOfNumericOp : 1 occurrence
    // PhanTypeMismatchArgumentNullableInternal : 1 occurrence
    // PhanTypeMismatchDeclaredParam : 1 occurrence
    // PhanTypeMismatchDefault : 1 occurrence
    // PhanTypeMismatchProperty : 1 occurrence
    // PhanTypeMismatchPropertyProbablyReal : 1 occurrence
    // PhanUndeclaredFunction : 1 occurrence
    // PhanUndeclaredMethodInCallable : 1 occurrence
    // PhanUndeclaredStaticMethod : 1 occurrence
    // PhanUndeclaredTypeParameter : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-actions.php' => ['PhanPluginSimplifyExpressionBool', 'PhanRedundantCondition', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchArgumentProbablyReal', 'PhanUndeclaredClassMethod', 'PhanUndeclaredMethod'],
        'src/class-data-settings.php' => ['PhanPluginDuplicateConditionalNullCoalescing'],
        'src/class-dedicated-sender.php' => ['PhanTypeInvalidLeftOperandOfNumericOp'],
        'src/class-functions.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanRedundantCondition', 'PhanTypeMismatchReturnProbablyReal', 'PhanTypePossiblyInvalidDimOffset', 'PhanUndeclaredClassMethod', 'PhanUndeclaredTypeParameter'],
        'src/class-json-deflate-array-codec.php' => ['PhanTypeMismatchArgument'],
        'src/class-listener.php' => ['PhanNonClassMethodCall', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeArraySuspicious', 'PhanTypeExpectedObjectPropAccess', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal'],
        'src/class-lock.php' => ['PhanTypeMismatchReturn'],
        'src/class-modules.php' => ['PhanUndeclaredMethodInCallable'],
        'src/class-queue.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentNullableInternal', 'PhanUndeclaredClassProperty'],
        'src/class-replicastore.php' => ['PhanAccessMethodInternal', 'PhanParamSignatureMismatch', 'PhanPluginDuplicateSwitchCaseLooseEquality', 'PhanTypeArraySuspiciousNullable', 'PhanTypeMismatchArgument', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnNullable', 'PhanTypeSuspiciousStringExpression', 'PhanUndeclaredStaticMethod'],
        'src/class-rest-endpoints.php' => ['PhanParamTooMany', 'PhanParamTooManyCallable', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal', 'PhanTypePossiblyInvalidDimOffset', 'PhanUndeclaredMethod'],
        'src/class-rest-sender.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchArgumentProbablyReal'],
        'src/class-sender.php' => ['PhanNonClassMethodCall', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchProperty', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredMethod', 'PhanUndeclaredTypeReturnType'],
        'src/class-server.php' => ['PhanTypeMismatchDeclaredParam', 'PhanTypeMismatchReturnProbablyReal'],
        'src/class-settings.php' => ['PhanPossiblyUndeclaredVariable', 'PhanTypeMismatchArgumentProbablyReal', 'PhanUndeclaredClassMethod'],
        'src/class-utils.php' => ['PhanTypeExpectedObjectPropAccess'],
        'src/modules/class-callables.php' => ['PhanParamSignatureMismatch', 'PhanParamTooMany', 'PhanTypeArraySuspicious', 'PhanTypeMismatchArgument', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredMethod'],
        'src/modules/class-comments.php' => ['PhanParamSignatureMismatch', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredMethod'],
        'src/modules/class-constants.php' => ['PhanParamSignatureMismatch', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredProperty'],
        'src/modules/class-full-sync-immediately.php' => ['PhanCommentVarInsteadOfParam', 'PhanPluginSimplifyExpressionBool', 'PhanPossiblyUndeclaredVariable', 'PhanTypeMismatchReturn', 'PhanUndeclaredMethod'],
        'src/modules/class-full-sync.php' => ['PhanCommentVarInsteadOfParam', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanPluginSimplifyExpressionBool', 'PhanPossiblyUndeclaredVariable', 'PhanTypeComparisonFromArray', 'PhanUndeclaredMethod'],
        'src/modules/class-import.php' => ['PhanTypeMismatchArgumentInternal'],
        'src/modules/class-meta.php' => ['PhanParamSignatureMismatch', 'PhanTypeArraySuspicious', 'PhanTypeMismatchArgumentProbablyReal'],
        'src/modules/class-module.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchReturnProbablyReal'],
        'src/modules/class-network-options.php' => ['PhanParamSignatureMismatch', 'PhanTypeMismatchReturnProbablyReal'],
        'src/modules/class-options.php' => ['PhanParamSignatureMismatch', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredFunction'],
        'src/modules/class-plugins.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanUndeclaredMethod'],
        'src/modules/class-posts.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanPluginUseReturnValueInternalKnown', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchReturnProbablyReal'],
        'src/modules/class-protect.php' => ['PhanUndeclaredClassMethod'],
        'src/modules/class-term-relationships.php' => ['PhanParamSignatureMismatch', 'PhanTypeMismatchArgument'],
        'src/modules/class-terms.php' => ['PhanAccessMethodInternal', 'PhanParamSignatureMismatch'],
        'src/modules/class-themes.php' => ['PhanParamSignatureMismatch', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredMethod'],
        'src/modules/class-updates.php' => ['PhanImpossibleCondition', 'PhanParamSignatureMismatch', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal'],
        'src/modules/class-users.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchDefault', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal'],
        'src/modules/class-woocommerce-hpos-orders.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal'],
        'src/modules/class-woocommerce.php' => ['PhanTypeMismatchReturnProbablyReal'],
        'src/replicastore/class-table-checksum-usermeta.php' => ['PhanUndeclaredMethod'],
        'src/replicastore/class-table-checksum.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchPropertyDefault', 'PhanTypeMismatchPropertyProbablyReal'],
        'src/sync-queue/class-queue-storage-table.php' => ['PhanUndeclaredClassProperty', 'PhanUndeclaredTypeReturnType'],
        'tests/php/test-actions.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal'],
        'tests/php/test-dedicated-sender.php' => ['PhanDeprecatedFunction', 'PhanUndeclaredProperty'],
        'tests/php/test-rest-endpoints.php' => ['PhanNoopNew', 'PhanTypeMismatchReturn'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
