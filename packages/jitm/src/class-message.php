<?php
/**
 * Jetpack's JITM Message class.
 *
 * @package automattic/jetpack-jitm
 */

namespace Automattic\Jetpack\JITMS;

use Automattic\Jetpack\JITMS\Cache;

/**
 * Class JITM\Message
 *
 * Represents a message the client should display
 */
class Message {
	/**
	 * Message ID
	 *
	 * @var string
	 */
	public $id;

	/**
	 * Template
	 *
	 * @var string
	 */
	protected $template;

	/**
	 * Message TTL
	 *
	 * @var int
	 */
	protected $ttl;

	/**
	 * Partner
	 *
	 * @var string
	 */
	protected $hosted_with_partner;

	/**
	 * Inactive plugins
	 *
	 * @var array
	 */
	protected $inactive_plugins;

	/**
	 * Active plugins
	 *
	 * @var array
	 */
	protected $active_plugins;

	/**
	 * Installed plugins
	 *
	 * @var array
	 */
	protected $installed_plugins;

	/**
	 * Uninstalled plugins
	 *
	 * @var array
	 */
	protected $uninstalled_plugins;

	/**
	 * User roles
	 *
	 * @var array
	 */
	protected $roles;

	/**
	 * Message content
	 *
	 * @var string
	 */
	protected $content;

	/**
	 * Message path regular expression
	 *
	 * @var string
	 */
	protected $message_path_regex;

	/**
	 * Check multisite
	 *
	 * @var bool
	 */
	protected $multisite_check;

	/**
	 * Call to action
	 *
	 * @var string
	 */
	protected $cta;

	/**
	 * Redux action
	 *
	 * @var string
	 */
	protected $redux_action;

	/**
	 * Query
	 *
	 * @var string
	 */
	protected $query;

	/**
	 * Message priority
	 *
	 * @var int
	 */
	protected $priority;

	/**
	 * Feature class
	 *
	 * @var string
	 */
	protected $feature_class;

	/**
	 * Max dismissals
	 *
	 * @var int
	 */
	protected $max_dismissals;

	/**
	 * Next show in
	 *
	 * @var int
	 */
	protected $next_show;

	/**
	 * Theme
	 *
	 * @var string
	 */
	protected $theme;

	/**
	 * Stickers
	 *
	 * @var array
	 */
	protected $stickers;

	/**
	 * Active widgets
	 *
	 * @var array
	 */
	protected $active_widgets;

	/**
	 * Inactive widgets
	 *
	 * @var array
	 */
	protected $inactive_widgets;

	/**
	 * Option matches
	 *
	 * @var array
	 */
	protected $option_matches;

	/**
	 * Uses mobile browser
	 *
	 * @var bool
	 */
	protected $mobile_browser;

	/**
	 * Should be master user
	 *
	 * @var bool
	 */
	protected $should_be_master_user;

	/**
	 * $ab_test_series
	 *
	 * @var string
	 */
	protected $ab_test_series;

	/**
	 * $ab_test_hidden_variation
	 *
	 * @var string
	 */
	protected $ab_test_hidden_variation;

	/**
	 * Has mobile app
	 *
	 * @var bool
	 */
	protected $has_mobile_app;

	/**
	 * Tracks
	 *
	 * @var array
	 */
	protected $tracks;

	/**
	 * User locales
	 *
	 * @var array
	 */
	protected $user_locales;

	/**
	 * Message is dismissable
	 *
	 * @var bool
	 */
	protected $is_dismissible;

	/**
	 * Need to accept TOS
	 *
	 * @var bool
	 */
	protected $needs_accept_tos;

	/**
	 * User countries
	 *
	 * @var array
	 */
	protected $user_countries;

	/**
	 * Calculated score
	 *
	 * @var int
	 */
	protected $calculated_score;

	/**
	 * JITM Cache instance
	 *
	 * @var Cache
	 */
	protected $cache;

