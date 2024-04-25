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
    // PhanUndeclaredClassMethod : 30+ occurrences
    // PhanPluginDuplicateConditionalNullCoalescing : 10+ occurrences
    // PhanTypeMismatchReturnProbablyReal : 9 occurrences
    // PhanTypeMismatchArgumentInternal : 7 occurrences
    // PhanUndeclaredClassProperty : 7 occurrences
    // PhanTypeMismatchArgumentProbablyReal : 6 occurrences
    // PhanDeprecatedFunction : 5 occurrences
    // PhanRedundantCondition : 4 occurrences
    // PhanUndeclaredTypeParameter : 4 occurrences
    // PhanTypeMismatchReturn : 3 occurrences
    // PhanTypePossiblyInvalidDimOffset : 3 occurrences
    // PhanUnextractableAnnotationElementName : 3 occurrences
    // PhanPluginRedundantAssignment : 2 occurrences
    // PhanTypeConversionFromArray : 2 occurrences
    // PhanTypeMismatchArgumentNullableInternal : 2 occurrences
    // PhanUndeclaredFunction : 2 occurrences
    // PhanUndeclaredTypeReturnType : 2 occurrences
    // PhanParamTooMany : 1 occurrence
    // PhanPluginDuplicateAdjacentStatement : 1 occurrence
    // PhanPluginMixedKeyNoKey : 1 occurrence
    // PhanPossiblyNullTypeMismatchProperty : 1 occurrence
    // PhanPossiblyUndeclaredVariable : 1 occurrence
    // PhanTypeArraySuspiciousNullable : 1 occurrence
    // PhanTypeMismatchProperty : 1 occurrence
    // PhanTypeMismatchPropertyProbablyReal : 1 occurrence
    // PhanTypeMismatchReturnNullable : 1 occurrence
    // PhanUndeclaredConstant : 1 occurrence
    // PhanUndeclaredProperty : 1 occurrence
    // PhanUndeclaredTypeProperty : 1 occurrence
    // PhanUnreferencedUseNormal : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/blocks/contact-form/class-contact-form-block.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredFunction'],
        'src/class-wpcom-rest-api-v2-endpoint-forms.php' => ['PhanTypePossiblyInvalidDimOffset', 'PhanUndeclaredFunction'],
        'src/contact-form/class-admin.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanPossiblyUndeclaredVariable', 'PhanRedundantCondition', 'PhanTypeArraySuspiciousNullable', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchReturn', 'PhanUndeclaredClassMethod'],
        'src/contact-form/class-contact-form-field.php' => ['PhanParamTooMany', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanPossiblyNullTypeMismatchProperty', 'PhanTypeConversionFromArray', 'PhanTypeMismatchArgument', 'PhanTypeMismatchPropertyProbablyReal', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredClassMethod', 'PhanUndeclaredProperty'],
        'src/contact-form/class-contact-form-plugin.php' => ['PhanPluginDuplicateAdjacentStatement', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanPluginRedundantAssignment', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredClassMethod'],
        'src/contact-form/class-contact-form-shortcode.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchReturnProbablyReal'],
        'src/contact-form/class-contact-form.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanPluginRedundantAssignment', 'PhanRedundantCondition', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentNullableInternal', 'PhanTypeMismatchProperty', 'PhanTypeMismatchReturnNullable', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassProperty', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeProperty', 'PhanUnextractableAnnotationElementName'],
        'src/dashboard/class-dashboard-view-switch.php' => ['PhanUnreferencedUseNormal'],
        'src/dashboard/class-dashboard.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredConstant'],
        'src/service/class-google-drive.php' => ['PhanTypeMismatchReturnProbablyReal'],
        'tests/php/contact-form/test-class.contact-form-plugin.php' => ['PhanPluginMixedKeyNoKey'],
        'tests/php/contact-form/test-class.contact-form.php' => ['PhanDeprecatedFunction', 'PhanTypeMismatchArgument', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassProperty', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeReturnType'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
