<?php
/**
 * SocialSpec document interface.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize\Socialspec;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * A document served at /.well-known/.
 */
interface Document {

	/**
	 * The media type, without charset.
	 *
	 * @return string
	 */
	public function get_content_type();

	/**
	 * The document.
	 *
	 * @return string|null Null if there is nothing to publish.
	 */
	public function get_content();
}
