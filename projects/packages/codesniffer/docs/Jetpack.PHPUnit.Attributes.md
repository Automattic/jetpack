## Jetpack.PHPUnit.Attributes

PHPUnit 11 deprecated annotations like `@dataProvider method` in favor of attributes like `#[DataProvider( 'method' )]`.
This sniff will add missing attributes where annotations are present. Depending on the `keepAnnotations` property, it will also either remove the redundant annotations or add any missing annotations to correspond to the attributes.

> [!TIP]
> PHPUnit test classes and test case base classes are identified by the following:
>
> * Class name ends in "Test", "TestCase", "TestBase", "TestCaseBase", or "Suite".
> * Extends a class with a name ending in "Test", "TestCase", "TestBase", "TestCaseBase", or "Suite".
> * Extends `WP_UnitTestCase_Base` or any class with a name like `WP_Test_*_Case`, `WP_Test_*_Base`, or `WP_Test_*_Suite`.

### Messages

#### General messages

Fixable by phpcbf:

* `AnnotationFoundMissingAttribute`: Annotation `%s` is deprecated in PHPUnit 11 and removed in PHPUnit 12. Add attribute `%s` for compatibility with those versions.
* `AnnotationFoundMissingAttribute`: Annotation `%s` is deprecated in PHPUnit 11 and removed in PHPUnit 12. Replace it with attribute `%s`.
* `AttributeFoundMissingAnnotation`: For compatibility with older PHPUnit versions, add annotation `%s` to match the `%s` attribute.
* `RedundantAnnotationFound`: Annotation `%s` is deprecated in PHPUnit 11 and removed in PHPUnit 12.

Not fixable by phpcbf:

* `AttributeInvalidStringParameter`: Attribute `%s` parameter `%s` should be a constant single- or double-quoted string.
  * Note heredocs and nowdocs are not currently supported, and constants cannot be supported as phpcs cannot determine the correct value to check for a matching annotation.
* `AttributeMissingParameter`: Attribute `%s` is missing parameter `%s`.
* `AttributeNonStaticClassParameter`: Attribute `%s` parameter `%s` should be a class name, specified with `::class` or as a constant single- or double-quoted string.
  * Note heredocs and nowdocs are not currently supported, and constants cannot be supported as phpcs cannot determine the correct value to check for a matching annotation.
* `AttributeNonStaticClassParameter`: Attribute `%s` parameter `%s` uses `%s::class`, which this sniff cannot process.
* `InvalidAnnotation`: Failed to parse `%s` annotation.
* `InvalidAttribute`: Attribute `%s` requires a boolean value (`true` or `false`) for its `%s` parameter. Assuming `%s` here.
  * Note the attribute will still be processed. Common falsey values `null`, `0`, `""`, `''`, `"0"`, and `'0'` are recognized as such. Everything else, including falsey values such as `0x0`, are assumed to be true.
    Those unrecognized falsey values may result in spurious `AnnotationFoundMissingAttribute`, `AttributeFoundMissingAnnotation`, or `RedundantAnnotationFound` messages/fixes.
* `UselessAnnotation`: Annotation has no effect. To work, it must be `@%s enabled`.

#### Messages specific to certain attributes or annotations:

##### `@depends`:

Fixable by phpcbf:

* `DependsNotCloneFound`: Annotation `@depends !clone` only works with PHPUnit 10+, and does nothing beyond explicitly indicating lack of cloning. Remove the `!clone` for compatibility with PHPUnit 9 and earlier.
* `DependsNotCloneFound`: Annotation `@depends !shallowClone` only works with PHPUnit 10+, and does nothing beyond explicitly indicating lack of cloning. Remove the `!shallowClone` for compatibility with PHPUnit 9 and earlier.

##### `@excludeGlobalVariableFromBackup` and `@excludeStaticPropertyFromBackup`:

Fixable by phpcbf:

* `AnnotationFoundMissingAttribute`: Annotation `%s` only exists in PHPUnit 10+ and isn't even supported at the class level. Just use attribute `%s` instead.
* `AnnotationFoundMissingAttribute`: Annotation `%s` only exists in PHPUnit 10+. Just use attribute `%s` instead.
* `RedundantAnnotationFound`: Annotation `%s` only exists in PHPUnit 10+ and isn't even supported at the class level. There\'s no point in using it when you already have the corresponding attribute.
* `RedundantAnnotationFound`: Annotation `%s` only exists in PHPUnit 10+. There's no point in using it when you already have the corresponding attribute.

