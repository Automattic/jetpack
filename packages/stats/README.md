# Jetpack Stats

Used to record stats using https://pixel.wp.com/g.gif

## Usage

```php
$stats = new Automattic\Jetpack\Stats();

$stats->add( 'group', 'name' );

$stats->do_stats();

// or

$stats->do_server_side_stats();

```

Create an instance of the class and use the `add()` method to store stats that will be processed later with `do_stats()` or `do_server_side_stats()`;

`do_stats()` will output one `img` tag with the tracking gif for each group stored using `add()`.

`do_server_side_stats()` will directly ping the server, with no output, for each group stored using `add()`.

## Options

By default, this uses `g.gif`, which is a tiny little smiley icon. If you want to use a transparent pixel instead, initialize the class with `true`.

```php
$stats = new Automattic\Jetpack\Stats( true );
```

or set the property at any time:
```php
$stats->use_transparent_pixel = true;
```
