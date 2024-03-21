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
    // PhanRedefineFunction : 4 occurrences
    // PhanTypeMismatchArgument : 3 occurrences
    // PhanTypeConversionFromArray : 2 occurrences
    // PhanMisspelledAnnotation : 1 occurrence
    // PhanParamTooFewInternalUnpack : 1 occurrence
    // PhanPluginDuplicateConditionalNullCoalescing : 1 occurrence
    // PhanTypeMismatchArgumentInternal : 1 occurrence
    // PhanTypeMismatchArgumentNullableInternal : 1 occurrence
    // PhanUndeclaredProperty : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        '.github/files/generate-ci-matrix.php' => ['PhanMisspelledAnnotation', 'PhanParamTooFewInternalUnpack', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchArgumentProbablyReal'],
        '.github/files/test-plugin-update/mu-plugin.php' => ['PhanRedefineFunction'],
        'tools/check-changelogger-use.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanRedefineFunction', 'PhanTypeConversionFromArray', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentNullableInternal', 'PhanTypeMismatchArgumentProbablyReal'],
        'tools/class-jetpack-phpcs-exclude-filter.php' => ['PhanUndeclaredProperty'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