Not fixable by phpcbf:

* `InvalidAnnotation`: Annotation takes two parameters, like `@excludeStaticPropertyFromBackup class name`.

##### `@testWith`, `TestWith`, `TestWithJson`:

The correspondence between the annotation and attributes here is complex, hence many different messages for different kinds of parse errors.
In general, if `keepAnnotations` is false you can easily resolve many of these issues by manually verifying that the correct test cases are being run and then deleting the redundant `@testWith` annotation.

Fixable by phpcbf:

* `AnnotationFoundMissingAttribute`: Annotation `@testWith` is removed in PHPUnit 12. Add attributes `TestWith` or `TestWithJson` for compatibility with that and later versions.
* `AnnotationFoundMissingAttribute`: Annotation `@testWith` is removed in PHPUnit 12. Replace it with attributes `TestWith` or `TestWithJson`.
* `AttributeFoundMissingAnnotation`: For compatibility with older PHPUnit versions, add annotation `@testWith` to match the `TestWith` or `TestWithJson` attributes on this method.
* `RedundantAnnotationFound`: Annotation `%s` is removed in PHPUnit 12.

Not fixable by phpcbf:

* `MultipleTestWithAnnotationsFound`: This method has multiple `@testWith` annotations. PHPUnit will ignore all but the first.
* `TestWithAnnotationBadData`: Annotation `@testWith` has invalid data at line %d. PHPUnit will ignore everything after that line.
* `TestWithAnnotationBadData`: Annotation `@testWith` has invalid data at line %d. PHPUnit will reject the annotation.
* `TestWithAttributeBadData`: Attribute `%s` requires an array, got %s.
* `TestWithAttributeBadData`: Attribute `TestWith` has unparseable data.
* `TestWithAttributeBadData`: Attribute `TestWithJson` has invalid JSON.
* `TestWithAttributeBadData`: Attribute `%s` is being passed %s, which cannot be represented as a `@testWith` annotation.
* `TestWithAttributeNonJson`: Attribute `%s` is being passed %s, which cannot be represented as a `@testWith` annotation. Please manually verify that the annotation and attribute data match.
* `TestWithAttributeNonStatic`: Attribute `TestWith` has data that this sniff cannot interpret (found %s). Please manually verify that the annotation and attribute data match.
  * Only a subset of PHP syntax is recognized by the sniff. Anything unrecognized will raise the `TestWithAttributeNonStatic` warning.
    Note that heredocs are not supported (but nowdocs are), and constants cannot be supported as phpcs cannot determine the correct value to check for a matching annotation.
* `TestWithDataMismatch`: The data in the `@testWith` annotation on this method does not match the data from `TestWith` and `TestWithJson` annotations.

##### Code coverage annotations and attributes:

Not fixable by phpcbf:

* `MultipleCoversDefaultClassAnnotationsFound`: This class has multiple `@coversDefaultClass` annotations. PHPUnit will throw an error about this.
* `MultipleUsesDefaultClassAnnotationsFound`: This class has multiple `@usesDefaultClass` annotations. PHPUnit will throw an error about this.
  * Note these errors prevent processing of any corresponding coverage annotations or attributes on the specified class, since without knowing the intended default class the sniff can't know how to interpret annotations like `@covers ::method`.

### Configuration

```xml
<rule ref="Jetpack.PHPUnit.Attributes">
	<properties>
		<property name="keepAnnotations" value="true" />
		<property name="attributeNaming" value="add-alias" />
	</properties>
</rule>
```

* `keepAnnotations`: `boolean`, default true. If true, annotations will be added to correspond to any attributes found. If false, recognized annotations will be removed.
  If you need to run your tests in PHPUnit <=9, this should be true. If you only use PHPUnit 10+, you can set it false to clean things up.
* `attributeNaming`: `string`, default "add-alias". Controls whether added attributes will use short names like `#[Test]` or fully-qualified names like `#[\PHPUnit\Framework\Attribute\Test]`.
  * add-alias: Add `use` directives to use short names whenever possible. Long names will only be used if there's already a conflicting `use` present.
  * use-alias: Use short names if a `use` directive already exists, otherwise use long names.
  * fully-qualify: Always use long names, even if `use` directives exist.
