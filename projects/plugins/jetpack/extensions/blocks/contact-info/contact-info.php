<?php
/**
 * Contact Info block and its child blocks.
 *
 * @since 7.1.0
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Contact_Info;

use Jetpack_Contact_Info_Block;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

require_once __DIR__ . '/class-jetpack-contact-info-block.php';

add_action( 'init', array( Jetpack_Contact_Info_Block::class, 'register_block' ) );
