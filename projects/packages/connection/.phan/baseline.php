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
    // PhanPluginDuplicateConditionalNullCoalescing : 15+ occurrences
    // PhanTypeMismatchReturn : 15+ occurrences
    // PhanTypeMismatchPropertyProbablyReal : 9 occurrences
    // PhanNoopNew : 8 occurrences
    // PhanTypeMismatchArgumentProbablyReal : 8 occurrences
    // PhanTypeMismatchReturnProbablyReal : 8 occurrences
    // PhanRedundantCondition : 6 occurrences
    // PhanTypeArraySuspiciousNullable : 5 occurrences
    // PhanTypeMismatchDefault : 5 occurrences
    // PhanTypeMismatchArgumentInternal : 3 occurrences
    // PhanTypeObjectUnsetDeclaredProperty : 3 occurrences
    // PhanDeprecatedFunction : 2 occurrences
    // PhanNonClassMethodCall : 2 occurrences
    // PhanPluginUnreachableCode : 2 occurrences
    // PhanPossiblyUndeclaredVariable : 2 occurrences
    // PhanTypeMismatchArgumentNullable : 2 occurrences
    // PhanTypeMismatchPropertyDefault : 2 occurrences
    // PhanTypeMismatchReturnNullable : 2 occurrences
    // PhanTypePossiblyInvalidDimOffset : 2 occurrences
    // PhanAccessMethodInternal : 1 occurrence
    // PhanImpossibleCondition : 1 occurrence
    // PhanImpossibleTypeComparison : 1 occurrence
    // PhanPluginDuplicateAdjacentStatement : 1 occurrence
    // PhanPluginSimplifyExpressionBool : 1 occurrence
    // PhanTypeMismatchDeclaredParamNullable : 1 occurrence
    // PhanUndeclaredClassMethod : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'legacy/class-jetpack-options.php' => ['PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchArgumentProbablyReal'],
        'legacy/class-jetpack-signature.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchArgumentInternal'],
        'legacy/class-jetpack-tracks-client.php' => ['PhanNonClassMethodCall', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchArgument', 'PhanTypeMismatchPropertyProbablyReal'],
        'legacy/class-jetpack-xmlrpc-server.php' => ['PhanAccessMethodInternal', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanRedundantCondition', 'PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchDefault', 'PhanTypeMismatchReturn'],
        'src/class-error-handler.php' => ['PhanTypeMismatchReturnProbablyReal'],
        'src/class-heartbeat.php' => ['PhanTypeMismatchPropertyDefault'],
        'src/class-manager.php' => ['PhanImpossibleCondition', 'PhanNoopNew', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanRedundantCondition', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchDeclaredParamNullable', 'PhanTypeMismatchDefault', 'PhanTypeMismatchPropertyProbablyReal', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnNullable', 'PhanTypeMismatchReturnProbablyReal'],
        'src/class-nonce-handler.php' => ['PhanPossiblyUndeclaredVariable', 'PhanTypeMismatchReturnNullable'],
        'src/class-partner-coupon.php' => ['PhanPluginDuplicateConditionalNullCoalescing'],
        'src/class-partner.php' => ['PhanTypeMismatchPropertyProbablyReal'],
        'src/class-rest-authentication.php' => ['PhanTypeMismatchPropertyDefault', 'PhanTypeMismatchPropertyProbablyReal'],
        'src/class-rest-connector.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchReturnProbablyReal'],
        'src/class-secrets.php' => ['PhanNonClassMethodCall', 'PhanTypeMismatchArgument'],
        'src/class-server-sandbox.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchArgument'],
        'src/class-tokens.php' => ['PhanImpossibleTypeComparison', 'PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal'],
        'src/class-tracking.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchDefault', 'PhanTypePossiblyInvalidDimOffset'],
        'src/sso/class-sso.php' => ['PhanNoopNew', 'PhanRedundantCondition', 'PhanTypeMismatchArgument'],
        'src/sso/class-user-admin.php' => ['PhanPluginUnreachableCode', 'PhanTypeMismatchArgument'],
        'src/webhooks/class-authorize-redirect.php' => ['PhanUndeclaredClassMethod'],
        'tests/php/Error_Handler_Test.php' => ['PhanTypeMismatchArgument'],
        'tests/php/Jetpack_XMLRPC_Server_Test.php' => ['PhanPluginSimplifyExpressionBool', 'PhanTypeMismatchArgument'],
        'tests/php/ManagerTest.php' => ['PhanDeprecatedFunction', 'PhanTypeArraySuspiciousNullable', 'PhanTypeObjectUnsetDeclaredProperty'],
        'tests/php/Nonce_Handler_Test.php' => ['PhanPluginDuplicateAdjacentStatement', 'PhanTypeMismatchArgument'],
        'tests/php/REST_Authentication_Test.php' => ['PhanTypeMismatchArgument'],
        'tests/php/REST_Endpoints_Test.php' => ['PhanNoopNew', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal'],
        'tests/php/Server_Sandbox_Test.php' => ['PhanTypeArraySuspiciousNullable'],
        'tests/php/SignatureTest.php' => ['PhanTypeMismatchArgumentProbablyReal'],
        'tests/php/TokensTest.php' => ['PhanTypeObjectUnsetDeclaredProperty'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
