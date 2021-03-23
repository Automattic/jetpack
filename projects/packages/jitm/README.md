# Jetpack Just In Time Messages

A package encapsulating Just In Time Messages.

Just In Time Messages (JITMs) are real-time contextual in-admin notices. Such notices are displayed on specific admin pages, based on multiple parameters (page visited, Jetpack connection status, plan status, features active, ...).

There are 2 main ways to use JITMs:

- You can create static notices within the Jetpack plugin. Those will be displayed before the site is connected to WordPress.com. See `Pre_Connection_JITM` to find out more.
- You can create dynamic notices once the Jetpack plugin is connected to WordPress.com. Those notices will be pulled from WordPress.com depending on the parameters mentioned above. See `Post_Connection_JITM` to find out more.

### Usage

Instantiating the JITM Manager will facilitate the display of JITM messages in wp-admin

### Adding Pre-Connection JITMs

Plugins can add pre-connection JITMs uisng the `jetpack_pre_connection_jitms` filter. Each JITM message must be an array and must contain the following keys:
 * id
 * message_path
 * message
 * description
 * button_link
 * button_caption

 If a JITM is missing one of the above keys, the JITM will not be displayed.

 The Jetpack plugin's pre-connection JITMs can be found in the `Jetpack_Pre_Connection_JITMs` class.

 #### Example


    function add_preconnection_jitms( $messages ) {
	    $example_jitm = array(
			'id'             => 'example-jitm',
			'message_path'   => '/wp:plugins:admin_notices/',
			'message'        => __( 'An example message.', 'jetpack' ),
			'description'    => __( 'An example description.', 'jetpack' ),
			'button_link'    => 'https://example.com/path',
			'button_caption' => __( 'Example button text', 'jetpack' ),
	    );

	    if ( ! is_array( $messages ) ) {
			return array( $example_jitm );
	    }

	    return array_merge( $messages, array( $example_jitm ) );
     }

     add_filter( 'jetpack_pre_connection_jitms', 'add_preconnection_jitms' );

