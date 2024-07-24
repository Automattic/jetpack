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
    // PhanDeprecatedFunction : 9 occurrences
    // PhanTypeMismatchArgument : 9 occurrences
    // PhanNoopNew : 6 occurrences
    // PhanTypeMismatchDefault : 5 occurrences
    // PhanTypeMismatchReturn : 5 occurrences
    // PhanTypeMismatchReturnProbablyReal : 5 occurrences
    // PhanUndeclaredConstant : 5 occurrences
    // PhanPluginDuplicateConditionalNullCoalescing : 4 occurrences
    // PhanRedefineFunction : 4 occurrences
    // PhanTypeMismatchArgumentInternal : 4 occurrences
    // PhanTypeMismatchArgumentProbablyReal : 4 occurrences
    // PhanPluginRedundantAssignment : 2 occurrences
    // PhanStaticCallToNonStatic : 2 occurrences
    // PhanTypeArraySuspiciousNullable : 2 occurrences
    // PhanTypeMismatchArgumentNullable : 2 occurrences
    // PhanCoalescingNeverNull : 1 occurrence
    // PhanImpossibleTypeComparison : 1 occurrence
    // PhanNonClassMethodCall : 1 occurrence
    // PhanParamTooMany : 1 occurrence
    // PhanPluginInvalidPregRegex : 1 occurrence
    // PhanTypeComparisonToArray : 1 occurrence
    // PhanTypeExpectedObjectPropAccess : 1 occurrence
    // PhanTypeInvalidDimOffset : 1 occurrence
    // PhanTypeMismatchArgumentNullableInternal : 1 occurrence
    // PhanTypeMismatchProperty : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/brute-force-protection/class-blocked-login-page.php' => ['PhanNonClassMethodCall', 'PhanTypeExpectedObjectPropAccess', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchDefault'],
        'src/brute-force-protection/class-math-fallback.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchDefault', 'PhanTypeMismatchProperty', 'PhanTypeMismatchReturnProbablyReal'],
        'src/brute-force-protection/class-shared-functions.php' => ['PhanTypeComparisonToArray', 'PhanTypeMismatchReturnProbablyReal'],
        'src/class-brute-force-protection.php' => ['PhanNoopNew', 'PhanStaticCallToNonStatic', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchArgumentNullable', 'PhanTypeMismatchReturn'],
        'src/class-compatibility.php' => ['PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentNullableInternal'],
        'src/class-waf-constants.php' => ['PhanCoalescingNeverNull', 'PhanUndeclaredConstant'],
        'src/class-waf-operators.php' => ['PhanTypeMismatchReturn'],
        'src/class-waf-rules-manager.php' => ['PhanTypeMismatchArgument'],
        'src/class-waf-runtime.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeArraySuspiciousNullable', 'PhanUndeclaredConstant'],
        'src/class-waf-transforms.php' => ['PhanPluginInvalidPregRegex', 'PhanTypeInvalidDimOffset'],
        'tests/php/integration/test-waf-compatibility.php' => ['PhanParamTooMany'],
        'tests/php/unit/functions-wordpress.php' => ['PhanRedefineFunction'],
        'tests/php/unit/test-waf-operators.php' => ['PhanTypeMismatchArgumentInternal'],
        'tests/php/unit/test-waf-runtime-targets.php' => ['PhanPluginRedundantAssignment'],
        'tests/php/unit/test-waf-runtime.php' => ['PhanImpossibleTypeComparison', 'PhanTypeMismatchArgument'],
        'tests/php/unit/test-waf-standalone-bootstrap.php' => ['PhanDeprecatedFunction', 'PhanNoopNew'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
