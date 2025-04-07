## Jetpack.PHPUnit.TestMethodCovers

PHPUnit 11 has effectively deprecated code coverage at the test-method level, in that the `@covers` and `@uses` annotations are deprecated in favor of attributes and the attributes may only be used at the class level.

This sniff will flag uses of `@covers` or `@uses` on methods in test classes. When fixing, the manner of fix is selected by the `fixCovers` and `fixUses` configuration options.

> [!WARNING]
> If you have some methods with `@covers` and some without, the movement of `@covers` to the class level may reduce coverage. If this is a concern, you may want to disable fixes for this sniff in your configuration.
> ```xml
> <rule ref="Jetpack.PHPUnit.TestMethodCovers" phpcbf-only="true">
>     <exclude name="Jetpack.PHPUnit.TestMethodCovers" />
> </rule>
> ```

> [!TIP]
> PHPUnit test classes and test case base classes are identified by the following:
>
> * Class name ends in "Test", "TestCase", "TestBase", "TestCaseBase", or "Suite".
> * Extends a class with a name ending in "Test", "TestCase", "TestBase", "TestCaseBase", or "Suite".
> * Extends `WP_UnitTestCase_Base` or any class with a name like `WP_Test_*_Case`, `WP_Test_*_Base`, or `WP_Test_*_Suite`.

### Messages

* `CoversFound`: Use of `@covers` on test methods is deprecated in PHPUnit 11 and removed in PHPUnit 12.
* `UsesFound`: Use of `@uses` on test methods is deprecated in PHPUnit 11 and removed in PHPUnit 12.

### Configuration

```xml
<rule ref="Jetpack.PHPUnit.TestMethodCovers">
	<properties>
		<property name="fixCovers" value="preserve-class" />
		<property name="fixUses" value="preserve" />
	</properties>
</rule>
```

* `fixCovers`: `string`, default "preserve-class". One of the following options:
  * remove: Remove the method-level `@covers`, without adding anything to the class's doc comment.
  * preserve: Move any method-level `@covers` to the containing class's doc comment.
  * preserve-class: Convert `@covers SomeClass::a_method` on the method level (including `@covers ::a_method` affected by `@coversDefaultClass`) to `@covers SomeClass` at the class level. Other `@covers` are preserved as-is.
* `fixUses`: `string`, default "preserve". Same options as for `fixCovers.
