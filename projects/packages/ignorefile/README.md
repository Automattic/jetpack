# ignorefile

This small library allows for processing of `.gitignore`-style files in PHP.

It follows the documentation at [gitignore], even in cases where git itself does not.

## Installation

Require using `composer require automattic/ignorefile`.

## Usage

```php
// Read a .myignore file.
$ignore = new IgnoreFile();
$ignore->add( file_get_contents( '.myignore' ) );

// Test if a file is ignored.
if ( $ignore->ignores( $filename ) ) {
        echo "$filename is ignored\n";
} else {
        echo "$filename is not ignored\n";
}

// Filter ignored files from an array of files.
$filesToProcess = $ignore->filter( $allFiles );

// Load all .myignore files in a directory tree, then list all non-ignored files.
$ignore = new IgnoreFile();
$iter = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( '.' ) );
foreach ( $iter as $path ) {
        if ( basename( $path ) === '.myignore' ) {
                $ignore->add( file_get_contents( $path ), dirname( $path ) . '/' );
        }
}

$iter = new RecursiveIteratorIterator(
    $ignore->filterIterator( new RecursiveDirectoryIterator( '.' ) )
);
foreach ( $iter as $file ) {
        echo "$file\n";
}
```

## Known incompatibilities with git

As of git 2.32.0-rc0.

The [gitignore documentation](gitignore) refers to [fnmatch] for specifics of `*`, `?`, and bracket expressions.
That in turn refers to a few other documents.

| Pattern    | Documented | Git
|:-----------|:-----------|:----
| `a.[`      | Matches `a.[`, per [§2.13.1] "Otherwise, '[' shall match the character itself." | Never matches anything. Git aborts on unclosed bracket.
| `a.[x`     | Matches `a.[x`, as above. | Never matches anything, as above.
| `a.[x\\]`  | Matches `a.[x]`, as above. | Never matches anything, as above.
| `a.[]`     | Matches `a.[]`, as above. | Never matches anything, as above.
| `a.[\\]`   | Matches `a.[]`, as above. | Never matches anything, as above.
| `a.[!]`    | Matches `a.[!]`, as above. | Never matches anything, as above.
| `a.[z-a]`  | Either matches nothing or is an error, per [§9.3.5] "If the represented set of collating elements is empty, it is unspecified whether the expression matches nothing, or is treated as invalid." | Matches `a.z`.

## Inspiration

I needed something similar to [the npm module `ignore`](https://www.npmjs.com/package/ignore) for PHP, but couldn't find one.
So I wrote one, copying the fairly comprehensive set of tests to make sure my implementation was accurate.

[gitignore]: https://github.com/git/git/blob/5d5b1473453400224ebb126bf3947e0a3276bdf5/Documentation/gitignore.txt
[fnmatch]: https://pubs.opengroup.org/onlinepubs/9699919799/functions/fnmatch.html
[§2.13.1]: https://pubs.opengroup.org/onlinepubs/9699919799/utilities/V3_chap02.html#tag_18_13_01
[§9.3.5]: https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap09.html#tag_09_03_05
