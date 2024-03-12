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
    // PhanRedefinedClassReference : 4 occurrences
    // PhanPluginDuplicateConditionalNullCoalescing : 2 occurrences
    // PhanRedefinedUsedTrait : 2 occurrences
    // PhanUnextractableAnnotationSuffix : 2 occurrences
    // PhanPluginSimplifyExpressionBool : 1 occurrence
    // PhanRedefineClass : 1 occurrence
    // PhanTypeMismatchReturn : 1 occurrence
    // UnusedPluginSuppression : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'Jetpack/Sniffs/Constants/MasterUserConstantSniff.php' => ['PhanUnextractableAnnotationSuffix'],
        'Jetpack/Sniffs/Functions/I18nSniff.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanUnextractableAnnotationSuffix'],
        'Jetpack/Sniffs/Functions/SetCookieSniff.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanPluginSimplifyExpressionBool'],
        'hacks/PHPUnitTestTrait.php' => ['PhanRedefineClass', 'PhanRedefinedClassReference', 'UnusedPluginSuppression'],
        'tests/php/tests/test-jetpack-compat.php' => ['PhanRedefinedUsedTrait', 'PhanTypeMismatchReturn'],
        'tests/php/tests/test-jetpackstandard.php' => ['PhanRedefinedUsedTrait'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
