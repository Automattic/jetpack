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
    // PhanUndeclaredClassMethod : 45+ occurrences
    // PhanTypeMismatchArgument : 30+ occurrences
    // PhanUndeclaredClassProperty : 25+ occurrences
    // PhanTypeMismatchReturn : 15+ occurrences
    // PhanPluginDuplicateConditionalNullCoalescing : 10+ occurrences
    // PhanTypeArraySuspicious : 10+ occurrences
    // PhanTypeMismatchReturnProbablyReal : 10+ occurrences
    // PhanUndeclaredTypeParameter : 10+ occurrences
    // PhanUndeclaredTypeReturnType : 10+ occurrences
    // PhanUndeclaredFunction : 9 occurrences
    // PhanTypeMismatchArgumentInternal : 7 occurrences
    // PhanTypeMismatchArgumentProbablyReal : 7 occurrences
    // PhanDeprecatedFunction : 5 occurrences
    // PhanUndeclaredMethod : 5 occurrences
    // PhanPluginNeverReturnMethod : 4 occurrences
    // PhanRedundantCondition : 4 occurrences
    // PhanUndeclaredTypeProperty : 4 occurrences
    // PhanTypePossiblyInvalidDimOffset : 3 occurrences
    // PhanUnextractableAnnotationElementName : 3 occurrences
    // PhanParamSignatureMismatch : 2 occurrences
    // PhanPluginRedundantAssignment : 2 occurrences
    // PhanTypeConversionFromArray : 2 occurrences
    // PhanTypeMismatchArgumentNullableInternal : 2 occurrences
    // PhanTypeMismatchProperty : 2 occurrences
    // PhanUndeclaredClassReference : 2 occurrences
    // PhanUndeclaredConstant : 2 occurrences
    // PhanParamTooMany : 1 occurrence
    // PhanPluginDuplicateAdjacentStatement : 1 occurrence
    // PhanPluginMixedKeyNoKey : 1 occurrence
    // PhanPossiblyNullTypeMismatchProperty : 1 occurrence
    // PhanPossiblyUndeclaredVariable : 1 occurrence
    // PhanTypeArraySuspiciousNullable : 1 occurrence
    // PhanTypeMismatchPropertyProbablyReal : 1 occurrence
    // PhanTypeMismatchReturnNullable : 1 occurrence
    // PhanUndeclaredClassInCallable : 1 occurrence
    // PhanUndeclaredProperty : 1 occurrence
    // PhanUnreferencedUseNormal : 1 occurrence

    // Currently, file_suppressions and directory_suppressions are the only supported suppressions
    'file_suppressions' => [
        'src/blocks/contact-form/class-contact-form-block.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredFunction'],
        'src/class-wpcom-rest-api-v2-endpoint-forms.php' => ['PhanTypeArraySuspicious', 'PhanTypeMismatchReturn', 'PhanTypePossiblyInvalidDimOffset', 'PhanUndeclaredClassMethod', 'PhanUndeclaredFunction', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeReturnType'],
        'src/contact-form/class-admin.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanPluginNeverReturnMethod', 'PhanPossiblyUndeclaredVariable', 'PhanRedundantCondition', 'PhanTypeArraySuspiciousNullable', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchReturn', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassProperty', 'PhanUndeclaredConstant', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeReturnType'],
        'src/contact-form/class-contact-form-endpoint.php' => ['PhanParamSignatureMismatch', 'PhanTypeMismatchReturn', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeReturnType'],
        'src/contact-form/class-contact-form-field.php' => ['PhanParamTooMany', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanPossiblyNullTypeMismatchProperty', 'PhanTypeConversionFromArray', 'PhanTypeMismatchArgument', 'PhanTypeMismatchPropertyProbablyReal', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassProperty', 'PhanUndeclaredProperty', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeProperty'],
        'src/contact-form/class-contact-form-plugin.php' => ['PhanPluginDuplicateAdjacentStatement', 'PhanPluginDuplicateConditionalNullCoalescing', 'PhanPluginNeverReturnMethod', 'PhanPluginRedundantAssignment', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentInternal', 'PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchReturn', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassProperty', 'PhanUndeclaredClassReference', 'PhanUndeclaredFunction', 'PhanUndeclaredTypeReturnType'],
        'src/contact-form/class-contact-form-shortcode.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanTypeMismatchReturnProbablyReal'],
        'src/contact-form/class-contact-form.php' => ['PhanPluginDuplicateConditionalNullCoalescing', 'PhanPluginRedundantAssignment', 'PhanRedundantCondition', 'PhanTypeMismatchArgument', 'PhanTypeMismatchArgumentNullableInternal', 'PhanTypeMismatchProperty', 'PhanTypeMismatchReturnNullable', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassProperty', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeProperty', 'PhanUnextractableAnnotationElementName'],
        'src/contact-form/class-editor-view.php' => ['PhanUndeclaredClassInCallable', 'PhanUndeclaredClassProperty', 'PhanUndeclaredTypeParameter'],
        'src/contact-form/class-util.php' => ['PhanUndeclaredClassProperty', 'PhanUndeclaredTypeParameter'],
        'src/dashboard/class-dashboard-view-switch.php' => ['PhanUnreferencedUseNormal'],
        'src/dashboard/class-dashboard.php' => ['PhanUndeclaredClassMethod', 'PhanUndeclaredConstant'],
        'src/service/class-google-drive.php' => ['PhanTypeMismatchArgumentProbablyReal', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredClassMethod', 'PhanUndeclaredFunction'],
        'src/service/class-post-to-url.php' => ['PhanTypeMismatchArgument', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassProperty', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeReturnType'],
        'tests/php/contact-form/test-class.contact-form-plugin.php' => ['PhanPluginMixedKeyNoKey'],
        'tests/php/contact-form/test-class.contact-form.php' => ['PhanDeprecatedFunction', 'PhanTypeMismatchArgument', 'PhanTypeMismatchReturnProbablyReal', 'PhanUndeclaredClassMethod', 'PhanUndeclaredClassProperty', 'PhanUndeclaredMethod', 'PhanUndeclaredTypeParameter', 'PhanUndeclaredTypeReturnType'],
    ],
    // 'directory_suppressions' => ['src/directory_name' => ['PhanIssueName1', 'PhanIssueName2']] can be manually added if needed.
    // (directory_suppressions will currently be ignored by subsequent calls to --save-baseline, but may be preserved in future Phan releases)
];
