<?php
/**
 * Used by the blogging prompt feature of the mobile app.
 *
 * @package automattic/jetpack
 */

add_filter( 'rest_api_allowed_public_metadata', 'jetpack_blogging_prompts_add_meta_data' );

/**
 * Adds the blogging prompt key post metq to the list of allowed post meta to be updated by rest api.
 *
 * @param array $keys Array of post meta keys that are allowed public metadata.
 *
 * @return array
 */
function jetpack_blogging_prompts_add_meta_data( $keys ) {
	$keys[] = '_jetpack_blogging_prompt_key';
	return $keys;
}
