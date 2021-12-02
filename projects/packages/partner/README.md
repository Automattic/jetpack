# Jetpack Partner

A package that provides support functions for Jetpack hosting partners.

### Usage for hosting partners

As a hosting partner you will need to set either the subsidiary id or the affiliate code. Both can be set via an option or a filter (but please do not set them using an option and filter simultaneously as this may not result in the desired effect).

The most straight forward way to set these is by using an option:

```php

// Set or update subsidiary id. Note that subsidiary id is a string that will be filtered
// with WordPress' sanitize_key() so make sure it conforms to the regex [^a-z0-9_\-].
update_option( 'jetpack_partner_subsidiary_id', '<subsidiary id here>', true );


// Set or update the affiliate code.
update_option( 'jetpack_affiliate_code', '<affiliate code here>', true );
```

Another way to set these is via a filter. This requires creating a function that returns the desired value.

```php

// Set the subsidairy id. Note that subsidiary id is a string that will be filtered
// with WordPress' sanitize_key() so make sure it conforms to the regex [^a-z0-9_\-].
function subsidiary_filter( ) {
	return '<subsidiary id here>';
}

add_filter( 'jetpack_partner_subsidiary_id', 'subsidiary_filter' );



// Set the affiliate code.
function affiliate_filter( ) {
	return '<affiliate code here>';
}

add_filter( 'jetpack_affiliate_code', 'affiliate_filter' );
```
