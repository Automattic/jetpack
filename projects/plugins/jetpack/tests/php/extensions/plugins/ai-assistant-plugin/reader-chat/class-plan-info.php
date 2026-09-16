<?php
/**
 * WPCOM Search plan test double.
 *
 * @package automattic/jetpack
 */

namespace Jetpack\Search;

/**
 * Test double for the optional WPCOM Simple Search plan source.
 */
class Plan_Info {
	/**
	 * Whether this class is the Reader Chat test double.
	 *
	 * @var bool
	 */
	public static $jetpack_reader_chat_test_double = true;

	/**
	 * Whether the test plan supports Instant Search.
	 *
	 * @var bool
	 */
	public static $supports_instant_search = true;

	/** @var bool Whether the plan is free. */
	public static $is_free = false;

	/**
	 * Whether the test plan is disabled due to overage.
	 *
	 * @var bool
	 */
	public static $disabled_due_to_overage = false;

	/**
	 * Blog ID passed to the constructor.
	 *
	 * @var int|null
	 */
	public static $blog_id;

	/**
	 * Constructor.
	 *
	 * @param int $blog_id Blog ID.
	 */
	public function __construct( $blog_id ) {
		self::$blog_id = $blog_id;
	}

	/**
	 * Whether the plan supports Instant Search.
	 *
	 * @return bool
	 */
	public function supports_instant_search() {
		return self::$supports_instant_search;
	}

	/**
	 * Whether the plan is free.
	 *
	 * @return bool
	 */
	public function is_free_search_plan() {
		return self::$is_free;
	}

	/**
	 * Whether the plan is disabled due to overage.
	 *
	 * @return bool
	 */
	public function is_disabled_due_to_overage() {
		return self::$disabled_due_to_overage;
	}
}
