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
    // PhanTypeMismatchArgument : 60+ occurrences
    // PhanParamTooMany : 40+ occurrences
    // PhanUndeclaredMethod : 35+ occurrences
    // PhanUndeclaredClassMethod : 25+ occurrences
    // PhanUndeclaredConstant : 25+ occurrences
    // PhanTypeMismatchReturn : 20+ occurrences
    // PhanDeprecatedFunction : 15+ occurrences
    // PhanPluginDuplicateConditionalNullCoalescing : 15+ occurrences
    // PhanTypeMismatchArgumentProbablyReal : 15+ occurrences
    // PhanUndeclaredTypeReturnType : 10+ occurrences
    // PhanTypeMismatchProperty : 9 occurrences
    // PhanTypeMismatchPropertyProbablyReal : 9 occurrences
    // PhanTypeMismatchReturnProbablyReal : 8 occurrences
    // PhanUndeclaredProperty : 8 occurrences
    // PhanUndeclaredTypeParameter : 8 occurrences
    // PhanNoopNew : 6 occurrences
    // PhanRedefinedUsedTrait : 6 occurrences
    // PhanTypeArraySuspiciousNullable : 5 occurrences
    // PhanTypeMismatchDefault : 5 occurrences
    // PhanUndeclaredTypeThrowsType : 5 occurrences
    // PhanRedundantCondition : 4 occurrences
    // PhanTypeMismatchArgumentInternal : 4 occurrences
    // PhanTypeMismatchArgumentNullable : 4 occurrences
    // PhanPluginNeverReturnMethod : 3 occurrences
    // PhanTypeObjectUnsetDeclaredProperty : 3 occurrences
    // PhanUndeclaredMethodInCallable : 3 occurrences
    // PhanCommentParamWithoutRealParam : 2 occurrences
    // PhanImpossibleCondition : 2 occurrences
    // PhanNonClassMethodCall : 2 occurrences
    // PhanPossiblyUndeclaredVariable : 2 occurrences
    // PhanTypeMismatchPropertyDefault : 2 occurrences
    // PhanTypeMismatchReturnNullable : 2 occurrences
    // PhanTypePossiblyInvalidDimOffset : 2 occurrences
    // PhanUndeclaredTypeProperty : 2 occurrences
    // PhanUnextractableAnnotationSuffix : 2 occurrences
    // PhanAccessMethodInternal : 1 occurrence
    // PhanImpossibleTypeComparison : 1 occurrence
    // PhanPluginDuplicateAdjacentStatement : 1 occurrence
    // PhanPluginSimplifyExpressionBool : 1 occurrence
    // PhanTypeMismatchDeclaredParamNullable : 1 occurrence
    // PhanTypeSuspiciousStringExpression : 1 occurrence
    // PhanUndeclaredClassProperty : 1 occurrence
    // PhanUndeclaredClassReference : 1 occurrence
    // PhanUndeclaredFunction : 1 occurrence
    // PhanUndeclaredFunctionInCallable : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'legacy/class-jetpack-ixr-client.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredConstant'],
        'legacy/class-jetpack-ixr-clientmulticall.php' => ['PhanTypeMismatchArgumentProbablyReal'],
        'legacy/class-jetpack-options.php' => ['PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchArgumentProbablyReal'],
        'legacy/class-jetpack-signature.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchArgumentInternal'],
        'legacy/class-jetpack-tracks-client.php' => ['PhanNonClassMethodCall', 'PhanParamTooMany', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchArgument', 'PhanTypeMismatchPropertyProbablyReal', 'PhanUndeclaredConstant'],
        'legacy/class-jetpack-xmlrpc-server.php' => ['PhanAccessMethodInternal', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanRedundantCondition', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchDefault', 'PhanTypeMismatchReturn', 'PhanUndeclaredClassMethod', 'PhanUndeclaredConstant', 'PhanUndeclaredProperty'],
        'src/class-client.php' => ['PhanImpossibleCondition', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchReturn', 'PhanUndeclaredClassMethod', 'PhanUndeclaredFunction', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeReturnType'],
        'src/class-error-handler.php' => ['PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredConstant'],
        'src/class-heartbeat.php' => ['PhanTypeMismatchPropertyDefault', 'PhanUndeclaredConstant'],
        'src/class-manager.php' => ['PhanImpossibleCondition', 'PhanNoopNew', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanPluginNeverReturnMethod', 'PhanRedundantCondition', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchDeclaredParamNullable', 'PhanTypeMismatchDefault', 'PhanTypeMismatchProperty', 'PhanTypeMismatchPropertyProbablyReal', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnNullable', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredClassMethod', 'PhanUndeclaredConstant', 'PhanUndeclaredTypeProperty', 'PhanUndeclaredTypeReturnType'],
        'src/class-nonce-handler.php' => ['PhanPossiblyUndeclaredVariable', 'PhanTypeMismatchReturnNullable', 'PhanUndeclaredConstant'],
        'src/class-package-version-tracker.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredConstant'],
        'src/class-partner-coupon.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanUndeclaredConstant'],
        'src/class-partner.php' => ['PhanTypeMismatchPropertyProbablyReal'],
        'src/class-plugin-storage.php' => ['PhanUndeclaredClassMethod'],
        'src/class-rest-authentication.php' => ['PhanTypeMismatchPropertyDefault', 'PhanTypeMismatchPropertyProbablyReal', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeReturnType'],
        'src/class-rest-connector.php' => ['PhanParamTooMany', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredClassMethod', 'PhanUndeclaredTypeReturnType', 'PhanUnextractableAnnotationSuffix'],
        'src/class-secrets.php' => ['PhanCommentParamWithoutRealParam', 'PhanNonClassMethodCall', 'PhanTypeMismatchArgument'],
        'src/class-server-sandbox.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchArgument', 'PhanUndeclaredClassMethod', 'PhanUndeclaredTypeParameter'],
        'src/class-tokens.php' => ['PhanImpossibleTypeComparison', 'PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredClassMethod', 'PhanUndeclaredConstant'],
        'src/class-tracking.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchDefault', 'PhanTypePossiblyInvalidDimOffset', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassProperty', 'PhanUndeclaredConstant', 'PhanUndeclaredTypeParameter'],
        'src/class-urls.php' => ['PhanTypeSuspiciousStringExpression', 'PhanUndeclaredFunctionInCallable'],
        'src/class-webhooks.php' => ['PhanPluginNeverReturnMethod', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal'],
        'src/class-xmlrpc-connector.php' => ['PhanUndeclaredConstant', 'PhanUndeclaredTypeReturnType'],
        'src/webhooks/class-authorize-redirect.php' => ['PhanPluginNeverReturnMethod', 'PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchProperty', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassReference', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeProperty'],
        'tests/php/bootstrap.php' => ['PhanUndeclaredConstant'],
        'tests/php/test-class-nonce-handler.php' => ['PhanPluginDuplicateAdjacentStatement', 'PhanTypeMismatchArgument'],
        'tests/php/test-class-plugin.php' => ['PhanUndeclaredTypeThrowsType'],
        'tests/php/test-class-webhooks.php' => ['PhanDeprecatedFunction', 'PhanTypeMismatchArgument', 'PhanUndeclaredMethod', 'PhanUndeclaredTypeThrowsType'],
        'tests/php/test-partner-coupon.php' => ['PhanDeprecatedFunction', 'PhanRedefinedUsedTrait', 'PhanUndeclaredMethodInCallable'],
        'tests/php/test-partner.php' => ['PhanUndeclaredTypeThrowsType'],
        'tests/php/test-rest-endpoints.php' => ['PhanNoopNew', 'PhanRedefinedUsedTrait', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredMethodInCallable', 'PhanUndeclaredTypeReturnType'],
        'tests/php/test-terms-of-service.php' => ['PhanTypeMismatchProperty', 'PhanUndeclaredMethod'],
        'tests/php/test-tracking.php' => ['PhanDeprecatedFunction', 'PhanTypeMismatchArgument', 'PhanTypeMismatchProperty', 'PhanUndeclaredMethod'],
        'tests/php/test_Error_Handler.php' => ['PhanParamTooMany', 'PhanRedefinedUsedTrait', 'PhanTypeMismatchArgument', 'PhanUndeclaredConstant'],
        'tests/php/test_Jetpack_IXR_ClientMulticall.php' => ['PhanUndeclaredConstant'],
        'tests/php/test_Manager_integration.php' => ['PhanParamTooMany'],
        'tests/php/test_Manager_unit.php' => ['PhanDeprecatedFunction', 'PhanParamTooMany', 'PhanRedefinedUsedTrait', 'PhanTypeArraySuspiciousNullable', 'PhanTypeMismatchArgument', 'PhanTypeMismatchProperty', 'PhanTypeObjectUnsetDeclaredProperty', 'PhanUndeclaredMethod'],
        'tests/php/test_Rest_Authentication.php' => ['PhanDeprecatedFunction', 'PhanTypeMismatchArgument', 'PhanTypeMismatchProperty', 'PhanUndeclaredMethod'],
        'tests/php/test_Server_Sandbox.php' => ['PhanTypeArraySuspiciousNullable', 'PhanTypeMismatchArgument'],
        'tests/php/test_Signature.php' => ['PhanTypeMismatchArgumentProbablyReal'],
        'tests/php/test_Tokens.php' => ['PhanDeprecatedFunction', 'PhanRedefinedUsedTrait', 'PhanTypeMismatchProperty', 'PhanTypeObjectUnsetDeclaredProperty', 'PhanUndeclaredConstant', 'PhanUndeclaredMethod'],
        'tests/php/test_XMLPC_Async_Call.php' => ['PhanUndeclaredConstant'],
        'tests/php/test_jetpack_xmlrpc_server.php' => ['PhanDeprecatedFunction', 'PhanPluginSimplifyExpressionBool', 'PhanRedefinedUsedTrait', 'PhanTypeMismatchArgument', 'PhanTypeMismatchReturn', 'PhanUndeclaredMethodInCallable'],
        'tests/php/test_package_version_tracker.php' => ['PhanDeprecatedFunction', 'PhanTypeMismatchArgumentProbablyReal', 'PhanUndeclaredMethod'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
