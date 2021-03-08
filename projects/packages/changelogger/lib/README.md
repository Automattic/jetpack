# Jetpack Changelog library

This library provides objects to represent a changelog and its components, and an interface for
parsing changelog files to the object representation and writing changelog objects back as files.

It also provides an implementation of the parser interface for the changelog format defined by
https://keepachangelog.com/en/1.0.0/.

## Usage

```php
use Automatic\Jetpack\Changelog\KeepAChangelogParser;

$parser = new KeepAChangelogParser();

# Read an existing changelog.
$changelog = $parser->parseFromFile( 'CHANGELOG.md' );

# Create a new entry for version 2.0.0, and prepend it to the changelog.
$entry = $parser->newChangelogEntry( '2.0.0' );
$changelog->addEntry( $entry );

# Add some changes to version 2.0.0.
$entry->addChange(
	$parser->newChangeEntry( array(
		'significance' => 'minor',
		'subheading' => 'Added',
		'content' => 'Added new features.',
	) )
);
$entry->addChange(
	$parser->newChangeEntry( array(
		'significance' => 'major',
		'subheading' => 'Removed',
		'content' => 'Added deprecated features.',
	) )
);

# Write the updated changelog out.
$parser->formatToFile( 'CHANGELOG.md', $changelog );
```

See inline documentation for details.

## Notes

This library is currently included as part of the Jetpack Changelogger tool, but could be easily
separated if there's call for it as a standalone library.
