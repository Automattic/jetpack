<?php
/**
 * Adds support for the GitHub Deployments feature (see /github-deployments/%s in Calypso)
 *
 * @package wpcomsh
 */

add_filter( 'jetpack_show_wpcom_github_deployments_menu', '__return_true' );
