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
    // PhanDeprecatedFunction : 10+ occurrences
    // PhanTypeMismatchArgumentProbablyReal : 6 occurrences
    // PhanTypeMismatchArgument : 4 occurrences
    // PhanTypeMismatchReturnProbablyReal : 3 occurrences
    // PhanTypePossiblyInvalidDimOffset : 3 occurrences
    // PhanPluginDuplicateConditionalNullCoalescing : 2 occurrences
    // PhanPossiblyNullTypeMismatchProperty : 1 occurrence
    // PhanTypeMismatchArgumentInternal : 1 occurrence
    // PhanTypeMismatchArgumentNullable : 1 occurrence
    // PhanTypeMismatchArgumentNullableInternal : 1 occurrence
    // PhanTypeMismatchDeclaredParamNullable : 1 occurrence
    // PhanTypeMismatchForeach : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/AutoloadFileWriter.php' => ['PhanPluginDuplicateConditionalNullCoalescing'],
        'src/AutoloadGenerator.php' => ['PhanPossiblyNullTypeMismatchProperty', 'PhanTypeMismatchDeclaredParamNullable'],
        'src/AutoloadProcessor.php' => ['PhanTypeMismatchForeach', 'PhanTypeMismatchReturnProbablyReal'],
        'src/class-php-autoloader.php' => ['PhanTypeMismatchReturnProbablyReal'],
        'src/class-version-loader.php' => ['PhanPluginDuplicateConditionalNullCoalescing'],
        'tests/php/bootstrap.php' => ['PhanTypeMismatchArgumentInternal'],
        'tests/php/lib/class-acceptance-test-case.php' => ['PhanTypePossiblyInvalidDimOffset'],
        'tests/php/lib/class-test-plugin-factory.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchArgumentNullableInternal'],
        'tests/php/tests/acceptance/AutoloaderTest.php' => ['PhanTypeMismatchArgument'],
        'tests/php/tests/acceptance/CacheTest.php' => ['PhanTypeMismatchArgument'],
        'tests/php/tests/unit/AutoloadProcessorTest.php' => ['PhanTypeMismatchArgumentProbablyReal'],
        'tests/php/tests/unit/AutoloaderHandlerTest.php' => ['PhanDeprecatedFunction'],
        'tests/php/tests/unit/PHPAutoloaderTest.php' => ['PhanDeprecatedFunction'],
        'tests/php/tests/unit/PluginLocatorTest.php' => ['PhanDeprecatedFunction'],
        'tests/php/tests/unit/PluginsHandlerTest.php' => ['PhanDeprecatedFunction'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
