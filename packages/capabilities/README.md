# Jetpack Capabilities

The Jetpack capabilities API

### About

Jetpack offers many features via many different plans. This demands complex logic to determine whether or not certain features, functions or actions should be available. We also need to understand exactly why they're not available, in order to give the user some useful feedback and further steps they can take.

Rather than allow our codebase to accumulate long if- and switch- statements and state inspection, this API aims to provide an easily understandable and robust way of declaring the preconditions that are required for users to take an action.

As an example, let's imagine a product that lets the user fire a catapult.

First, we create our capability:

```php
$rule = new \Jetpack\Capabilities\AllRule(); // this rule only grants permission if all the sub-rules are granted
$rule->add_rule( new WPRoleRule( 'catapulter' ) );
$rule->register( 'catapult.fire' ); // registers in the \Jetpack\Capabilities class
```

Then elsewhere we fetch it:

```php
$rule = \Jetpack\Capabilities::get( 'catapult.fire' );
```

Then we can check it - a rule has a `check()` method that always returns a `Permission` object that describes if permission was granted, and optionally provides additional information on things the user can do to gain that permission.

```php
$permission = $rule->check();
if ( $permission->granted() ) {
	fire_the_catapult();
} else {
	wp_die( $permission->message() );
}
```

Of course, this is a little clunky, so we made some shorthand, like the capabilities builder:

```php
( new Capabilities\Builder() )
	->create()
	->require_wp_role( 'catapulter' )
	->register( 'catapult.fire' );
```

and nice invocation patterns:

```php
// if I only care whether it's granted
if ( \Jetpack\Capabilities::granted( 'catapult.fire' ) ) {
	fire_the_catapult();
}
```

```php
// if I care about the reason it wasn't granted
$permission = \Jetpack\Capabilities::permission( 'catapult.fire' );
if ( ! $permission->granted() ) {
	return new WP_Error( 'permission_denied', $permission->message() );
}
fire_the_catapult();
```

### Usage

TODO