	/**
	 * Class constructor
	 *
	 * @param string $id Message ID.
	 * @param string $feature_class Feature class.
	 * @param Cache  $cache Instance of JITM Cache.
	 */
	public function __construct( $id, $feature_class, $cache ) {
		$this->id                       = $id;
		$this->feature_class            = $feature_class;
		$this->template                 = 'default'; // 'default-with-button' ...
		$this->ttl                      = 300;
		$this->max_dismissals           = 2;
		$this->next_show                = 3628800; // 6 weeks in seconds
		$this->inactive_plugins         = array();
		$this->active_plugins           = array();
		$this->installed_plugins        = array();
		$this->uninstalled_plugins      = array();
		$this->roles                    = array();
		$this->content                  = array(
			'message' => '',
			'icon'    => null,
			'list'    => array(),
		);
		$this->query                    = array();
		$this->message_path_regex       = null;
		$this->calculated_score         = 0;
		$this->cta                      = array(
			'message'   => '',
			'hook'      => null,
			'newWindow' => true,
			'primary'   => true,
		);
		$this->redux_action             = null;
		$this->priority                 = 0;
		$this->hosted_with_partner      = null;
		$this->theme                    = null;
		$this->multisite_check          = null;
		$this->should_be_master_user    = false;
		$this->stickers                 = array();
		$this->active_widgets           = array();
		$this->inactive_widgets         = array();
		$this->option_matches           = array();
		$this->mobile_browser           = null;
		$this->has_mobile_app           = null;
		$this->ab_test_series           = null;
		$this->ab_test_hidden_variation = null;
		$this->tracks                   = null;
		$this->user_locales             = array();
		$this->is_dismissible           = true;
		$this->needs_accept_tos         = null;
		$this->user_countries           = array();

		$this->cache = $cache;
	}

	/**
	 * For AB test
	 *
	 * @param string $series Series.
	 * @param string $hide_variation $hide_variation.
	 *
	 * @return $this
	 */
	public function for_ab_test( $series, $hide_variation ) {
		$this->ab_test_series           = $series;
		$this->ab_test_hidden_variation = $hide_variation;

		return $this;
	}

	/**
	 * Open the CTA link in the same window instead of a new window
	 *
	 * @return $this
	 */
	public function open_cta_in_same_window() {
		$this->cta['newWindow'] = false;

		return $this;
	}

	/**
	 * Score the message path
	 *
	 * @param string $path path.
	 * @param int    $external_user_id external_user_id.
	 * @param array  $query query.
	 * @param int    $score score.
	 *
	 * @return bool|int
	 */
	private function score_message_path( $path, $external_user_id, $query, $score ) {
		if ( empty( $this->message_path_regex ) ) {
			return $score;
		}

		$score = (int) preg_match( $this->message_path_regex, $path );

		return $score ? $score : false;
	}

	/**
	 * Score the query string
	 *
	 * @param string $path path.
	 * @param int    $external_user_id external_user_id.
	 * @param array  $query query.
	 * @param int    $score score.
	 *
	 * @return bool|int
	 */
	private function score_query_string( $path, $external_user_id, $query, $score ) {
		if ( empty( $this->query ) ) {
			return $score;
		}

		$score = $this->cache->get_or_set(
			'query_string',
			$this->query,
			function () use ( &$query ) {
				return array_reduce(
					array_keys( $query ),
					function ( $score, $key ) use ( &$query ) {
						if ( $score ) {
							return $score;
						}

						if ( array_key_exists( $key, $this->query ) ) {
							return (int) preg_match( $this->query[ $key ], $query[ $key ] );
						}

						return 0;
					},
					0
				);
			}
		);

		return $score ? $score : false;
	}

	/**
	 * Score option matches
	 *
	 * @param string $path path.
	 * @param int    $external_user_id external_user_id.
	 * @param array  $query query.
	 * @param int    $score score.
	 *
	 * @return bool|int
	 */
	private function score_option_matches( $path, $external_user_id, $query, $score ) {
		if ( empty( $this->option_matches ) ) {
			return $score;
		}

		// If any of the matches are rejected, reject the rule entirely.
		if ( array_filter(
			$this->option_matches,
			function ( $match ) {
				return false === $match;
			}
		) ) {
			return false;
		}

		// If any of the matches are accepted with an integer, use the largest as the score.
		$ints = array_filter( $this->option_matches, 'is_int' );
		if ( $ints ) {
			return max( $ints );
		}

		// Otherwise, accept the rule with score 1.
		return 1;
	}

	/**
	 * Score dismissal
	 *
	 * @param string $path path.
	 * @param int    $external_user_id external_user_id.
	 * @param array  $query query.
	 * @param int    $score score.
	 *
	 * @return bool|int
	 */
	private function score_dismissal( $path, $external_user_id, $query, $score ) {
		$dismissals = $this->cache->get_dismissals();
		if ( false !== $dismissals && is_array( $dismissals ) && isset( $dismissals[ $this->feature_class ] ) && is_array( $dismissals[ $this->feature_class ] ) ) {
			$score = 0;

			$dismissal = $dismissals[ $this->feature_class ];
			if ( time() > $dismissal['last_dismissal'] + $this->next_show && $dismissal['number'] < $this->max_dismissals ) {
				$score = 1;
			}

			return $score ? $score : false;
		}

		return $score;
	}

