<?php
/**
 * Square layout Tiled Gallery template.
 *
 * @html-template Jetpack_Tiled_Gallery_Layout::template
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable -- Defined by the caller. Let Phan handle it.

$this->template( 'square-layout', $context );
