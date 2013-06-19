<?php

if( ! class_exists( 'Jetpack_Omnisearch_Posts' ) )
	require_once( dirname(__FILE__) . '/omnisearch-posts.php' );

class Jetpack_Omnisearch_Pages extends Jetpack_Omnisearch_Posts {
	var $post_type = 'page';
}