	/**
	 * Score multisite
	 *
	 * @param string $path path.
	 * @param int    $external_user_id external_user_id.
	 * @param array  $query query.
	 * @param int    $score score.
	 *
	 * @return bool|int
	 */
	private function score_multisite( $path, $external_user_id, $query, $score ) {
		if ( is_null( $this->multisite_check ) ) {
			return $score;
		}

		$is_multisite = $this->cache->get_or_set(
			'callable',
			'is_multisite',
			function () {
				return (bool) $this->cache->get_replica_store()->get_callable( 'is_multi_site' );
			}
		);

		if ( $is_multisite === $this->multisite_check ) {
			$score = 1;
		}

		return $score ? $score : false;
	}

	/**
	 * Score partner hosted
	 *
	 * @param string $path path.
	 * @param int    $external_user_id external_user_id.
	 * @param array  $query query.
	 * @param int    $score score.
	 *
	 * @return bool|int
	 */
	private function score_partner_hosted( $path, $external_user_id, $query, $score ) {
		if ( is_null( $this->hosted_with_partner ) ) {
			return $score;
		}

		require_lib( 'jetpack-start' );

		$hosted_with_partner = $this->cache->get_or_set(
			'jetpack-start-hosted',
			$this->hosted_with_partner,
			function () {
				return is_jetpack_site_hosted_with_partner( get_current_blog_id() );
			}
		);

		// If a boolean was passed in to $this->hosted_with_partner, then we simply check if the site is, or is not,
		// hosted with a partner. If a string was passed in, check if the site is hosted on a specific partner.
		if ( is_bool( $this->hosted_with_partner ) ) {
			$passes_hosted_with_partner = ( $this->hosted_with_partner === $hosted_with_partner );
		} elseif ( is_string( $this->hosted_with_partner ) ) {
			$passes_hosted_with_partner = ( $this->hosted_with_partner === $hosted_with_partner );
		} else {
			$passes_hosted_with_partner = false;
		}

		if ( $passes_hosted_with_partner ) {
			return 1;
		} else {
			return false;
		}
	}

	/**
	 * Score user locale
	 *
	 * @param string $path path.
	 * @param int    $external_user_id external_user_id.
	 * @param array  $query query.
	 * @param int    $score score.
	 *
	 * @return bool|int
	 */
	private function score_user_locale( $path, $external_user_id, $query, $score ) {
		if ( empty( $this->user_locales ) ) {
			return $score;
		}

		$current_user_id = $this->cache->get_current_user( $external_user_id );
		$user_locale     = strtolower( get_user_locale( $current_user_id ) );

		return in_array( $user_locale, $this->user_locales, true );
	}

	/**
	 * Score user roles
	 *
	 * @param string $path path.
	 * @param int    $external_user_id external_user_id.
	 * @param array  $query query.
	 * @param int    $score score.
	 *
	 * @return bool|int
	 */
	private function score_user_roles( $path, $external_user_id, $query, $score ) {
		if ( empty( $this->roles ) ) {
			return $score;
		}

		/*
		 * In Jetpack versions 7.8+, the user roles are set in the cache when the JITM request from Jetpack is
		 * received. This `get_or_set()` call is required for older versions of Jetpack.
		 */
		$user = $this->cache->get_or_set(
			'user_roles',
			'user',
			function () use ( $external_user_id ) {
				$user = $this->cache->get_current_user( $external_user_id );
				if ( 0 === $user ) {
					// User is not linked so the role is unknown.
					return false;
				}

				return get_userdata( $user );
			}
		);

		if ( $user ) {
			foreach ( $this->roles as $cap ) {
				if ( in_array( $cap, $user->roles, true ) ) {
					return 1;
				}
			}
		}

		return false;
	}

	/**
	 * Score master user
	 *
	 * @param string $path path.
	 * @param int    $external_user_id external_user_id.
	 * @param array  $query query.
	 * @param int    $score score.
	 *
	 * @return bool|int
	 */
	private function score_master_user( $path, $external_user_id, $query, $score ) {
		if ( ! $this->should_be_master_user ) {
			return $score;
		}

		$current_user_id = $this->cache->get_current_user( $external_user_id );
		$master_user     = \Jetpack::get_master_user( get_current_blog_id() );

		return $master_user && ( $master_user->ID === $current_user_id );
	}

