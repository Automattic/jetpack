<?php
/**
 * Plugin Name: Always Use Open Graph with Jetpack
 * Plugin URI: https://kraft.blog/
 * Description: Jetpack automatically disables its Open Graph tags when there's a known plugin that already adds Open Graph tags, which is good. Sometimes, though, you might want to use Jetpack's version instead. Even if you disable the tags in the conflicting plugin, Jetpack won't add Open Graph tags without being told to do so.
 * Version: 1.0.4-alpha
 * Author: Brandon Kraft
 * Author Email: public@brandonkraft.com
 * License: GPLv2 or later
 *
 * @package kraftbj/always-use-jetpack-open-graph
 */

// See https://developer.jetpack.com/hooks/jetpack_enable_open_graph/ for details.
add_filter( 'jetpack_enable_open_graph', '__return_true', 100 );
