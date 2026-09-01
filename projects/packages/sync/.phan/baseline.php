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
    // PhanTypeMismatchReturnProbablyReal : 25+ occurrences
    // PhanTypeMismatchReturn : 15+ occurrences
    // PhanParamSignatureMismatch : 10+ occurrences
    // PhanTypeMismatchArgumentProbablyReal : 10+ occurrences
    // PhanTypeExpectedObjectPropAccess : 8 occurrences
    // PhanPluginDuplicateSwitchCaseLooseEquality : 6 occurrences
    // PhanNonClassMethodCall : 3 occurrences
    // PhanTypeArraySuspiciousNullable : 3 occurrences
    // PhanTypePossiblyInvalidDimOffset : 3 occurrences
    // PhanImpossibleCondition : 2 occurrences
    // PhanTypeArraySuspicious : 2 occurrences
    // PhanTypeMismatchArgumentNullable : 2 occurrences
    // PhanTypeMismatchPropertyDefault : 2 occurrences
    // PhanTypeMismatchReturnNullable : 2 occurrences
    // PhanParamTooManyCallable : 1 occurrence
    // PhanPluginUseReturnValueInternalKnown : 1 occurrence
    // PhanTypeMismatchArgumentNullableInternal : 1 occurrence
    // PhanTypeMismatchDeclaredParam : 1 occurrence
    // PhanTypeMismatchDefault : 1 occurrence
    // PhanTypeMismatchProperty : 1 occurrence
    // PhanTypeMismatchPropertyProbablyReal : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-functions.php' => ['PhanTypePossiblyInvalidDimOffset'],
        'src/class-listener.php' => ['PhanNonClassMethodCall', 'PhanTypeArraySuspicious', 'PhanTypeExpectedObjectPropAccess', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal'],
        'src/class-lock.php' => ['PhanTypeMismatchReturn'],
        'src/class-queue.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentNullableInternal'],
        'src/class-replicastore.php' => ['PhanParamSignatureMismatch', 'PhanPluginDuplicateSwitchCaseLooseEquality', 'PhanTypeArraySuspiciousNullable', 'PhanTypeMismatchArgument', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnNullable'],
        'src/class-rest-endpoints.php' => ['PhanParamTooManyCallable', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal', 'PhanTypePossiblyInvalidDimOffset'],
        'src/class-rest-sender.php' => ['PhanTypeMismatchArgumentProbablyReal'],
        'src/class-sender.php' => ['PhanNonClassMethodCall', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchProperty', 'PhanTypeMismatchReturnProbablyReal'],
        'src/class-server.php' => ['PhanTypeMismatchDeclaredParam', 'PhanTypeMismatchReturnProbablyReal'],
        'src/class-settings.php' => ['PhanTypeMismatchArgumentProbablyReal'],
        'src/class-utils.php' => ['PhanTypeExpectedObjectPropAccess'],
        'src/modules/class-callables.php' => ['PhanParamSignatureMismatch', 'PhanTypeArraySuspicious', 'PhanTypeMismatchArgument'],
        'src/modules/class-comments.php' => ['PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal'],
        'src/modules/class-constants.php' => ['PhanParamSignatureMismatch'],
        'src/modules/class-full-sync-immediately.php' => ['PhanTypeMismatchReturn'],
        'src/modules/class-module.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchReturnProbablyReal'],
        'src/modules/class-network-options.php' => ['PhanParamSignatureMismatch'],
        'src/modules/class-options.php' => ['PhanParamSignatureMismatch', 'PhanTypeMismatchReturnProbablyReal'],
        'src/modules/class-posts.php' => ['PhanPluginUseReturnValueInternalKnown', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentNullable'],
        'src/modules/class-term-relationships.php' => ['PhanParamSignatureMismatch', 'PhanTypeMismatchArgument'],
        'src/modules/class-themes.php' => ['PhanParamSignatureMismatch', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal'],
        'src/modules/class-updates.php' => ['PhanImpossibleCondition', 'PhanParamSignatureMismatch', 'PhanTypeMismatchReturn'],
        'src/modules/class-users.php' => ['PhanTypeMismatchDefault', 'PhanTypeMismatchReturnProbablyReal'],
        'src/modules/class-woocommerce-hpos-orders.php' => ['PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal'],
        'src/replicastore/class-table-checksum.php' => ['PhanTypeMismatchPropertyDefault', 'PhanTypeMismatchPropertyProbablyReal'],
        'tests/php/Actions_Test.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal'],
        'tests/php/REST_Endpoints_Test.php' => ['PhanTypeMismatchReturn'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