	/**
	 * Score user theme
	 *
	 * @param string $path path.
	 * @param int    $external_user_id external_user_id.
	 * @param array  $query query.
	 * @param int    $score score.
	 *
	 * @return bool|int
	 */
	private function score_user_theme( $path, $external_user_id, $query, $score ) {
		if ( null === $this->theme ) {
			return $score;
		}

		$active_theme = $this->cache->get_or_set(
			'themes',
			'active',
			function () {
				return array_pop( explode( '/', wp_get_theme()->get_stylesheet() ) );
			}
		);

		foreach ( $this->theme as $theme ) {
			if ( preg_match( $theme, $active_theme ) > 0 ) {
				return 1;
			}
		}

		return false;
	}

	/**
	 * Score plugins
	 *
	 * @param string $path path.
	 * @param int    $external_user_id external_user_id.
	 * @param array  $query query.
	 * @param int    $score score.
	 *
	 * @return bool|int
	 */
	private function score_plugins( $path, $external_user_id, $query, $score ) {
		if ( ! empty( $this->active_plugins ) || ! empty( $this->inactive_plugins ) || ! empty( $this->installed_plugins ) || ! empty( $this->uninstalled_plugins ) ) {
			$installed_plugins = $this->cache->get_installed_plugins();
			$active_plugins    = $this->cache->get_active_plugins();

			// check for inactive plugins.
			$score = (int) array_reduce(
				$this->inactive_plugins,
				function ( $score, $inactive_plugin ) use ( &$active_plugins, &$installed_plugins ) {
					if ( true !== $score && $score > 0 ) {
						return $score; // this creates an OR condition.
					}

					if ( isset( $installed_plugins[ $inactive_plugin ] ) && in_array( $inactive_plugin, $active_plugins, true ) ) {
						return 0;
					}

					return 1;
				},
				true
			);

			if ( ! $score ) {
				return false;
			}

			// check for active plugins.
			$score = (int) array_reduce(
				$this->active_plugins,
				function ( $score, $active_plugin ) use ( &$active_plugins, &$installed_plugins ) {
					if ( true !== $score && $score > 0 ) {
						return $score; // this creates an OR condition.
					}

					if ( isset( $installed_plugins[ $active_plugin ] ) && in_array( $active_plugin, $active_plugins, true ) ) {
						return 1;
					}

					return 0;
				},
				true
			);

			if ( ! $score ) {
				return false;
			}

			// check for installed plugins.
			$score = (int) array_reduce(
				$this->installed_plugins,
				function ( $score, $plugin ) use ( &$installed_plugins ) {
					if ( true !== $score && $score > 0 ) {
						return $score;
					}

					if ( isset( $installed_plugins[ $plugin ] ) ) {
						return 1;
					}

					return 0;
				},
				true
			);

			if ( ! $score ) {
				return false; // 0
			}

			$score = (int) array_reduce(
				$this->uninstalled_plugins,
				function ( $score, $plugin ) use ( &$installed_plugins ) {
					if ( true !== $score && $score > 0 ) {
						return $score;
					}

					if ( isset( $installed_plugins[ $plugin ] ) ) {
						return 0;
					}

					return 1;
				},
				true
			);

			if ( ! $score ) {
				return false; // 0
			}
		}

		return $score;
	}

	/**
	 * Score stickers
	 *
	 * @param string $path path.
	 * @param int    $external_user_id external_user_id.
	 * @param array  $query query.
	 * @param int    $score score.
	 *
	 * @return bool|int
	 */
	private function score_stickers( $path, $external_user_id, $query, $score ) {
		if ( empty( $this->stickers ) ) {
			return $score;
		}

		foreach ( $this->stickers as $sticker ) {
			if ( has_blog_sticker( $sticker ) ) {
				return 1;
			}
		}

		return false;
	}

	/**
	 * Score active widgets
	 *
	 * @param string $path path.
	 * @param int    $external_user_id external_user_id.
	 * @param array  $query query.
	 * @param int    $score score.
	 *
	 * @return bool|int
	 */
	private function score_active_widgets( $path, $external_user_id, $query, $score ) {
		if ( empty( $this->active_widgets ) ) {
			return $score;
		}
		$active_widget_list = $this->cache->get_widget_list();

		foreach ( $this->active_widgets as $active_widget ) {
			if ( in_array( $active_widget, $active_widget_list, true ) ) {
				return 1;
			}
		}

		return false;
	}

