## Jetpack Code Analyzer

Analyzes public classes, methods, variables and functions to search for breaking changes between versions

### Running

```
composer run example
```

### API

#### Analyzer

The analyzer finds public classes, class methods (static and instance) and public properties.

It returns and instance `Automattic\Jetpack\Analyzer\Declarations` which can be saved to a file or reused in context later.

```php
use Automattic\Jetpack\Analyzer\Analyzer as PHP_Analyzer;

$base_path = 'path/to/jetpack';

// scan a whole directory
$declarations = $analyzer->scan();

// scan a single file
$file_declarations = $analyzer->file( $base_path . '/class.jetpack.php' );
$file_declarations->save( 'path/to/jetpack-master-class.jetpack.php.csv' );
```

#### Declarations

This class represents a list of declarations accumulated from one or more files. It is produced by the Analyzer.

You can print, load, and save those declarations as CSV.

You can also generate a list of differences between old and new code bases, e.g. Jetpack 7.4 and Jetpack 7.5, using `->find_differences( $previous_declarations )`, which returns an instance of `Automattic\Jetpack\Analyzer\Differences`.

```php
$declarations = $analyzer->scan();

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