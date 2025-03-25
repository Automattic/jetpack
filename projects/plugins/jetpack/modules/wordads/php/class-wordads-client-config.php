<?php
/**
 *  Configuration for the WordAds client.
 *
 * @package automattic/jetpack
 */

// imports
require_once WORDADS_ROOT . '/php/class-wordads-format.php';

/**
 * Configuration class for WordAds client.
 */
final class WordAds_Client_Config {
	/**
	 * Supported formats.
	 * sidebar_widget formats represents the legacy Jetpack sidebar widget.
	 *
	 * @var array
	 */
	private $supported_formats = array(
		WordAds_Format::TOP,
		WordAds_Format::INLINE,
		WordAds_Format::BELOWPOST,
		WordAds_Format::BOTTOM_STICKY,
		WordAds_Format::SIDEBAR_STICKY_RIGHT,
		WordAds_Format::GUTENBERG_RECTANGLE,
		WordAds_Format::GUTENBERG_LEADERBOARD,
		WordAds_Format::GUTENBERG_MOBILE_LEADERBOARD,
		WordAds_Format::GUTENBERG_SKYSCRAPER,
		WordAds_Format::SIDEBAR_WIDGET_MEDIUMRECTANGLE,
		WordAds_Format::SIDEBAR_WIDGET_LEADERBOARD,
		WordAds_Format::SIDEBAR_WIDGET_WIDESKYCRAPER,
		WordAds_Format::SHORTCODE,
	);

	/**
	 * The parameters for WordAds.
	 *
	 * @var WordAds_Params
	 */
	private $params;

	/**
	 * List of enabled ad formats.
	 *
	 * @var array
	 */
	private $formats_enabled = array();

	/**
	 * Constructor.
	 *
	 * @param WordAds_Params $params Object containing WordAds settings.
	 */
	public function __construct( WordAds_Params $params ) {
		$this->params = $params;
		$this->enable_formats_from_options();
		$this->override_enable_formats_from_query_string();
	}

	/**
	 * Checks if a specific ad format is enabled.
	 *
	 * @param string $format The ad format to check.
	 * @return bool True if the format is enabled, false otherwise.
	 */
	public function is_format_enabled( $format ) {
		return in_array( $format, $this->formats_enabled, true );
	}

	/**
	 * Enables a specific ad format if it is not already enabled.
	 *
	 * @param string $format The ad format to enable.
	 */
	public function enable_format( $format ): void {
		if ( ! $this->is_format_enabled( $format ) ) {
			$this->formats_enabled[] = $format;
		}
	}

	/**
	 * Returns the WordAds configuration as an array.
	 *
	 * @return array The WordAds configuration settings.
	 */
	public function get_config(): array {
		return array(
			'blog_id'       => $this->params->blog_id,
			'blog_language' => explode( '-', get_locale() )[0],
			'hosting_type'  => 1, // 0 = Automattic hosted, 1 = Self hosted
			'theme'         => get_stylesheet(),
			'formats'       => $this->formats_enabled,
		);
	}

	/**
	 * Enables ad formats based on the display options
	 *
	 * @return void
	 */
	private function enable_formats_from_options(): void {
		$this->params->options['enable_header_ad'] && $this->enable_format( WordAds_Format::TOP );
		is_singular( 'post' ) && $this->params->options['wordads_inline_enabled'] && $this->enable_format( WordAds_Format::INLINE );
		$this->params->should_show() && $this->enable_format( WordAds_Format::BELOWPOST );
		$this->params->options['wordads_bottom_sticky_enabled'] && $this->enable_format( WordAds_Format::BOTTOM_STICKY );
		$this->params->options['wordads_sidebar_sticky_right_enabled'] && $this->enable_format( WordAds_Format::SIDEBAR_STICKY_RIGHT );
	}

	/**
	 * Enables ad formats based on query string parameters, eg. ?inline=true.
	 */
	private function override_enable_formats_from_query_string(): void {
		// phpcs:disable WordPress.Security.NonceVerification.Recommended
		if ( ! isset( $_GET['wordads-logging'] ) ) {
			return;
		}

		foreach ( $this->supported_formats as $format ) {
			if ( isset( $_GET[ $format ] ) && 'true' === $_GET[ $format ] ) {
				$this->enable_format( $format );
			}
		}
	}

	/**
	 * Check if has any format enabled.
	 *
	 * @return bool True if enabled, false otherwise.
	 */
	public function has_any_format_enabled(): bool {
		return count( $this->formats_enabled ) > 0;
	}

	/**
	 * Gets the URL to a JSONP endpoint with configuration data.
	 *
	 * @return string The URL.
	 */
	public function get_server_config_url(): string {
		return sprintf(
			'https://public-api.wordpress.com/wpcom/v2/sites/%1$d/adflow/conf/?_jsonp=a8c_adflow_callback&api_version=2&wordads-logging=true&aditude=true',
			$this->params->blog_id
		);
	}
}