	/**
	 * Score inactive widgets
	 *
	 * @param string $path path.
	 * @param int    $external_user_id external_user_id.
	 * @param array  $query query.
	 * @param int    $score score.
	 *
	 * @return bool|int
	 */
	private function score_inactive_widgets( $path, $external_user_id, $query, $score ) {
		if ( empty( $this->inactive_widgets ) ) {
			return $score;
		}

		$active_widget_list = $this->cache->get_widget_list();

		foreach ( $this->inactive_widgets as $inactive_widget ) {
			if ( in_array( $inactive_widget, $active_widget_list, true ) ) {
				return false;
			}
		}

		return 1;
	}

	/**
	 * Score mobile browser
	 *
	 * @param string $path path.
	 * @param int    $external_user_id external_user_id.
	 * @param array  $query query.
	 * @param int    $score score.
	 *
	 * @return bool|int
	 */
	private function score_mobile_browser( $path, $external_user_id, $query, $score ) {
		if ( is_null( $this->mobile_browser ) ) {
			return $score;
		}

		if ( $this->mobile_browser === $this->cache->is_mobile_browser() ) {
			return 1;
		}

		return false;
	}

	/**
	 * Score has mobile app
	 *
	 * @param string $path path.
	 * @param int    $external_user_id external_user_id.
	 * @param array  $query query.
	 * @param int    $score score.
	 *
	 * @return bool|int
	 */
	private function score_has_mobile_app( $path, $external_user_id, $query, $score ) {
		if ( is_null( $this->has_mobile_app ) ) {
			return $score;
		}

		if ( $this->has_mobile_app !== $this->cache->has_mobile_app( $external_user_id ) ) {
			return false;
		}

		return 1;
	}

	/**
	 * Score TOS
	 *
	 * @param string $path path.
	 * @param int    $external_user_id external_user_id.
	 * @param array  $query query.
	 * @param int    $score score.
	 *
	 * @return bool|int
	 */
	private function score_tos( $path, $external_user_id, $query, $score ) {
		if ( is_null( $this->needs_accept_tos ) ) {
			return $score;
		}

		require_lib( 'tos/updates' );
		$current_user_id = $this->cache->get_current_user( $external_user_id );
		if ( \A8C\TOS\display_accept_prompt( $current_user_id ) ) {
			return 1;
		}

		return false;
	}

	/**
	 * Score user country
	 *
	 * @param string $path path.
	 * @param int    $external_user_id external_user_id.
	 * @param array  $query query.
	 * @param int    $score score.
	 *
	 * @return bool|int
	 */
	private function score_user_country( $path, $external_user_id, $query, $score ) {
		if ( empty( $this->user_countries ) ) {
			return $score;
		}

		$current_user_id = $this->cache->get_current_user( $external_user_id );
		$user_country    = $this->cache->get_user_country( $current_user_id );

		return in_array( $user_country, $this->user_countries, true ) ? 1 : false;
	}

	/**
	 * Calculates the score of the jitm message
	 *
	 * The goal is to return a score of 0 if anything fails to match, and a score > 1 for all matches.
	 *
	 * @param string $path The message path from the user's browser.
	 * @param int    $external_user_id The external user id.
	 * @param array  $external_caps The external user's role.
	 * @param array  $query The query string from the browser.
	 *
	 * @return int The score for this jitm
	 */
	public function score( $path, $external_user_id, $external_caps, $query ) {
		$score = 0;

		// try and keep this in order of least expensive to most expensive - in terms of db/transaction overhead.
		$score_priority = array(
			'score_message_path',
			'score_query_string',
			'score_mobile_browser',
			'score_user_country',
			'score_option_matches',
			'score_dismissal',
			'score_tos',
			'score_multisite',
			'score_user_locale',
			'score_user_roles',
			'score_master_user',
			'score_has_mobile_app',
			'score_stickers',
			'score_user_theme',
			'score_plugins',
			'score_active_widgets',
			'score_inactive_widgets',
		);

		foreach ( $score_priority as $score_func ) {
			$score = $this->$score_func( $path, $external_user_id, $query, $score );
			if ( false === $score ) {
				return 0;
			}
		}

		return $score + $this->priority;
	}

