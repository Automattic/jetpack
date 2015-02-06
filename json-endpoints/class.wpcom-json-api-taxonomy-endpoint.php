<?php
abstract class WPCOM_JSON_API_Taxonomy_Endpoint extends WPCOM_JSON_API_Endpoint {
	var $category_object_format = array(
		'ID'          => '(int) The category ID.',
		'name'        => "(string) The name of the category.",
		'slug'        => "(string) The slug of the category.",
		'description' => '(string) The description of the category.',
		'post_count'  => "(int) The number of posts using this category.",
		'parent'	  => "(int) The parent ID for the category.",
		'meta'        => '(object) Meta data',
	);

	var $tag_object_format = array(
		'ID'          => '(int) The tag ID.',
		'name'        => "(string) The name of the tag.",
		'slug'        => "(string) The slug of the tag.",
		'description' => '(string) The description of the tag.',
		'post_count'  => "(int) The number of posts using this t.",
		'meta'        => '(object) Meta data',
	);

	function __construct( $args ) {
		parent::__construct( $args );
		if ( preg_match( '#/tags/#i', $this->path ) )
			$this->response_format =& $this->tag_object_format;
		else
			$this->response_format =& $this->category_object_format;
	}
}
