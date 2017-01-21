<?php

/**
 * Interface to access the data needed by the Blogs I Follow widget.
 *
 * This allows the plugin code to stay in sync between WordPress.com and Jetpack,
 * leaving the data particulars to each flavor.
 */
interface iBlogs_I_Follow_Datastore {
	public function get_followed_blogs($args);
}

class Blogs_I_Follow_Jetpack_Datastore implements iBlogs_I_Follow_Datastore {
	public function get_followed_blogs($args) {
		return array(
			0 => array(
				'id' => '304636440',
				'blog_id' => '1537283',
				'blog_name' => 'WordPress.com',
				'blog_url' => 'www.wordpress.com/',
				'date_subscribed' => '2016-10-21 17:42:03',
				'site_id' => '2',
				'public' => '1',
				'feed_url' => 'http://www.wordpress.com/feed/rss2',
				'feed_id' => '8903852',
			),
		);
	}
}

class Blogs_I_Follow_WPCOM_Datastore implements iBlogs_I_Follow_Datastore {
	public function get_followed_blogs($args) {
		return wpcom_subs_get_blogs($args);
	}
}
