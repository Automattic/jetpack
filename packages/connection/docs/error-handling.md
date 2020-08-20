# Error Handling

Whenever WordPress.com makes a request that fails to authenticate, the Connection package will store the error in the database and display a generic error message to the user.

If you want to enable and customize this message, here is what you have to do.

(Check [#16194](https://github.com/Automattic/jetpack/pull/16194) for more information on how errors are catched and validated.)

## Enabling the error message

If you want to enable the error message, you can use the `jetpack_connection_error_notice_message` filter. The second argument is an array with the details of all the errors (if more than one).

This basic example show how to display a simple error message no matter the specific error type:

```PHP

add_filter( 'jetpack_connection_error_notice_message', 'my_function', 10, 2 );

function my_function( $message, $errors ) {
	__( 'There is a problem with connection...', 'my_plugin' );
}

```

The example below enables the error message only if there's a specific error with the current logged user.

```PHP

add_filter( 'jetpack_connection_error_notice_message', 'my_function', 10, 2 );

function my_function( $message, $errors ) {

	// each key in the array is an error code.
	foreach ( $errors as $error_code => $user_errors ) {

		// each key in this array is a user ID.
		// This key can also be 0 or 'invalid' for errors with the blog token
		// See Automattic\Jetpack\Connection\Error_Handler for details on the array structure.
		if ( isset( $user_errors[ get_current_user_id() ] ) ) {
			$message = __( 'There is a problem with your user authorization...', 'my_plugin' );
		}

	}

	return $message;
}

```

## Further customizing error notices

If you want to completely change the admin notice, you can ignore the default message and hook into an actino that will let you do whatever you want.

```PHP

add_action( 'jetpack_connection_error_notice', 'my_function' );

function my_function( $errors ) {

	// do stuff with the errors array

	// echo the error notice
	?>
	<div class="notice notice-error is-dismissible jetpack-message jp-connect" style="display:block !important;">
		<p><?php _e( 'my message', 'my_plugin' ); ?></p>
		<a href="#" class="my-cta"><?php _e( 'Fix it!', 'my_plugin' ); ?></a>
	</div>
	<?php

}

```
