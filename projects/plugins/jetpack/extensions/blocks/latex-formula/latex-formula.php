<?php
/**
 * Plugin Name:       Latex Formula
 * Description:       A WordPress block for live editing and displaying LaTeX formulas in posts and pages.
 * Version:           0.1.0
 * Author:            Jetpack Team
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       jetpack
 *
 * @package LatexFormula
 */

use Automattic\Jetpack\Blocks;

function latex_formula_block_init() {
	Blocks::jetpack_register_block( __DIR__	);
}

add_action( 'init', 'latex_formula_block_init' );

die('this does not run for some reason.');
