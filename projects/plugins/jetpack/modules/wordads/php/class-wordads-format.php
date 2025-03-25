<?php
/**
 *  WordAds Format definition.
 *
 * @package automattic/jetpack
 */

/**
 * Contains definition of all the add formats
 */
class WordAds_Format {
	public const TOP                            = 'top';
	public const INLINE                         = 'inline';
	public const BELOWPOST                      = 'belowpost';
	public const BOTTOM_STICKY                  = 'bottom_sticky';
	public const SIDEBAR_STICKY_RIGHT           = 'sidebar_sticky_right';
	public const GUTENBERG_RECTANGLE            = 'gutenberg_rectangle';
	public const GUTENBERG_LEADERBOARD          = 'gutenberg_leaderboard';
	public const GUTENBERG_MOBILE_LEADERBOARD   = 'gutenberg_mobile_leaderboard';
	public const GUTENBERG_SKYSCRAPER           = 'gutenberg_skyscraper';
	public const SIDEBAR_WIDGET_MEDIUMRECTANGLE = 'sidebar_widget_mediumrectangle';  // Used by legacy Jetpack sidebar widget.
	public const SIDEBAR_WIDGET_LEADERBOARD     = 'sidebar_widget_leaderboard';  // Used by legacy Jetpack sidebar widget.
	public const SIDEBAR_WIDGET_WIDESKYCRAPER   = 'sidebar_widget_wideskyscraper';  // Used by legacy Jetpack sidebar widget.
	public const SHORTCODE                      = 'shortcode';
}