	/**
	 * Renders the internal state to a simple object
	 *
	 * @return \stdClass The simple object
	 */
	public function render() {
		if ( ! is_string( $this->content['message'] ) && is_callable( $this->content['message'] ) ) {
			$cb                       = $this->content['message'];
			$this->content['message'] = $cb();
		}

		if ( isset( $this->content['description'] ) && ! is_string( $this->content['description'] ) && is_callable( $this->content['description'] ) ) {
			$cb                           = $this->content['description'];
			$this->content['description'] = $cb();
		}

		if ( isset( $this->content['list'] ) ) {
			foreach ( $this->content['list'] as &$list ) {
				if ( ! is_string( $list ) && is_callable( $list ) ) {
					$list = $list();
				}
			}
		}

		if ( ! is_string( $this->cta['message'] ) && is_callable( $this->cta['message'] ) ) {
			$cb                   = $this->cta['message'];
			$this->cta['message'] = $cb();
		}

		if ( ! is_string( $this->cta['link'] ) && is_callable( $this->cta['link'] ) ) {
			$cb                = $this->cta['link'];
			$this->cta['link'] = $cb();
		}

		$obj                 = new \stdClass();
		$obj->content        = $this->content;
		$obj->cta            = $this->cta;
		$obj->template       = $this->template;
		$obj->ttl            = $this->ttl;
		$obj->id             = $this->id;
		$obj->feature_class  = $this->feature_class;
		$obj->expires        = $this->next_show;
		$obj->max_dismissal  = $this->max_dismissals;
		$obj->is_dismissible = $this->is_dismissible;

		if ( ! empty( $this->tracks ) ) {
			$obj->tracks = $this->tracks;
		}

		if ( is_array( $this->redux_action ) ) {
			$obj->action = $this->redux_action;
		}

		return $obj;
	}

	/**
	 * Called if it will be rendered on the client, just before rendering on the client.
	 *
	 * @param int $external_user_id The external user id.
	 *
	 * @return object The rendered rule
	 */
	public function post_render( $external_user_id ) {
		if ( isset( $this->ab_test_series ) && isset( $this->ab_test_hidden_variation ) ) {
			if ( ab_test_variation( $this->ab_test_series, $this->cache->get_current_user( $external_user_id ) ) === $this->ab_test_hidden_variation ) {
				$this->content = array();
			}
		}

		return $this->render();
	}

	/**
	 * Adds an item to the list that may be shown on the jitm
	 *
	 * @param string|callable $item item.
	 * @param string          $url url.
	 *
	 * @return $this
	 */
	public function add_item_to_list( $item, $url = null ) {
		if ( ! isset( $this->content['list'] ) || ! is_array( $this->content['list'] ) ) {
			$this->content['list'] = array();
		}

		$this->content['list'][] = array(
			'item' => $item,
			'url'  => $url,
		);

		return $this;
	}

	/**
	 * Requires a widget to be active
	 *
	 * @param string $widget_slug The slug of the widget.
	 *
	 * @return $this
	 */
	public function has_widget_active( $widget_slug ) {
		$this->active_widgets[] = $widget_slug;

		return $this;
	}

	/**
	 * Requires a widget to be inactive
	 *
	 * @param string $widget_slug The slug of the widget.
	 *
	 * @return $this
	 */
	public function has_widget_inactive( $widget_slug ) {
		$this->inactive_widgets[] = $widget_slug;

		return $this;
	}

	/**
	 * Check if a blog has a specific sticker
	 *
	 * @param string $sticker The sticker to check for.
	 *
	 * @return $this
	 */
	public function has_sticker( $sticker ) {
		$this->stickers[] = $sticker;

		return $this;
	}

	/**
	 * Ensure that the browser carries a specific query string
	 *
	 * @param string $key The key to check for.
	 * @param string $value A regex to match.
	 *
	 * @return $this
	 */
	public function with_query_string( $key, $value ) {
		$this->query[ $key ] = $value;

		return $this;
	}

	/**
	 * A redux action dispatched when the CTA is clicked
	 *
	 * @param string $type Action name.
	 * @param object $props Action props.
	 *
	 * @return $this
	 */
	public function with_redux_action( $type, $props = null ) {
		$this->redux_action = array_merge( array( 'type' => $type ), (array) $props );

		return $this;
	}

	/**
	 * Ensure that a specific theme is active
	 *
	 * @param string $theme theme.
	 *
	 * @return $this
	 */
	public function with_active_theme( $theme ) {
		$this->theme = is_array( $theme ) ? $theme : array( $theme );

		return $this;
	}

	/**
	 * Only show this JITM when the specified plugin is inactive OR not installed
	 *
	 * @param string $plugin The path to the plugin.
	 *
	 * @return $this
	 */
	public function plugin_inactive( $plugin ) {
		$this->inactive_plugins[] = $plugin;

		return $this;
	}

