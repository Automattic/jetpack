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
    // PhanUndeclaredProperty : 30+ occurrences
    // PhanTypeMismatchArgument : 10+ occurrences
    // PhanUndeclaredClassMethod : 9 occurrences
    // PhanPossiblyUndeclaredVariable : 7 occurrences
    // PhanParamSignatureMismatch : 6 occurrences
    // PhanPluginDuplicateConditionalNullCoalescing : 6 occurrences
    // PhanTypeMismatchReturnProbablyReal : 6 occurrences
    // PhanUndeclaredTypeParameter : 6 occurrences
    // PhanTypeArraySuspiciousNullable : 5 occurrences
    // PhanTypeMismatchArgumentNullable : 5 occurrences
    // PhanUndeclaredMethod : 4 occurrences
    // PhanDeprecatedEncapsVar : 2 occurrences
    // PhanNonClassMethodCall : 2 occurrences
    // PhanPluginDuplicateCatchStatementBody : 2 occurrences
    // PhanTypeMismatchDeclaredParam : 2 occurrences
    // PhanUndeclaredClassStaticProperty : 2 occurrences
    // PhanUnextractableAnnotationElementName : 2 occurrences
    // PhanUnextractableAnnotationSuffix : 2 occurrences
    // PhanPluginDuplicateExpressionAssignmentOperation : 1 occurrence
    // PhanPluginUseReturnValueInternalKnown : 1 occurrence
    // PhanTypeMismatchArgumentProbablyReal : 1 occurrence
    // PhanUndeclaredFunction : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'data/example-external.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredClassStaticProperty', 'PhanUndeclaredFunction'],
        'scripts/core-calls.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchDeclaredParam', 'PhanUndeclaredClassMethod', 'PhanUndeclaredTypeParameter'],
        'scripts/core-definitions.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchDeclaredParam', 'PhanUndeclaredClassMethod', 'PhanUndeclaredTypeParameter'],
        'scripts/example.php' => ['PhanTypeMismatchArgumentProbablyReal'],
        'scripts/jetpack-slurper.php' => ['PhanDeprecatedEncapsVar'],
        'scripts/jetpack-svn.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeArraySuspiciousNullable'],
        'src/Declarations/class-declaration.php' => ['PhanUndeclaredProperty'],
        'src/Declarations/class-visitor.php' => ['PhanTypeMismatchArgument'],
        'src/Differences/class-class-const-missing.php' => ['PhanParamSignatureMismatch', 'PhanTypeMismatchArgument', 'PhanTypeMismatchReturnProbablyReal'],
        'src/Differences/class-class-const-moved.php' => ['PhanTypeMismatchArgument'],
        'src/Differences/class-class-method-deprecated.php' => ['PhanParamSignatureMismatch', 'PhanTypeMismatchReturnProbablyReal'],
        'src/Differences/class-class-method-missing.php' => ['PhanParamSignatureMismatch', 'PhanTypeMismatchArgument', 'PhanTypeMismatchReturnProbablyReal'],
        'src/Differences/class-class-missing.php' => ['PhanParamSignatureMismatch', 'PhanTypeMismatchArgument', 'PhanTypeMismatchReturnProbablyReal'],
        'src/Differences/class-class-property-missing.php' => ['PhanParamSignatureMismatch', 'PhanTypeMismatchReturnProbablyReal'],
        'src/Differences/class-function-deprecated.php' => ['PhanParamSignatureMismatch', 'PhanTypeMismatchReturnProbablyReal'],
        'src/Invocations/class-visitor.php' => ['PhanTypeMismatchArgument', 'PhanUndeclaredProperty'],
        'src/api/class-analyze-controller.php' => ['PhanPluginUseReturnValueInternalKnown'],
        'src/api/class-controller.php' => ['PhanUndeclaredMethod'],
        'src/api/class-model.php' => ['PhanTypeArraySuspiciousNullable'],
        'src/api/class-plugin-downloader.php' => ['PhanPluginDuplicateExpressionAssignmentOperation', 'PhanUndeclaredProperty'],
        'src/class-declarations.php' => ['PhanPluginDuplicateCatchStatementBody'],
        'src/class-differences.php' => ['PhanNonClassMethodCall', 'PhanPossiblyUndeclaredVariable', 'PhanTypeMismatchArgumentNullable'],
        'src/class-invocations.php' => ['PhanPluginDuplicateCatchStatementBody'],
        'src/class-utils.php' => ['PhanTypeMismatchArgument', 'PhanUndeclaredClassMethod', 'PhanUndeclaredMethod', 'PhanUndeclaredProperty', 'PhanUndeclaredTypeParameter', 'PhanUnextractableAnnotationElementName', 'PhanUnextractableAnnotationSuffix'],
        'src/class-warnings.php' => ['PhanUndeclaredMethod'],
        'src/diff-generator.php' => ['PhanDeprecatedEncapsVar'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
