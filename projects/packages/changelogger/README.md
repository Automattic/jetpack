# Jetpack Changelogger

This tool allows for managing a changelog for your project by having each PR drop a
specially-formatted "change file" into a `changelog` directory, which the tool can then process when
you make a release.

## Why?

Traditional changelog files have one major disadvantage in a project with many things going on at
once: merge conflicts! Multiple PRs are likely to be inserting changelog entries at the same place
in the file, so when one is merged the other needs to be rebased. And, unfortunately, GitHub and
other hosts seldom offer support for custom merge engines that might mitigate this.

The use of "change files" in a directory works around this, since file creation won't conflict
unless two people happen to choose the same filename for their PRs. This tool defaults to basing the
filename on the git branch name, which again people usually choose to be unique enough.

The use of change files also allows us to include additional metadata about the change, in
particular the semantic versioning "significance". This means the release manager no longer has to
determine on their own whether the new version should have a patch, minor, or major bump as the
change files themselves already specify the kind of bump that's needed.

## Installation

Require using `composer require --dev automattic/jetpack-changelogger`.

This will install the `changelogger` tool into `vendor/bin/`, which you might add to your PATH, or
you might run it via `composer exec -- changelogger`.

If you're using `git`, it's recommended to also create `changelog/.gitkeep` in your repository so
the directory will always be present.

## Configuration

Changelogger is configured via entries in composer.json, under `extra.changelogger`. In most cases
you can set the configuration using `composer config extra.changelogger.$setting $value`.

- **changelog**: Specifies the changelog file, relative to the composer.json. Default is `CHANGELOG.md`.
- **changes-dir**: Specifies the directory holding changes files, relative to the composer.json. Default is `changelog`.
- **link-template**: Template for creating changelog entry links. `${new}` is replaced with the
  URL-encoded new version number, `${old}` with the old.
- **ordering**: Specifies the ordering of change entries: by type ('subheading'), 'significance',
  'timestamp', and/or 'content'. Default is `[ 'subheading', 'content' ]`.
- **types**: Specifies the types of changes used in the repository; see [Type field](#type-field). The
  value is a JSON object, with keys being the field value in the change file and values being the
  subheading text used in the combined changelog file. May be empty; the default is to use the types
  listed at https://keepachangelog.com/en/1.0.0/#types.
- **formater**: Plugin for parsing and formatting the changelog. Default is `keepachangelog`.
- **versioning**: Versioning plugin used to determine new versions. Default is `semver`.

## Usage

### Adding a change file

The changelog file consists of named fields, a blank line, and the changelog entry content.

```
Significance: major
Type: added
Comment: This is an example.

Initial commit!
```

The filename in the `changelog` directory does not matter, as long as it does not begin with a dot.

A changelog file may be created interactively using `changelogger add`. You may also specify all the
needed fields non-interactively with command line options; see `changelogger add --help` for details.

#### Significance field

This field specifies the significance of the change in the style of [semantic versioning](https://semver.org/).
Valid values are

- **patch**: Backwards-compatible bug fixes.
- **minor**: Added (or deprecated) functionality in a backwards-compatible manner.
- **major**: Broke backwards compatibility in some way.

Depending on the `versioning` [configuration setting](#configuration), this may be used to determine
the version when rolling the change files into a new changelog version.

#### Type field

This specifies the type of the change, which in turn is used to place the entry in a proper
subheading when rolling the change files into a new changelog version.

Valid types are defined in the `types` [configuration setting](#configuration). If that setting is
empty, the Type field should be omitted.

#### Comment field

This field contains arbitrary text that might be useful in communicating to other developers. It is
not used by Changelogger.

#### Changelog entry

The changelog entry comes after all the fields, separated from them by a blank line. This is the
text that is included in the changelog file when the change files are combined into a changelog
version.

When the [significance](#significance-field) is "patch", the entry may be left empty. It is not
valid to leave it empty when the significance is "minor" or "major".

### Validating change files

Change files may be validated using `changelogger validate`. By default it will check all
non-dotfiles in the [configured](#configuration) `changes-dir`, but a list of specific files may be
passed instead.

When errors or warnings are encountered, by default the full path to the file is reported. This may
be overridden using `--basedir`, which will cause paths inside that directory to be reported
relative to it.

### Checking versions

To allow easier integration of changelogger into other tooling, the current, previous, and next
versions based on the current may be printed with `changelogger version`.

When fetching the next version, the same flags accepted by `changelogger write` to control the
versioning are accepted here too.

### Updating the changelog

The change files may be combined into a new changelog entry using `changelogger write`. Note that
this operation will delete the change files, so you're encouraged to have checked them into git
beforehand in case something goes wrong.

Command line options allow for specifying prerelease suffixes (like `-dev` or `-beta`), overriding
the version determination entirely, or amending the latest changelog entry.

## Plugins

Plugins are used to parse the changelog file and to determine the next version from a current version.

A plugin is specified by a JSON string, or an object with one of the following keys:

- **name**: See below, or plugin documentation.
- **class**: Plugin class name. Must be available via the autoloader.
- **filename**: File from which to load the plugin class. The file must define exactly one class of
  the appropriate interface.

The plugin may take additional keys as configuration. See the plugin documentation for details.

If a string is given, it is assumed to be the `name`.

### Included plugins

One formatting plugin and two versioning plugins are included.

#### "keepachangelog" formatting plugin

This formatter parses a changelog in markdown format as documented at https://keepachangelog.com/en/1.0.0/.

Configuration options are:

- **bullet**: String to use to bullet changelog entries. Default is `-`.
- **dateFormat**: [PHP date formatting string](https://www.php.net/manual/en/datetime.format.php) used to output timestamps for each version.
  Default is `Y-m-d`.

#### "semver" versioning plugin

Determines the next version using the [significance](#significance-field) of the changes, per [semantic versioning](https://semver.org/).

#### "wordpress" versioning plugin

WordPress, and some of its plugins such as Jetpack, give normal releases decimal version numbers
such as 9.4, incrementing it by 0.1 with each release. There is no special significance to going
from 8.9 to 9.0. Bugfix "point releases" add a suffix like 9.4.1.

When this plugin is in use, the [version](#checking-versions) and [write](#updating-the-changelog)
commands will accept a `--point-release` option to indicate that a point release increment should be
done rather than a major release.

### Writing plugins

A formatting plugin must implement the `Automattic\Jetpack\Changelogger\FormatterPlugin` interface.

A versioning plugin must implement the `Automattic\Jetpack\Changelogger\VersioningPlugin` interface.

If you want your plugin to be available via a `name`, create an alias to it from
`Automattic\Jetpack\Changelogger\Plugins\{Name}Formatter` or `Automattic\Jetpack\Changelogger\Plugins\{Name}Versioning`
as appropriate for its type, and make sure that alias can be loaded via the autoloader. There
are two common ways to do this correctly:

1. Using PSR-0 or PSR-4, put the `class_alias()` in the same file as the _target_ class, and create a
   dummy file at the aliased name with a `class_exists()` call for the target name to trigger loading.
2. Use `.autoload.files` in composer.json to load a file with the necessary `class_alias()` calls.
   Note this will load all aliases classes on every request.
