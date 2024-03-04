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
    // PhanTypeMismatchArgument : 30+ occurrences
    // PhanUndeclaredClassMethod : 25+ occurrences
    // PhanUndeclaredMethod : 25+ occurrences
    // PhanRedefinedUsedTrait : 20+ occurrences
    // PhanMisspelledAnnotation : 10+ occurrences
    // PhanParamTooMany : 10+ occurrences
    // PhanDeprecatedFunction : 9 occurrences
    // PhanTypeMismatchArgumentProbablyReal : 9 occurrences
    // PhanTypePossiblyInvalidDimOffset : 7 occurrences
    // PhanUndeclaredProperty : 5 occurrences
    // PhanTypeMismatchProperty : 4 occurrences
    // PhanTypeMismatchArgumentNullableInternal : 3 occurrences
    // PhanUndeclaredTypeParameter : 3 occurrences
    // PhanUndeclaredTypeReturnType : 3 occurrences
    // PhanNoopNew : 2 occurrences
    // PhanParamSignatureRealMismatchHasNoParamType : 2 occurrences
    // PhanTypeArraySuspiciousNullable : 2 occurrences
    // PhanTypeInvalidDimOffset : 2 occurrences
    // PhanUndeclaredMethodInCallable : 2 occurrences
    // PhanTypeInvalidLeftOperandOfNumericOp : 1 occurrence
    // PhanTypeInvalidRightOperandOfNumericOp : 1 occurrence
    // PhanTypeMismatchArgumentInternal : 1 occurrence
    // PhanTypeMismatchArgumentSuperType : 1 occurrence
    // PhanTypeMismatchDimFetchNullable : 1 occurrence
    // PhanTypeMismatchReturn : 1 occurrence
    // PhanTypeNoAccessiblePropertiesForeach : 1 occurrence
    // PhanUndeclaredClassReference : 1 occurrence
    // PhanUndeclaredTypeThrowsType : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'lib/ChangeEntry.php' => ['PhanMisspelledAnnotation'],
        'lib/ChangelogEntry.php' => ['PhanMisspelledAnnotation', 'PhanTypeMismatchDimFetchNullable'],
        'lib/KeepAChangelogParser.php' => ['PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeNoAccessiblePropertiesForeach'],
        'lib/Parser.php' => ['PhanMisspelledAnnotation'],
        'src/AddCommand.php' => ['PhanTypeMismatchArgumentSuperType', 'PhanUndeclaredMethod'],
        'src/Application.php' => ['PhanUndeclaredMethod', 'PhanUndeclaredMethodInCallable'],
        'src/CommandLoader.php' => ['PhanParamSignatureRealMismatchHasNoParamType'],
        'src/Config.php' => ['PhanTypeMismatchArgumentNullableInternal', 'PhanUndeclaredTypeReturnType'],
        'src/FormatterPlugin.php' => ['PhanMisspelledAnnotation'],
        'src/PluginTrait.php' => ['PhanUndeclaredMethod'],
        'src/Plugins/SemverVersioning.php' => ['PhanTypeInvalidLeftOperandOfNumericOp', 'PhanTypeInvalidRightOperandOfNumericOp', 'PhanUndeclaredClassMethod', 'PhanUndeclaredMethod', 'PhanUndeclaredMethodInCallable', 'PhanUndeclaredTypeParameter'],
        'src/Plugins/WordpressVersioning.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanUndeclaredTypeParameter'],
        'src/SquashCommand.php' => ['PhanTypeMismatchProperty', 'PhanUndeclaredClassMethod'],
        'src/Utils.php' => ['PhanTypeInvalidDimOffset'],
        'src/ValidateCommand.php' => ['PhanTypeArraySuspiciousNullable', 'PhanTypePossiblyInvalidDimOffset', 'PhanUndeclaredProperty'],
        'src/VersionCommand.php' => ['PhanTypeMismatchArgument', 'PhanUndeclaredClassMethod', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeThrowsType'],
        'src/WriteCommand.php' => ['PhanParamTooMany', 'PhanTypeMismatchProperty', 'PhanUndeclaredClassMethod', 'PhanUndeclaredMethod'],
        'tests/php/includes/lib/ParserTestCase.php' => ['PhanRedefinedUsedTrait', 'PhanTypePossiblyInvalidDimOffset'],
        'tests/php/includes/src/CommandTestCase.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchReturn', 'PhanUndeclaredTypeReturnType'],
        'tests/php/tests/lib/ChangeEntryTest.php' => ['PhanNoopNew', 'PhanRedefinedUsedTrait', 'PhanTypeMismatchArgument'],
        'tests/php/tests/lib/ChangelogEntryTest.php' => ['PhanNoopNew', 'PhanRedefinedUsedTrait', 'PhanTypeMismatchArgument'],
        'tests/php/tests/lib/ChangelogTest.php' => ['PhanRedefinedUsedTrait', 'PhanTypeMismatchArgument'],
        'tests/php/tests/lib/ParserTest.php' => ['PhanTypeMismatchArgumentProbablyReal', 'PhanUndeclaredMethod'],
        'tests/php/tests/src/AddCommandTest.php' => ['PhanRedefinedUsedTrait'],
        'tests/php/tests/src/ApplicationTest.php' => ['PhanRedefinedUsedTrait', 'PhanTypeInvalidDimOffset', 'PhanTypeMismatchArgument'],
        'tests/php/tests/src/CommandLoaderTest.php' => ['PhanRedefinedUsedTrait'],
        'tests/php/tests/src/ConfigTest.php' => ['PhanRedefinedUsedTrait', 'PhanUndeclaredClassReference'],
        'tests/php/tests/src/PluginTraitTest.php' => ['PhanUndeclaredMethod'],
        'tests/php/tests/src/Plugins/SemverVersioningTest.php' => ['PhanDeprecatedFunction', 'PhanParamTooMany', 'PhanRedefinedUsedTrait', 'PhanTypeMismatchArgument', 'PhanUndeclaredMethod'],
        'tests/php/tests/src/Plugins/WordpressVersioningTest.php' => ['PhanDeprecatedFunction', 'PhanParamTooMany', 'PhanRedefinedUsedTrait', 'PhanTypeMismatchArgument', 'PhanUndeclaredMethod'],
        'tests/php/tests/src/SquashCommandTest.php' => ['PhanDeprecatedFunction', 'PhanRedefinedUsedTrait', 'PhanTypeMismatchArgument', 'PhanUndeclaredClassMethod', 'PhanUndeclaredMethod'],
        'tests/php/tests/src/UtilsTest.php' => ['PhanDeprecatedFunction', 'PhanRedefinedUsedTrait', 'PhanTypeMismatchArgument', 'PhanUndeclaredProperty'],
        'tests/php/tests/src/ValidateCommandTest.php' => ['PhanRedefinedUsedTrait'],
        'tests/php/tests/src/VersionCommandTest.php' => ['PhanRedefinedUsedTrait'],
        'tests/php/tests/src/WriteCommandTest.php' => ['PhanDeprecatedFunction', 'PhanRedefinedUsedTrait', 'PhanTypeMismatchArgument', 'PhanUndeclaredClassMethod', 'PhanUndeclaredMethod'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