	/**
	 * Only show this JITM when the specified plugin is active and installed
	 * Multiple calls are treated as OR: if _any_ of the plugins are active, the rule passes
	 *
	 * @param string $plugin The path to the plugin.
	 *
	 * @return $this
	 */
	public function plugin_active( $plugin ) {
		$this->active_plugins[] = $plugin;

		return $this;
	}

	/**
	 * A rule for a plugin being installed but either active or not active
	 *
	 * @param string $plugin The path to the plugin.
	 *
	 * @return $this
	 */
	public function plugin_installed( $plugin ) {
		$this->installed_plugins[] = $plugin;

		return $this;
	}

	/**
	 * A rule to check that a specific plugin is not installed
	 *
	 * @param string $plugin The path to the plugin.
	 *
	 * @return $this
	 */
	public function plugin_not_installed( $plugin ) {
		$this->uninstalled_plugins[] = $plugin;

		return $this;
	}

	/**
	 * Limits JITM to users who speak specific languages.
	 *
	 * @param array|string $lang target user locales.
	 */
	public function for_user_locale( $lang ) {
		if ( ! is_array( $lang ) ) {
			$lang = array( $lang );
		}

		$this->user_locales = array_map( 'strtolower', $lang );

		return $this;
	}

	/**
	 * Only show if the user is in the specified role
	 *
	 * @param string $role The role.
	 *
	 * @return $this
	 */
	public function user_is( $role ) {
		$this->roles[] = $role;

		return $this;
	}

	/**
	 * Only show if the user is the master JP user
	 *
	 * @return $this
	 */
	public function user_is_master_user() {
		$this->should_be_master_user = true;

		return $this;
	}

	/**
	 * Show the specified message to the user
	 *
	 * @param string $message The message.
	 * @param string $description A longer description that shows up under the message.
	 * @param string $classes Any special classes to put on the card (such as is-upgrade-personal).
	 *
	 * @return $this
	 */
	public function show( $message, $description = '', $classes = '' ) {
		$this->content['message']     = $message;
		$this->content['description'] = $description;
		$this->content['classes']     = $classes;

		return $this;
	}

	/**
	 * Call a hook in the client to get the message to display
	 *
	 * @param string $hook The hook to call in the client.
	 *
	 * @return $this
	 */
	public function show_hook( $hook ) {
		$this->content['hook'] = $hook;

		return $this;
	}

	/**
	 * The message path that needs to match before showing
	 *
	 * Follows the form: wp:PAGE(REGEX):HOOK
	 *
	 * first part:
	 *
	 * wp: for wp-admin
	 *
	 * second part:
	 *
	 * a regex that will need to match "$screen->base"
	 *
	 * last part:
	 *
	 * The hook to display the content on, such as `admin-notices`
	 *
	 * @param string $regex The message path regex.
	 *
	 * @return $this
	 */
	public function message_path( $regex ) {
		$this->message_path_regex = $regex;

		return $this;
	}

	/**
	 * A call to action
	 *
	 * @param string $cta The message to display on the CTA button.
	 * @param string $hook A hook to call on the client side to filter the message with.
	 * @param string $link URL.
	 * @param bool   $primary Whether to use the primary button color or not.
	 *
	 * @return $this
	 */
	public function with_cta( $cta, $hook = '', $link = '', $primary = true ) {
		$this->cta['message'] = $cta;
		$this->cta['hook']    = $hook;
		$this->cta['link']    = $link;
		$this->cta['primary'] = $primary;

		return $this;
	}

	/**
	 * Sets Custom Tracks events.
	 * If you don't set this, 'jitm_nudge_click' + the message id will be used by default.
	 *
	 * @param string $type Event type. e.g. 'click' or 'display'.
	 * @param string $name Tracks Event name.
	 * @param array  $props Custom event properties.
	 *
	 * @return $this
	 */
	public function with_tracks( $type, $name, $props = null ) {
		if ( ! is_array( $this->tracks ) ) {
			$this->tracks = array();
		}

		$this->tracks[ $type ] = array(
			'name'  => $name,
			'props' => $props,
		);

		return $this;
	}

	/**
	 * Adds an icon to the JITM
	 *
	 * @param string $emblem You may put an svg here, or a predifined emblem from Jetpack.
	 *
	 * @return $this
	 */
	public function with_icon( $emblem = 'jetpack' ) {
		$this->content['icon'] = $emblem;

		return $this;
	}

	/**
	 * Set the template of the JITM
	 *
	 * @param string $template Template name.
	 *
	 * @return $this
	 */
	public function with_template( $template ) {
		$this->template = $template;

		return $this;
	}

