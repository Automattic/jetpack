<?php
/**
 * Test-only subclass of Jetpack_Sitemap_Builder that overrides the master
 * buffer seam, so the overflow fallback can be exercised without generating
 * the million-plus URLs it would otherwise take to fill the real buffer.
 *
 * @package automattic/jetpack
 */

/**
 * Test-only subclass overriding Jetpack_Sitemap_Builder's buffer seam.
 */
class Jetpack_Sitemap_Builder_Test_Stub extends Jetpack_Sitemap_Builder {

	/**
	 * Item capacity to give the master sitemap buffer.
	 *
	 * @var int
	 */
	public static $master_item_limit = JP_SITEMAP_MAX_ITEMS;

	/**
	 * Restore the real item capacity.
	 */
	public static function reset() {
		self::$master_item_limit = JP_SITEMAP_MAX_ITEMS;
	}

	/**
	 * Create the master sitemap buffer with the seeded item capacity.
	 *
	 * @return Jetpack_Sitemap_Buffer|Jetpack_Sitemap_Buffer_XMLWriter|false The buffer, or false if one cannot be created.
	 */
	protected function create_master_buffer() {
		return Jetpack_Sitemap_Buffer_Factory::create(
			'master',
			self::$master_item_limit,
			JP_SITEMAP_MAX_BYTES
		);
	}
}
