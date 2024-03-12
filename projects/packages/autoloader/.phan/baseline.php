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
    // PhanUndeclaredClassMethod : 220+ occurrences
    // PhanUndeclaredClassReference : 75+ occurrences
    // PhanUndeclaredTypeProperty : 25+ occurrences
    // PhanUndeclaredTypeParameter : 15+ occurrences
    // PhanTypeMismatchArgumentProbablyReal : 10+ occurrences
    // PhanUndeclaredClassConstant : 9 occurrences
    // PhanTypeMismatchArgument : 7 occurrences
    // PhanTypeInvalidDimOffset : 6 occurrences
    // PhanTypeMismatchReturnProbablyReal : 3 occurrences
    // PhanTypePossiblyInvalidDimOffset : 3 occurrences
    // PhanDeprecatedFunction : 2 occurrences
    // PhanPluginDuplicateConditionalNullCoalescing : 2 occurrences
    // PhanRedefinedUsedTrait : 2 occurrences
    // PhanTypeMismatchArgumentNullableInternal : 2 occurrences
    // PhanUndeclaredInterface : 2 occurrences
    // PhanPossiblyNullTypeMismatchProperty : 1 occurrence
    // PhanTypeMismatchArgumentInternal : 1 occurrence
    // PhanTypeMismatchArgumentNullable : 1 occurrence
    // PhanTypeMismatchDeclaredParamNullable : 1 occurrence
    // PhanTypeMismatchDimFetchNullable : 1 occurrence
    // PhanTypeMismatchForeach : 1 occurrence
    // PhanUndeclaredClassInCallable : 1 occurrence
    // PhanUndeclaredExtendedClass : 1 occurrence
    // PhanUndeclaredProperty : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/AutoloadFileWriter.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanUndeclaredClassMethod', 'PhanUndeclaredTypeParameter'],
        'src/AutoloadGenerator.php' => ['PhanPossiblyNullTypeMismatchProperty', 'PhanTypeMismatchArgument', 'PhanTypeMismatchDeclaredParamNullable', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassReference', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeProperty'],
        'src/AutoloadProcessor.php' => ['PhanTypeMismatchForeach', 'PhanTypeMismatchReturnProbablyReal'],
        'src/CustomAutoloaderPlugin.php' => ['PhanUndeclaredClassConstant', 'PhanUndeclaredClassMethod', 'PhanUndeclaredInterface', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeProperty'],
        'src/class-php-autoloader.php' => ['PhanTypeMismatchReturnProbablyReal'],
        'src/class-version-loader.php' => ['PhanPluginDuplicateConditionalNullCoalescing'],
        'tests/php/bootstrap.php' => ['PhanTypeMismatchArgumentInternal'],
        'tests/php/lib/class-acceptance-test-case.php' => ['PhanTypePossiblyInvalidDimOffset', 'PhanUndeclaredClassConstant', 'PhanUndeclaredClassMethod'],
        'tests/php/lib/class-test-container.php' => ['PhanUndeclaredExtendedClass', 'PhanUndeclaredProperty'],
        'tests/php/lib/class-test-plugin-factory.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchArgumentNullableInternal', 'PhanTypeMismatchDimFetchNullable'],
        'tests/php/tests/acceptance/AutoloaderTest.php' => ['PhanTypeMismatchArgument', 'PhanUndeclaredClassReference'],
        'tests/php/tests/acceptance/CacheTest.php' => ['PhanTypeMismatchArgument', 'PhanUndeclaredClassReference'],
        'tests/php/tests/integration/LoadingGeneratedManifestsTest.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredTypeProperty'],
        'tests/php/tests/integration/VersionLoadingFromManifestTest.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredClassReference', 'PhanUndeclaredTypeProperty'],
        'tests/php/tests/unit/AutoloadProcessorTest.php' => ['PhanTypeMismatchArgumentProbablyReal'],
        'tests/php/tests/unit/AutoloaderHandlerTest.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredClassReference', 'PhanUndeclaredTypeProperty'],
        'tests/php/tests/unit/AutoloaderLocatorTest.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredTypeProperty'],
        'tests/php/tests/unit/AutoloaderTest.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassReference'],
        'tests/php/tests/unit/HookManagerTest.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredTypeProperty'],
        'tests/php/tests/unit/LatestAutoloaderGuardTest.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredClassReference', 'PhanUndeclaredTypeProperty'],
        'tests/php/tests/unit/ManifestReaderTest.php' => ['PhanTypeInvalidDimOffset', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassReference', 'PhanUndeclaredTypeProperty'],
        'tests/php/tests/unit/PHPAutoloaderTest.php' => ['PhanDeprecatedFunction', 'PhanTypeMismatchArgumentProbablyReal', 'PhanUndeclaredClassInCallable', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassReference'],
        'tests/php/tests/unit/PathProcessorTest.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredTypeProperty'],
        'tests/php/tests/unit/PluginLocatorTest.php' => ['PhanRedefinedUsedTrait', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassReference', 'PhanUndeclaredTypeProperty'],
        'tests/php/tests/unit/PluginsHandlerTest.php' => ['PhanRedefinedUsedTrait', 'PhanUndeclaredClassConstant', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassReference', 'PhanUndeclaredTypeProperty'],
        'tests/php/tests/unit/ShutdownHandlerTest.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredClassReference', 'PhanUndeclaredTypeProperty'],
        'tests/php/tests/unit/VersionLoaderTest.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredClassReference'],
        'tests/php/tests/unit/VersionSelectorTest.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredTypeProperty'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
