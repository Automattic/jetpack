## Jetpack Code Analyzer

Analyzes public classes, methods, variables and functions to search for breaking changes between versions

### Running

```
composer run example
```

### API

#### Declarations

This class represents a list of public declarations accumulated from one or more files.

Public declarations include:
- classes
- class methods (static and instance)
- public class properties
- functions

`Declarations` can find each declaration by scanning files and directories using `$declarations->scan( $dir, $exclude = array() )`.

You can `print`, `load`, and `save` those declarations as CSV.

You can also generate a list of differences between old and new code bases, e.g. Jetpack 7.4 and Jetpack 7.5, using `->find_differences( $previous_declarations )`, which returns an instance of `Automattic\Jetpack\Analyzer\Differences`.

```php
$declarations = new new Automattic\Jetpack\Analyzer\Declarations();

// single file
$declarations->scan( $base_path . '/class.jetpack.php' );

// OR recursively scan a directory
$exclude = array( '.git', 'vendor', 'tests', 'docker', 'bin', 'scss', 'images', 'docs', 'languages', 'node_modules' );
$declarations->scan( $base_path, $exclude );

// print the declarations
$declarations->print();

// save the declarations as CSV
$declarations->save( 'path/to/jetpack-master.csv' );

// load some other declarations
$jp74_declarations->load( 'path/to/jetpack-branch-7.4.csv' );

// find a list of differences, e.g. methods that are missing, or classes that have moved to a different relative path
$differences = $declarations->find_differences( $jp74_declarations );
```

#### Differences

A list of differences can be used to check compatibity against a set of invocations.

This is performed by parsing any external file looking for invocations. If those invocations match any functions, methods, classes or properties that have been changed between the two Jetpack versions, then a list of warnings or errors will be produced.

```php
$differences = $declarations->find_differences( $jp74_declarations );

// check compatibility of a single file
$differences->check_file_compatibility( 'path/to/a-file.php' );

// TODO warnings/errors API
```