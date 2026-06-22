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
    // PhanTypeMismatchReturn : 15+ occurrences
    // PhanTypeMismatchPropertyProbablyReal : 9 occurrences
    // PhanTypeMismatchReturnProbablyReal : 8 occurrences
    // PhanTypeArraySuspiciousNullable : 5 occurrences
    // PhanTypeMismatchArgumentProbablyReal : 4 occurrences
    // PhanTypeMismatchDefault : 4 occurrences
    // PhanDeprecatedFunction : 2 occurrences
    // PhanNonClassMethodCall : 2 occurrences
    // PhanPluginUnreachableCode : 2 occurrences
    // PhanTypeMismatchPropertyDefault : 2 occurrences
    // PhanTypeObjectUnsetDeclaredProperty : 2 occurrences
    // PhanTypePossiblyInvalidDimOffset : 2 occurrences
    // PhanTypeMismatchArgumentNullable : 1 occurrence
    // PhanTypeMismatchDeclaredParamNullable : 1 occurrence
    // PhanTypeMismatchReturnNullable : 1 occurrence
    // PhanUndeclaredClassMethod : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'legacy/class-jetpack-options.php' => ['PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchArgumentProbablyReal'],
        'legacy/class-jetpack-tracks-client.php' => ['PhanNonClassMethodCall', 'PhanTypeMismatchArgument', 'PhanTypeMismatchPropertyProbablyReal'],
        'legacy/class-jetpack-xmlrpc-server.php' => ['PhanTypeMismatchDefault', 'PhanTypeMismatchReturn'],
        'src/class-error-handler.php' => ['PhanTypeMismatchReturnProbablyReal'],
        'src/class-heartbeat.php' => ['PhanTypeMismatchPropertyDefault'],
        'src/class-manager.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchDeclaredParamNullable', 'PhanTypeMismatchDefault', 'PhanTypeMismatchPropertyProbablyReal', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnNullable', 'PhanTypeMismatchReturnProbablyReal'],
        'src/class-partner.php' => ['PhanTypeMismatchPropertyProbablyReal'],
        'src/class-rest-authentication.php' => ['PhanTypeMismatchPropertyDefault', 'PhanTypeMismatchPropertyProbablyReal'],
        'src/class-rest-connector.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchReturnProbablyReal'],
        'src/class-secrets.php' => ['PhanNonClassMethodCall', 'PhanTypeMismatchArgument'],
        'src/class-server-sandbox.php' => ['PhanTypeMismatchArgument'],
        'src/class-tokens.php' => ['PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal'],
        'src/class-tracking.php' => ['PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchDefault', 'PhanTypePossiblyInvalidDimOffset'],
        'src/sso/class-sso.php' => ['PhanTypeMismatchArgument'],
        'src/sso/class-user-admin.php' => ['PhanPluginUnreachableCode', 'PhanTypeMismatchArgument'],
        'src/webhooks/class-authorize-redirect.php' => ['PhanUndeclaredClassMethod'],
        'tests/php/Error_Handler_Test.php' => ['PhanTypeMismatchArgument'],
        'tests/php/Jetpack_XMLRPC_Server_Test.php' => ['PhanTypeMismatchArgument'],
        'tests/php/ManagerTest.php' => ['PhanDeprecatedFunction', 'PhanTypeArraySuspiciousNullable', 'PhanTypeObjectUnsetDeclaredProperty'],
        'tests/php/Nonce_Handler_Test.php' => ['PhanTypeMismatchArgument'],
        'tests/php/REST_Authentication_Test.php' => ['PhanTypeMismatchArgument'],
        'tests/php/REST_Endpoints_Test.php' => ['PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal'],
        'tests/php/Server_Sandbox_Test.php' => ['PhanTypeArraySuspiciousNullable'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
