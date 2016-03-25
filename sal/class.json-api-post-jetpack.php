<?php
class Jetpack_Post extends SAL_Post {
	public function get_like_count() {
		return 0;
	}

	public function is_liked() {
		return false;
	}

	public function is_reblogged() {
		return false;
	}

	public function is_following() {
		return false;
	}

	public function get_global_id() {
		return '';
	}

	public function get_geo() {
		return false;
	}
}
