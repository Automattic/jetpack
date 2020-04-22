<?php
/**
 * Jetpack's JITM Message class.
 *
 * @package automattic/jetpack-jitm
 */

namespace Automattic\Jetpack\JITMS;

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
	 * Hosted with partner name
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
	 * Calculated score
	 *
	 * @var int
	 */
	protected $calculated_score;

	/**
	 * Class constructor
	 *
	 * @param string $id Message ID.
	 * @param string $feature_class Feature class.
	 */
	public function __construct( $id, $feature_class ) {
		$this->id                  = $id;
		$this->feature_class       = $feature_class;
		$this->template            = 'default'; // 'default-with-button' ...
		$this->max_dismissals      = 2;
		$this->next_show           = 3628800; // 6 weeks in seconds
		$this->inactive_plugins    = array();
		$this->active_plugins      = array();
		$this->installed_plugins   = array();
		$this->uninstalled_plugins = array();
		$this->roles               = array();
		$this->content             = array(
			'message' => '',
			'icon'    => null,
			'list'    => array(),
		);
		$this->query               = array();
		$this->message_path_regex  = null;
		$this->calculated_score    = 0;
		$this->cta                 = array(
			'message'   => '',
			'hook'      => null,
			'newWindow' => true,
			'primary'   => true,
		);
		$this->redux_action        = null;
		$this->priority            = 0;
		$this->hosted_with_partner = null;
		$this->theme               = null;
		$this->active_widgets      = array();
		$this->inactive_widgets    = array();
		$this->option_matches      = array();
		$this->mobile_browser      = null;
		$this->user_locales        = array();
		$this->is_dismissible      = true;

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
	 * @param array  $query query.
	 * @param int    $score score.
	 *
	 * @return bool|int
	 */
	private function score_message_path( $path, $query, $score ) {
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
	 * @param array  $query query.
	 * @param int    $score score.
	 *
	 * @return bool|int
	 */
	private function score_query_string( $path, $query, $score ) {
		if ( empty( $this->query ) ) {
			return $score;
		}

		$score = array_reduce(
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

		return $score ? $score : false;
	}

	/**
	 * Score option matches
	 *
	 * @param string $path path.
	 * @param array  $query query.
	 * @param int    $score score.
	 *
	 * @return bool|int
	 */
	private function score_option_matches( $path, $query, $score ) {
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
	 * @param array  $query query.
	 * @param int    $score score.
	 *
	 * @return bool|int
	 */
	private function score_dismissal( $path, $query, $score ) {
		$dismissals = $this->get_dismissals();
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
	 * Score hosted with partner
	 *
	 * @param string $path path.
	 * @param array  $query query.
	 * @param int    $score score.
	 *
	 * @return bool|int
	 */
	private function score_hosted_with_partner( $path, $query, $score ) {
		if ( is_null( $this->hosted_with_partner ) ) {
			return $score;
		}

		// Using 'bluehost' for development
		// TODO: replace with proper detection method.

		if ( 'bluehost' === $this->hosted_with_partner ) {
			return 1;
		}

		return false;
	}

	/**
	 * Score user locale
	 *
	 * @param string $path path.
	 * @param array  $query query.
	 * @param int    $score score.
	 *
	 * @return bool|int
	 */
	private function score_user_locale( $path, $query, $score ) {
		if ( empty( $this->user_locales ) ) {
			return $score;
		}

		$user_locale = strtolower( get_user_locale() );

		return in_array( $user_locale, $this->user_locales, true );
	}

	/**
	 * Score user roles
	 *
	 * @param string $path path.
	 * @param array  $query query.
	 * @param int    $score score.
	 *
	 * @return bool|int
	 */
	private function score_user_roles( $path, $query, $score ) {
		if ( empty( $this->roles ) ) {
			return $score;
		}

		$user = wp_get_current_user();
		foreach ( $this->roles as $cap ) {
			if ( in_array( $cap, $user->roles, true ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Score user theme
	 *
	 * @param string $path path.
	 * @param array  $query query.
	 * @param int    $score score.
	 *
	 * @return bool|int
	 */
	private function score_user_theme( $path, $query, $score ) {
		if ( null === $this->theme ) {
			return $score;
		}

		$active_theme = $this->get_or_set(
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
	 * @param array  $query query.
	 * @param int    $score score.
	 *
	 * @return bool|int
	 */
	private function score_plugins( $path, $query, $score ) {
		if ( ! empty( $this->active_plugins ) || ! empty( $this->inactive_plugins ) || ! empty( $this->installed_plugins ) || ! empty( $this->uninstalled_plugins ) ) {
			$installed_plugins = $this->get_installed_plugins();
			$active_plugins    = $this->get_active_plugins();

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
	 * Score active widgets
	 *
	 * @param string $path path.
	 * @param array  $query query.
	 * @param int    $score score.
	 *
	 * @return bool|int
	 */
	private function score_active_widgets( $path, $query, $score ) {
		if ( empty( $this->active_widgets ) ) {
			return $score;
		}
		$active_widget_list = $this->get_widget_list();

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
	 * @param array  $query query.
	 * @param int    $score score.
	 *
	 * @return bool|int
	 */
	private function score_inactive_widgets( $path, $query, $score ) {
		if ( empty( $this->inactive_widgets ) ) {
			return $score;
		}

		$active_widget_list = $this->get_widget_list();

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
	 * @param array  $query query.
	 * @param int    $score score.
	 * @param bool   $mobile_browser mobile browser.
	 *
	 * @return bool|int
	 */
	private function score_mobile_browser( $path, $query, $score, $mobile_browser ) {
		if ( is_null( $this->mobile_browser ) ) {
			return $score;
		}

		if ( $this->mobile_browser === $mobile_browser ) {
			return 1;
		}

		return false;
	}

	/**
	 * Calculates the score of the jitm message
	 *
	 * The goal is to return a score of 0 if anything fails to match, and a score > 1 for all matches.
	 *
	 * @param string $path The message path from the user's browser.
	 * @param array  $external_caps The external user's role.
	 * @param array  $query The query string from the browser.
	 * @param bool   $mobile_browser Is using a mobile browser.
	 *
	 * @return int The score for this jitm
	 */
	public function score( $path, $external_caps, $query, $mobile_browser ) {
		$score = 0;

		// try and keep this in order of least expensive to most expensive - in terms of db/transaction overhead.
		$score_priority = array(
			'score_message_path',
			'score_query_string',
			'score_mobile_browser',
			'score_option_matches',
			'score_dismissal',
			'score_user_roles',
			'score_user_theme',
			'score_plugins',
			'score_active_widgets',
			'score_inactive_widgets',
			'score_hosted_with_partner',
		);

		foreach ( $score_priority as $score_func ) {
			$score = $this->$score_func( $path, $query, $score, $mobile_browser );
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
		$obj->id             = $this->id;
		$obj->feature_class  = $this->feature_class;
		$obj->expires        = $this->next_show;
		$obj->max_dismissal  = $this->max_dismissals;
		$obj->is_dismissible = $this->is_dismissible;

		if ( is_array( $this->redux_action ) ) {
			$obj->action = $this->redux_action;
		}

		return $obj;
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
	 * Sets a flag to check if a site is hosted with a certain partner.
	 *
	 * @param bool|string $partner_name partner name.
	 *
	 * @return $this
	 */
	public function is_hosted_with_partner( $partner_name ) {
		$this->hosted_with_partner = $partner_name;

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
	 * Get the site's dismissals
	 *
	 * @return array The array of dismissed jitms
	 */
	public function get_dismissals() {
		return \Jetpack_Options::get_option( 'hide_jitm' ) ? \Jetpack_Options::get_option( 'hide_jitm' ) : array();
	}

	/**
	 * Get's the site's installed plugins
	 *
	 * @return array An array of installed plugins
	 */
	public function get_installed_plugins() {
		if ( ! function_exists( 'get_plugins' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}
		/** This filter is documented in wp-admin/includes/class-wp-plugins-list-table.php */
		$all_plugins = apply_filters( 'all_plugins', get_plugins() );

		return $all_plugins;
	}

	/**
	 * Get's the site's active plugins
	 *
	 * @return array An array of active plugins
	 */
	public function get_active_plugins() {
		include_once ABSPATH . 'wp-admin/includes/plugin.php';
		$active_plugins = \Jetpack::get_active_plugins();
		if ( ! is_array( $active_plugins ) ) { // can be an empty string.
			$active_plugins = array();
		}

		return $active_plugins;
	}

	/**
	 * Get the list of widgets
	 *
	 * @return array
	 */
	public function get_widget_list() {
		$list           = array();
		$active_widgets = get_option( 'sidebars_widgets' );
		foreach ( $active_widgets as $widgets ) {
			if ( is_iterable( $widgets ) ) {
				foreach ( $widgets as $widget ) {
					$list[] = implode( '-', array_slice( explode( '-', $widget ), 0, - 1 ) );
				}
			} else {
				$list[] = implode( '-', array_slice( explode( '-', $widgets ), 0, - 1 ) );
			}
		}

		return $list;
	}

}
