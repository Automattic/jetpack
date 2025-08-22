<?php
/**
 * Plugin Name:       LaTex
 * Description:       A WordPress block for live editing and displaying LaTex in posts and pages.
 * Version:           0.1.0
 * Author:            Jetpack Team
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       jetpack
 *
 * @package LatexFormula
 */

namespace Automattic\Jetpack\Extensions\Latex;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

/**
 * Register the block.
 */
function latex_formula_block_init() {
	Blocks::jetpack_register_block(
		__DIR__,
		array( 'render_callback' => __NAMESPACE__ . '\load_assets' )
	);
}

add_action( 'init', __NAMESPACE__ . '\latex_formula_block_init' );

/**
 * Load the assets for the block.
 *
 * @param {object} $attr - The attributes of the block.
 * @param {string} $content - The content of the block.
 * @return {string} The content of the block.
 */
function load_assets( $attr, $content ) {
	/*
	 * Enqueue necessary scripts and styles.
	 */
	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

	return $content;
}
