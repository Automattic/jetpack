# Jetpack Stats

Used to record internal usage stats for Automattic. Not visible to site owners.

## Usage

```php
$stats = new Automattic\Jetpack\A8c_Mc_Stats();

$stats->add( 'group', 'name' );

$stats->do_stats();

// or

$stats->do_server_side_stats();

```

Create an instance of the class and use the `add()` method to store stats that will be processed later with `do_stats()` or `do_server_side_stats()`;

`do_stats()` will output one `img` tag with the tracking gif for each group stored using `add()`.

`do_server_side_stats()` will directly ping the server, with no output, for each group stored using `add()`.

## Options

By default, this uses `b.gif`, which is a transparent pixel. If you want to use a tiny little smiley icon instead, initialize the class with `false`.

```php
$stats = new Automattic\Jetpack\A8c_Mc_Stats( false );
```

or set the property at any time:
```php
$stats->use_transparent_pixel = false;
```
