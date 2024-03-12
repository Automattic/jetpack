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
    // PhanTypeMismatchArgumentProbablyReal : 50+ occurrences
    // PhanUndeclaredTypeParameter : 15+ occurrences
    // PhanUndeclaredClassMethod : 10+ occurrences
    // PhanTypeMismatchReturn : 5 occurrences
    // PhanRedefineFunction : 4 occurrences
    // PhanTypeMismatchArgument : 3 occurrences
    // PhanUndeclaredConstant : 3 occurrences
    // PhanTypeConversionFromArray : 2 occurrences
    // PhanTypeMismatchArgumentNullableInternal : 2 occurrences
    // PhanUndeclaredClassConstant : 2 occurrences
    // PhanUndeclaredInterface : 2 occurrences
    // PhanMisspelledAnnotation : 1 occurrence
    // PhanNoopNew : 1 occurrence
    // PhanParamTooFewInternalUnpack : 1 occurrence
    // PhanPluginDuplicateConditionalNullCoalescing : 1 occurrence
    // PhanPluginNeverReturnFunction : 1 occurrence
    // PhanTypeMismatchArgumentInternal : 1 occurrence
    // PhanUndeclaredProperty : 1 occurrence
    // PhanUndeclaredTypeProperty : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        '.github/actions/tool-setup/composer-plugin/src/Plugin.php' => ['PhanUndeclaredClassConstant', 'PhanUndeclaredClassMethod', 'PhanUndeclaredInterface', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeProperty'],
        '.github/files/generate-ci-matrix.php' => ['PhanMisspelledAnnotation', 'PhanParamTooFewInternalUnpack', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchArgumentProbablyReal'],
        '.github/files/test-plugin-update/mu-plugin.php' => ['PhanRedefineFunction'],
        'tools/check-changelogger-use.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanPluginNeverReturnFunction', 'PhanRedefineFunction', 'PhanTypeConversionFromArray', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentNullableInternal', 'PhanTypeMismatchArgumentProbablyReal'],
        'tools/class-jetpack-phpcs-exclude-filter.php' => ['PhanUndeclaredProperty'],
        'tools/e2e-commons/plugins/e2e-beta-autoupdate-api.php' => ['PhanNoopNew', 'PhanUndeclaredClassMethod', 'PhanUndeclaredConstant'],
        'tools/e2e-commons/plugins/e2e-plan-data-interceptor.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredTypeParameter'],
        'tools/e2e-commons/plugins/e2e-plugin-updater.php' => ['PhanTypeMismatchReturn', 'PhanUndeclaredConstant'],
        'tools/e2e-commons/plugins/e2e-search-test-helper.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredTypeParameter'],
        'tools/e2e-commons/plugins/e2e-waf-data-interceptor.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredTypeParameter'],
        'tools/e2e-commons/plugins/e2e-wpcom-request-interceptor.php' => ['PhanUndeclaredTypeParameter'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
