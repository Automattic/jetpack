<?php
/**
 * Plugin Name: Footer optimizations for block themes
 * Plugin URI: http://wordpress.com
 * Version: 1.0
 * Author: Automattic
 * Author URI: http://automattic.com/
 * Description: This plugin displays a permanent WordPress.com “Footer Credits” on Block-based sites.
 * The Site Editor doesn’t yet have a way to display a lockable template or block to accommodate non-editable/dismissible footer credits,
 * so our intention is to inject a fixed banner in the interim.
 *
 * It lives under `blog_plugins` since the banner only appears on non-admin sites. See: PCYsg-1fo-p2
 *
 * Team: View
 * Explanatory post: pcjTuq-ff-p2
 *
 * @package block-theme-footer-credits
 */

// Include plugin class.
require_once __DIR__ . '/class-wpcom-block-theme-footer-credits.php';

$wpcom_block_theme_footer_credits = new WPCOM_Block_Theme_Footer_Credits();

add_action( 'init', array( $wpcom_block_theme_footer_credits, 'init' ) );
