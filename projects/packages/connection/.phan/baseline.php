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
    // PhanTypeMismatchArgument : 45+ occurrences
    // PhanParamTooMany : 40+ occurrences
    // PhanTypeMismatchArgumentProbablyReal : 20+ occurrences
    // PhanDeprecatedFunction : 15+ occurrences
    // PhanPluginDuplicateConditionalNullCoalescing : 15+ occurrences
    // PhanTypeMismatchReturn : 15+ occurrences
    // PhanUndeclaredClassMethod : 15+ occurrences
    // PhanTypeMismatchPropertyProbablyReal : 9 occurrences
    // PhanNoopNew : 8 occurrences
    // PhanTypeMismatchReturnProbablyReal : 8 occurrences
    // PhanUndeclaredProperty : 8 occurrences
    // PhanRedundantCondition : 5 occurrences
    // PhanTypeArraySuspiciousNullable : 5 occurrences
    // PhanTypeMismatchDefault : 5 occurrences
    // PhanTypeMismatchArgumentInternal : 3 occurrences
    // PhanTypeMismatchArgumentNullable : 3 occurrences
    // PhanTypeMismatchProperty : 3 occurrences
    // PhanTypeObjectUnsetDeclaredProperty : 3 occurrences
    // PhanUndeclaredTypeReturnType : 3 occurrences
    // PhanCommentParamWithoutRealParam : 2 occurrences
    // PhanNonClassMethodCall : 2 occurrences
    // PhanPluginUnreachableCode : 2 occurrences
    // PhanPossiblyUndeclaredVariable : 2 occurrences
    // PhanTypeMismatchPropertyDefault : 2 occurrences
    // PhanTypeMismatchReturnNullable : 2 occurrences
    // PhanTypePossiblyInvalidDimOffset : 2 occurrences
    // PhanUndeclaredMethodInCallable : 2 occurrences
    // PhanUndeclaredTypeProperty : 2 occurrences
    // PhanUndeclaredTypeThrowsType : 2 occurrences
    // PhanUnextractableAnnotationSuffix : 2 occurrences
    // PhanAccessMethodInternal : 1 occurrence
    // PhanImpossibleCondition : 1 occurrence
    // PhanImpossibleTypeComparison : 1 occurrence
    // PhanPluginDuplicateAdjacentStatement : 1 occurrence
    // PhanPluginSimplifyExpressionBool : 1 occurrence
    // PhanTypeMismatchDeclaredParamNullable : 1 occurrence
    // PhanTypeSuspiciousStringExpression : 1 occurrence
    // PhanUndeclaredClassReference : 1 occurrence
    // PhanUndeclaredFunctionInCallable : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'legacy/class-jetpack-ixr-clientmulticall.php' => ['PhanTypeMismatchArgumentProbablyReal'],
        'legacy/class-jetpack-options.php' => ['PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchArgumentProbablyReal'],
        'legacy/class-jetpack-signature.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchArgumentInternal'],
        'legacy/class-jetpack-tracks-client.php' => ['PhanNonClassMethodCall', 'PhanParamTooMany', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchArgument', 'PhanTypeMismatchPropertyProbablyReal'],
        'legacy/class-jetpack-xmlrpc-server.php' => ['PhanAccessMethodInternal', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanRedundantCondition', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchDefault', 'PhanTypeMismatchReturn', 'PhanUndeclaredClassMethod', 'PhanUndeclaredProperty'],
        'src/class-error-handler.php' => ['PhanTypeMismatchReturnProbablyReal'],
        'src/class-heartbeat.php' => ['PhanTypeMismatchPropertyDefault'],
        'src/class-manager.php' => ['PhanImpossibleCondition', 'PhanNoopNew', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanRedundantCondition', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchDeclaredParamNullable', 'PhanTypeMismatchDefault', 'PhanTypeMismatchProperty', 'PhanTypeMismatchPropertyProbablyReal', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnNullable', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredTypeProperty', 'PhanUndeclaredTypeReturnType'],
        'src/class-nonce-handler.php' => ['PhanPossiblyUndeclaredVariable', 'PhanTypeMismatchReturnNullable'],
        'src/class-package-version-tracker.php' => ['PhanUndeclaredClassMethod'],
        'src/class-partner-coupon.php' => ['PhanPluginDuplicateConditionalNullCoalescing'],
        'src/class-partner.php' => ['PhanTypeMismatchPropertyProbablyReal'],
        'src/class-plugin-storage.php' => ['PhanUndeclaredClassMethod'],
        'src/class-rest-authentication.php' => ['PhanTypeMismatchPropertyDefault', 'PhanTypeMismatchPropertyProbablyReal'],
        'src/class-rest-connector.php' => ['PhanParamTooMany', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredClassMethod', 'PhanUndeclaredTypeReturnType', 'PhanUnextractableAnnotationSuffix'],
        'src/class-secrets.php' => ['PhanCommentParamWithoutRealParam', 'PhanNonClassMethodCall', 'PhanTypeMismatchArgument'],
        'src/class-server-sandbox.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchArgument'],
        'src/class-tokens.php' => ['PhanImpossibleTypeComparison', 'PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal'],
        'src/class-tracking.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchDefault', 'PhanTypePossiblyInvalidDimOffset'],
        'src/class-urls.php' => ['PhanTypeSuspiciousStringExpression', 'PhanUndeclaredFunctionInCallable'],
        'src/class-webhooks.php' => ['PhanTypeMismatchArgumentProbablyReal'],
        'src/class-xmlrpc-connector.php' => ['PhanUndeclaredTypeReturnType'],
        'src/sso/class-helpers.php' => ['PhanTypeMismatchArgumentProbablyReal'],
        'src/sso/class-sso.php' => ['PhanNoopNew', 'PhanRedundantCondition', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanUndeclaredClassMethod'],
        'src/sso/class-user-admin.php' => ['PhanPluginUnreachableCode', 'PhanTypeMismatchArgument'],
        'src/webhooks/class-authorize-redirect.php' => ['PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchProperty', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassReference', 'PhanUndeclaredTypeProperty'],
        'tests/php/test-class-nonce-handler.php' => ['PhanPluginDuplicateAdjacentStatement', 'PhanTypeMismatchArgument'],
        'tests/php/test-class-plugin.php' => ['PhanUndeclaredTypeThrowsType'],
        'tests/php/test-class-webhooks.php' => ['PhanDeprecatedFunction', 'PhanUndeclaredTypeThrowsType'],
        'tests/php/test-partner-coupon.php' => ['PhanDeprecatedFunction'],
        'tests/php/test-rest-endpoints.php' => ['PhanNoopNew', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredMethodInCallable'],
        'tests/php/test-tracking.php' => ['PhanDeprecatedFunction'],
        'tests/php/test_Error_Handler.php' => ['PhanParamTooMany', 'PhanTypeMismatchArgument'],
        'tests/php/test_Manager_integration.php' => ['PhanParamTooMany'],
        'tests/php/test_Manager_unit.php' => ['PhanDeprecatedFunction', 'PhanParamTooMany', 'PhanTypeArraySuspiciousNullable', 'PhanTypeObjectUnsetDeclaredProperty'],
        'tests/php/test_Rest_Authentication.php' => ['PhanDeprecatedFunction', 'PhanTypeMismatchArgument'],
        'tests/php/test_Server_Sandbox.php' => ['PhanTypeArraySuspiciousNullable'],
        'tests/php/test_Signature.php' => ['PhanTypeMismatchArgumentProbablyReal'],
        'tests/php/test_Tokens.php' => ['PhanDeprecatedFunction', 'PhanTypeObjectUnsetDeclaredProperty'],
        'tests/php/test_jetpack_xmlrpc_server.php' => ['PhanDeprecatedFunction', 'PhanPluginSimplifyExpressionBool', 'PhanTypeMismatchArgument', 'PhanUndeclaredMethodInCallable'],
        'tests/php/test_package_version_tracker.php' => ['PhanDeprecatedFunction'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