	/**
	 * Set's the priority of this specific jitm if there are any conflicts
	 *
	 * @param int $priority The priority. Higher numbers result in a higher priority.
	 *
	 * @return $this
	 */
	public function priority( $priority ) {
		$this->priority = $priority;

		return $this;
	}

	/**
	 * Only show jitm for multisite sites
	 *
	 * @return $this
	 */
	public function is_multisite() {
		$this->multisite_check = true;

		return $this;
	}

	/**
	 * Only show jitm for single sites
	 *
	 * @return $this
	 */
	public function is_single_site() {
		$this->multisite_check = false;

		return $this;
	}

	/**
	 * Sets the amount of time to reshow a jitm after it has been dismissed
	 *
	 * @param int $seconds The number of seconds to show wait to show the jitm again.
	 *
	 * @return $this
	 */
	public function show_again_after( $seconds ) {
		$this->next_show = $seconds;

		return $this;
	}

	/**
	 * Set the maximum number of dismissals before this jitm will never be shown again
	 *
	 * @param int $times The maximum number of times to show this message.
	 *
	 * @return $this
	 */
	public function max_dismissals( $times ) {
		$this->max_dismissals = $times;

		return $this;
	}

	/**
	 * Set the ttl for this jitm before it will be retrieved again from the server
	 *
	 * @param int $seconds The number of seconds to cache.
	 *
	 * @return $this
	 */
	public function ttl( $seconds ) {
		$this->ttl = $seconds;

		return $this;
	}

	/**
	 * Sets a flag to check if a site is hosted with a Jetpack partner.
	 *
	 * @param bool|string $partner partner.
	 *
	 * @return $this
	 */
	public function is_hosted_with_partner( $partner = true ) {
		$this->hosted_with_partner = $partner;

		return $this;
	}

	/**
	 * Ensure that the blog has an option that satisfies the given matcher function.
	 *
	 * $matcher should return:
	 *   false - to reject the value
	 *   true  - to accept the value
	 *   (int) - to accept the value and assign it a score (@see ->score_option_matches())
	 *
	 * @param string   $option_name option name.
	 * @param callable $matcher - $matcher( $option_value ).
	 *
	 * @return $this
	 */
	public function with_option_matching( $option_name, callable $matcher ) {
		$this->option_matches[ $option_name ] = $matcher( get_option( $option_name ) );

		return $this;
	}

	/**
	 * Limits the JITM to mobile or non-mobile browsers
	 *
	 * @param bool $mobile_browser - Whether to limit to mobile or non-mobile browsers.
	 *
	 * @return $this
	 */
	public function mobile_browser( $mobile_browser ) {
		$this->mobile_browser = $mobile_browser;

		return $this;
	}

	/**
	 * Limits the JITM to mobile or non-mobile user
	 *
	 * @param bool $has_mobile_app - Whether to limit to mobile or non-mobile user.
	 *
	 * @return $this
	 */
	public function has_mobile_app( $has_mobile_app ) {
		$this->has_mobile_app = $has_mobile_app;

		return $this;
	}

	/**
	 * Get the feature class name
	 *
	 * @return string
	 */
	public function get_feature_class() {
		return $this->feature_class;
	}

	/**
	 * Whether or not to display the dismiss button for the JITM.
	 *
	 * @param bool $dismissible Should JITM be dismissible.
	 *
	 * @return $this
	 */
	public function is_dismissible( $dismissible ) {
		$this->is_dismissible = $dismissible;

		return $this;
	}

	/**
	 * Replaces the CTA button link with an AJAX action trigger.
	 *
	 * @param string $action AJAX action name.
	 *
	 * @return $this
	 */
	public function with_cta_ajax_action( $action ) {
		$this->cta['ajax_action'] = $action;

		return $this;
	}

	/**
	 * Requires the user to accept the current ToS.
	 *
	 * @return $this
	 */
	public function needs_accept_tos() {
		$this->needs_accept_tos = true;

		return $this;
	}

	/**
	 * Only show this JITM when the specified country is set as a user attribute.
	 * Multiple calls are treated as OR: if _any_ of countries of the given countries are founds
	 * the rule will pass.
	 *
	 * @param string|array $country_code Single country or an array of countries.
	 *
	 * @return $this
	 */
	public function with_user_country( $country_code ) {
		if ( is_array( $country_code ) ) {
			$this->user_countries = array_merge( array_map( 'strtoupper', $country_code ), $this->user_countries );
		} else {
			$this->user_countries[] = strtoupper( $country_code );
		}
		return $this;
	}

}
