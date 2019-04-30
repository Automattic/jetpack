### Loading legacy classes

Any classes placed under the "legacy" folder will be scanned and mapped for autoloading without requiring a namespace prefix.

You can regenerate the mapping from class names to files by running `composer dump-autoload`

```
// try loading a legacy class from Jetpack Core
$legacy = new Sample_Legacy_File();
$legacy->doit();

$foobar = new Foo_Bar();
$bazbee = new Baz_Bee();
```