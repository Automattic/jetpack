<?php
/**
 * Plugin Name: Jetpack E2E waf data interceptor
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Jetpack Team
 * Version: 1.0.0
 * Text Domain: jetpack
 *
 * @package automattic/jetpack
 */

add_filter( 'pre_http_request', 'e2e_intercept_waf_data_request', 1, 3 );

/**
 * Intercept WPCOM waf data request and replaces it with mocked data
 *
 * @param result $return result.
 * @param r      $r not used.
 * @param string $url request URL.
 */
function e2e_intercept_waf_data_request( $return, $r, $url ) {
	if ( ! class_exists( 'Jetpack_Options' ) ) {
		return $return;
	}

	$site_id = Jetpack_Options::get_option( 'id' );

	if ( empty( $site_id ) ) {
		return $return;
	}

	if ( 1 === preg_match( sprintf( '/\/sites\/%d\/waf-rules/', $site_id ), $url ) ) {

		$rules = <<<'RULES'
<?php
$rule = (object) array( 'id' => 941110, 'reason' => '', 'tags' => array (
  0 => 'application-multi',
  1 => 'language-multi',
  2 => 'platform-multi',
  3 => 'attack-xss',
  4 => 'paranoia-level/1',
  5 => 'owasp_crs',
  6 => 'capec/1000/152/242',
) );
try {
if($waf->match_targets(array (
),array (
  'request_cookies' =>
  array (
    'except' =>
    array (
      0 => '/__utm/',
    ),
  ),
  'request_cookies_names' =>
  array (
  ),
  'request_filename' =>
  array (
  ),
  'request_headers' =>
  array (
    'only' =>
    array (
      0 => 'user-agent',
      1 => 'referer',
    ),
  ),
  'args_names' =>
  array (
  ),
  'args' =>
  array (
  ),
),'rx','#(?i)<script[^>]*>[\\s\\S]*?#Ds',false,true)) {
$waf->inc_var('tx.xss_score',htmlentities($waf->get_var('tx.critical_anomaly_score'), ENT_QUOTES, 'UTF-8') );
$waf->inc_var('tx.anomaly_score_pl1',htmlentities($waf->get_var('tx.critical_anomaly_score'), ENT_QUOTES, 'UTF-8') );
$rule->reason = 'XSS Filter - Category 1: Script Tag Vector Matched Data: '.htmlentities($waf->get_var('tx.0'), ENT_QUOTES, 'UTF-8') .' found within '. htmlentities($waf->matched_var_name, ENT_QUOTES, 'UTF-8') .': '. htmlentities($waf->matched_var, ENT_QUOTES, 'UTF-8') ;
return $waf->block('block',$rule->id,$rule->reason,403);
}
} catch ( \Throwable $t ) {
error_log( 'Rule ' . $rule->id . ' failed: ' . $t );
} catch ( \Exception $e ) {
error_log( 'Rule ' . $rule->id . ' failed: ' . $e );
}
RULES;

		return array(
			'response' => array( 'code' => 200 ),
			'body'     => wp_json_encode(
				array(
					'data' => $rules,
				)
			),
		);
	}

	return $return;
}
