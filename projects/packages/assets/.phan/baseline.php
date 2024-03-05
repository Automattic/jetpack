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
    // PhanTypeMismatchArgument : 10+ occurrences
    // PhanDeprecatedFunction : 5 occurrences
    // PhanRedefinedUsedTrait : 3 occurrences
    // PhanParamTooFewUnpack : 2 occurrences
    // PhanImpossibleTypeComparison : 1 occurrence
    // PhanParamTooMany : 1 occurrence
    // PhanTypeInvalidLeftOperandOfNumericOp : 1 occurrence
    // PhanTypeInvalidRightOperandOfNumericOp : 1 occurrence
    // PhanUndeclaredClassReference : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-assets.php' => ['PhanDeprecatedFunction', 'PhanTypeMismatchArgument'],
        'src/class-semver.php' => ['PhanTypeInvalidLeftOperandOfNumericOp', 'PhanTypeInvalidRightOperandOfNumericOp'],
        'tests/php/test-assets.php' => ['PhanDeprecatedFunction', 'PhanImpossibleTypeComparison', 'PhanParamTooFewUnpack', 'PhanParamTooMany', 'PhanRedefinedUsedTrait', 'PhanTypeMismatchArgument', 'PhanUndeclaredClassReference'],
        'tests/php/test-semver.php' => ['PhanRedefinedUsedTrait'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
