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
    // PhanTypeMismatchArgument : 20+ occurrences
    // PhanPluginDuplicateConditionalNullCoalescing : 10+ occurrences
    // PhanTypeMismatchReturnProbablyReal : 9 occurrences
    // PhanTypeMismatchArgumentInternal : 7 occurrences
    // PhanTypeMismatchArgumentProbablyReal : 6 occurrences
    // PhanDeprecatedFunction : 5 occurrences
    // PhanRedundantCondition : 4 occurrences
    // PhanTypePossiblyInvalidDimOffset : 3 occurrences
    // PhanPluginRedundantAssignment : 2 occurrences
    // PhanTypeConversionFromArray : 2 occurrences
    // PhanTypeMismatchArgumentNullableInternal : 2 occurrences
    // PhanTypeMismatchReturn : 2 occurrences
    // PhanParamTooMany : 1 occurrence
    // PhanPluginDuplicateAdjacentStatement : 1 occurrence
    // PhanPluginMixedKeyNoKey : 1 occurrence
    // PhanPossiblyNullTypeMismatchProperty : 1 occurrence
    // PhanPossiblyUndeclaredVariable : 1 occurrence
    // PhanTypeArraySuspiciousNullable : 1 occurrence
    // PhanTypeMismatchReturnNullable : 1 occurrence
    // PhanUndeclaredProperty : 1 occurrence
    // PhanUnreferencedUseNormal : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/class-wpcom-rest-api-v2-endpoint-forms.php' => ['PhanTypePossiblyInvalidDimOffset'],
        'src/contact-form/class-admin.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanPossiblyUndeclaredVariable', 'PhanRedundantCondition', 'PhanTypeArraySuspiciousNullable', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchReturn'],
        'src/contact-form/class-contact-form-field.php' => ['PhanParamTooMany', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanPossiblyNullTypeMismatchProperty', 'PhanTypeConversionFromArray', 'PhanTypeMismatchArgument', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredProperty'],
        'src/contact-form/class-contact-form-plugin.php' => ['PhanPluginDuplicateAdjacentStatement', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanPluginRedundantAssignment', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchReturnProbablyReal'],
        'src/contact-form/class-contact-form-shortcode.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchReturnProbablyReal'],
        'src/contact-form/class-contact-form.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanPluginRedundantAssignment', 'PhanRedundantCondition', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentNullableInternal', 'PhanTypeMismatchReturnNullable', 'PhanTypeMismatchReturnProbablyReal'],
        'src/dashboard/class-dashboard-view-switch.php' => ['PhanUnreferencedUseNormal'],
        'src/service/class-google-drive.php' => ['PhanTypeMismatchReturnProbablyReal'],
        'tests/php/contact-form/test-class.contact-form-plugin.php' => ['PhanPluginMixedKeyNoKey'],
        'tests/php/contact-form/test-class.contact-form.php' => ['PhanDeprecatedFunction'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
