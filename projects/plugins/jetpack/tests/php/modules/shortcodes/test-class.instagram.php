<?php

require_once __DIR__ . '/trait.http-request-cache.php';

use Automattic\Jetpack\Constants;

class WP_Test_Jetpack_Shortcodes_Instagram extends WP_UnitTestCase {
	use Automattic\Jetpack\Tests\HttpRequestCacheTrait;

	/**
	 * Mock global $content_width value.
	 *
	 * @var int
	 */
	const CONTENT_WIDTH = 640;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		// Note: This forces the tests below to use the flow that's used when an auth token
		// for the Instagram oEmbed REST API is set. This means that the call to the /oembed-proxy
		// endpoint isn't covered with tests. We should create at least one test below that
		// specifically covers that.
		Constants::set_constant( 'JETPACK_INSTAGRAM_EMBED_TOKEN', 'test' );

		if ( in_array( 'external-http', $this->getGroups(), true ) ) {
			// Used by WordPress.com - does nothing in Jetpack.
			add_filter( 'tests_allow_http_request', '__return_true' );
		} else {
			/**
			 * We normally make an HTTP request to Instagram's oEmbed endpoint.
			 * This filter bypasses that HTTP request for these tests.
			 */
			add_filter( 'pre_http_request', array( $this, 'pre_http_request' ), 10, 3 );
		}
	}

	/**
	 * Tear down after each test.
	 *
	 * @inheritDoc
	 */
	public function tear_down() {
		unset( $GLOBALS['content_width'] );
		parent::tear_down();
	}

	public function pre_http_request( $response, $args, $url ) {
		if ( ! wp_startswith( $url, 'https://graph.facebook.com/v5.0/instagram_oembed/' ) ) {
			return $response;
		}

		$response = array(
			'response' => array(
				'code' => 200,
			),
		);

		$api_query      = wp_parse_url( $url, PHP_URL_QUERY );
		$api_query_args = null;
		wp_parse_str( $api_query, $api_query_args );

		if ( ! isset( $api_query_args['access_token'] ) ) {
			$error = array(
				'code'       => 104,
				'fbtrace_id' => 'A3Rblahblahblah',
				'message'    => 'An access token is required to request this resource.',
				'type'       => 'OAuthException',
			);

			$response['body'] = wp_json_encode( compact( 'error' ) );
			return $response;
		}

		if ( ! isset( $api_query_args['url'] ) ) {
			return $response;
		}

		$path = wp_parse_url( $api_query_args['url'], PHP_URL_PATH );

		// Does the URL itself include any query args?
		$url_query      = wp_parse_url( $api_query_args['url'], PHP_URL_QUERY );
		$url_query_args = null;
		wp_parse_str( $url_query, $url_query_args );

		if ( ! empty( $url_query_args ) ) {
			$error = array(
				'code'             => 100,
				'error_subcode'    => 2207047,
				'error_user_msg'   => "The request parameter 'url' is malformed or does not refer to an embeddable media.",
				'error_user_title' => 'Invalid URL',
				'fbtrace_id'       => 'ARkblahblahblah',
				'is_transient'     => false,
				'message'          => 'Invalid parameter',
				'type'             => 'OAuthException',
			);

			$response['body'] = wp_json_encode( compact( 'error' ) );
			return $response;
		}

		// phpcs:disable WordPress.WP.EnqueuedResources.NonEnqueuedScript
		switch ( $path ) {
			case '/p/BnMO9vRleEx/':
			case '/jeherve/p/BnMO9vRleEx/':
				$response['body'] = <<<BODY
{
  "version": "1.0",
  "title": "PJ Masks for the Birthday girl!",
  "author_name": "jeherve",
  "author_url": "https://www.instagram.com/jeherve",
  "author_id": 300154,
  "media_id": "1858926561497309489_300154",
  "provider_name": "Instagram",
  "provider_url": "https://www.instagram.com",
  "type": "rich",
  "width": 500,
  "height": null,
  "html": "<blockquote class=\"instagram-media\" data-instgrm-captioned data-instgrm-permalink=\"https://www.instagram.com/p/BnMO9vRleEx/\" data-instgrm-version=\"12\" style=\" background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:500px; min-width:326px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);\"><div style=\"padding:16px;\"> <a href=\"https://www.instagram.com/p/BnMO9vRleEx/\" style=\" background:#FFFFFF; line-height:0; padding:0 0; text-align:center; text-decoration:none; width:100%;\" target=\"_blank\"> <div style=\" display: flex; flex-direction: row; align-items: center;\"> <div style=\"background-color: #F4F4F4; border-radius: 50%; flex-grow: 0; height: 40px; margin-right: 14px; width: 40px;\"></div> <div style=\"display: flex; flex-direction: column; flex-grow: 1; justify-content: center;\"> <div style=\" background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; margin-bottom: 6px; width: 100px;\"></div> <div style=\" background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; width: 60px;\"></div></div></div><div style=\"padding: 19% 0;\"></div> <div style=\"display:block; height:50px; margin:0 auto 12px; width:50px;\"><svg width=\"50px\" height=\"50px\" viewBox=\"0 0 60 60\" version=\"1.1\" xmlns=\"https://www.w3.org/2000/svg\" xmlns:xlink=\"https://www.w3.org/1999/xlink\"><g stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\"><g transform=\"translate(-511.000000, -20.000000)\" fill=\"#000000\"><g><path d=\"M556.869,30.41 C554.814,30.41 553.148,32.076 553.148,34.131 C553.148,36.186 554.814,37.852 556.869,37.852 C558.924,37.852 560.59,36.186 560.59,34.131 C560.59,32.076 558.924,30.41 556.869,30.41 M541,60.657 C535.114,60.657 530.342,55.887 530.342,50 C530.342,44.114 535.114,39.342 541,39.342 C546.887,39.342 551.658,44.114 551.658,50 C551.658,55.887 546.887,60.657 541,60.657 M541,33.886 C532.1,33.886 524.886,41.1 524.886,50 C524.886,58.899 532.1,66.113 541,66.113 C549.9,66.113 557.115,58.899 557.115,50 C557.115,41.1 549.9,33.886 541,33.886 M565.378,62.101 C565.244,65.022 564.756,66.606 564.346,67.663 C563.803,69.06 563.154,70.057 562.106,71.106 C561.058,72.155 560.06,72.803 558.662,73.347 C557.607,73.757 556.021,74.244 553.102,74.378 C549.944,74.521 548.997,74.552 541,74.552 C533.003,74.552 532.056,74.521 528.898,74.378 C525.979,74.244 524.393,73.757 523.338,73.347 C521.94,72.803 520.942,72.155 519.894,71.106 C518.846,70.057 518.197,69.06 517.654,67.663 C517.244,66.606 516.755,65.022 516.623,62.101 C516.479,58.943 516.448,57.996 516.448,50 C516.448,42.003 516.479,41.056 516.623,37.899 C516.755,34.978 517.244,33.391 517.654,32.338 C518.197,30.938 518.846,29.942 519.894,28.894 C520.942,27.846 521.94,27.196 523.338,26.654 C524.393,26.244 525.979,25.756 528.898,25.623 C532.057,25.479 533.004,25.448 541,25.448 C548.997,25.448 549.943,25.479 553.102,25.623 C556.021,25.756 557.607,26.244 558.662,26.654 C560.06,27.196 561.058,27.846 562.106,28.894 C563.154,29.942 563.803,30.938 564.346,32.338 C564.756,33.391 565.244,34.978 565.378,37.899 C565.522,41.056 565.552,42.003 565.552,50 C565.552,57.996 565.522,58.943 565.378,62.101 M570.82,37.631 C570.674,34.438 570.167,32.258 569.425,30.349 C568.659,28.377 567.633,26.702 565.965,25.035 C564.297,23.368 562.623,22.342 560.652,21.575 C558.743,20.834 556.562,20.326 553.369,20.18 C550.169,20.033 549.148,20 541,20 C532.853,20 531.831,20.033 528.631,20.18 C525.438,20.326 523.257,20.834 521.349,21.575 C519.376,22.342 517.703,23.368 516.035,25.035 C514.368,26.702 513.342,28.377 512.574,30.349 C511.834,32.258 511.326,34.438 511.181,37.631 C511.035,40.831 511,41.851 511,50 C511,58.147 511.035,59.17 511.181,62.369 C511.326,65.562 511.834,67.743 512.574,69.651 C513.342,71.625 514.368,73.296 516.035,74.965 C517.703,76.634 519.376,77.658 521.349,78.425 C523.257,79.167 525.438,79.673 528.631,79.82 C531.831,79.965 532.853,80.001 541,80.001 C549.148,80.001 550.169,79.965 553.369,79.82 C556.562,79.673 558.743,79.167 560.652,78.425 C562.623,77.658 564.297,76.634 565.965,74.965 C567.633,73.296 568.659,71.625 569.425,69.651 C570.167,67.743 570.674,65.562 570.82,62.369 C570.966,59.17 571,58.147 571,50 C571,41.851 570.966,40.831 570.82,37.631\"></path></g></g></g></svg></div><div style=\"padding-top: 8px;\"> <div style=\" color:#3897f0; font-family:Arial,sans-serif; font-size:14px; font-style:normal; font-weight:550; line-height:18px;\"> View this post on Instagram</div></div><div style=\"padding: 12.5% 0;\"></div> <div style=\"display: flex; flex-direction: row; margin-bottom: 14px; align-items: center;\"><div> <div style=\"background-color: #F4F4F4; border-radius: 50%; height: 12.5px; width: 12.5px; transform: translateX(0px) translateY(7px);\"></div> <div style=\"background-color: #F4F4F4; height: 12.5px; transform: rotate(-45deg) translateX(3px) translateY(1px); width: 12.5px; flex-grow: 0; margin-right: 14px; margin-left: 2px;\"></div> <div style=\"background-color: #F4F4F4; border-radius: 50%; height: 12.5px; width: 12.5px; transform: translateX(9px) translateY(-18px);\"></div></div><div style=\"margin-left: 8px;\"> <div style=\" background-color: #F4F4F4; border-radius: 50%; flex-grow: 0; height: 20px; width: 20px;\"></div> <div style=\" width: 0; height: 0; border-top: 2px solid transparent; border-left: 6px solid #f4f4f4; border-bottom: 2px solid transparent; transform: translateX(16px) translateY(-4px) rotate(30deg)\"></div></div><div style=\"margin-left: auto;\"> <div style=\" width: 0px; border-top: 8px solid #F4F4F4; border-right: 8px solid transparent; transform: translateY(16px);\"></div> <div style=\" background-color: #F4F4F4; flex-grow: 0; height: 12px; width: 16px; transform: translateY(-4px);\"></div> <div style=\" width: 0; height: 0; border-top: 8px solid #F4F4F4; border-left: 8px solid transparent; transform: translateY(-4px) translateX(8px);\"></div></div></div></a> <p style=\" margin:8px 0 0 0; padding:0 4px;\"> <a href=\"https://www.instagram.com/p/BnMO9vRleEx/\" style=\" color:#000; font-family:Arial,sans-serif; font-size:14px; font-style:normal; font-weight:normal; line-height:17px; text-decoration:none; word-wrap:break-word;\" target=\"_blank\">PJ Masks for the Birthday girl!</a></p> <p style=\" color:#c9c8cd; font-family:Arial,sans-serif; font-size:14px; line-height:17px; margin-bottom:0; margin-top:8px; overflow:hidden; padding:8px 0 7px; text-align:center; text-overflow:ellipsis; white-space:nowrap;\">A post shared by <a href=\"https://www.instagram.com/jeherve/\" style=\" color:#c9c8cd; font-family:Arial,sans-serif; font-size:14px; font-style:normal; font-weight:normal; line-height:17px;\" target=\"_blank\"> Jeremy Herve</a> (@jeherve) on <time style=\" font-family:Arial,sans-serif; font-size:14px; line-height:17px;\" datetime=\"2018-09-01T17:02:16+00:00\">Sep 1, 2018 at 10:02am PDT</time></p></div></blockquote>",
  "thumbnail_url": "https://scontent-sjc3-1.cdninstagram.com/vp/3875cae046efc3468000b35a2eeecb9e/5D6D2071/t51.2885-15/e35/s480x480/40409333_219697508905106_5945921422860746752_n.jpg?_nc_ht=scontent-sjc3-1.cdninstagram.com",
  "thumbnail_width": 480,
  "thumbnail_height": 480
}
BODY;
				break;
			case '/tv/BkQjCfsBIzi/':
			case '/instagram/tv/BkQjCfsBIzi/':
				$response['body'] = <<<BODY
{
  "version": "1.0",
  "title": "Look back at Instagram co-founder and CEO Kevin Systrom (@kevin) introduce IGTV from a live event in San Francisco.",
  "author_name": "instagram",
  "author_url": "https://www.instagram.com/instagram",
  "author_id": 25025320,
  "media_id": "1806097553666903266_25025320",
  "provider_name": "Instagram",
  "provider_url": "https://www.instagram.com",
  "type": "rich",
  "width": 500,
  "height": null,
  "html": "<blockquote class=\"instagram-media\" data-instgrm-captioned data-instgrm-permalink=\"https://www.instagram.com/tv/BkQjCfsBIzi/\" data-instgrm-version=\"12\" style=\" background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:500px; min-width:326px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);\"><div style=\"padding:16px;\"> <a href=\"https://www.instagram.com/tv/BkQjCfsBIzi/\" style=\" background:#FFFFFF; line-height:0; padding:0 0; text-align:center; text-decoration:none; width:100%;\" target=\"_blank\"> <div style=\" display: flex; flex-direction: row; align-items: center;\"> <div style=\"background-color: #F4F4F4; border-radius: 50%; flex-grow: 0; height: 40px; margin-right: 14px; width: 40px;\"></div> <div style=\"display: flex; flex-direction: column; flex-grow: 1; justify-content: center;\"> <div style=\" background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; margin-bottom: 6px; width: 100px;\"></div> <div style=\" background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; width: 60px;\"></div></div></div><div style=\"padding: 19% 0;\"></div> <div style=\"display:block; height:50px; margin:0 auto 12px; width:50px;\"><svg width=\"50px\" height=\"50px\" viewBox=\"0 0 60 60\" version=\"1.1\" xmlns=\"https://www.w3.org/2000/svg\" xmlns:xlink=\"https://www.w3.org/1999/xlink\"><g stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\"><g transform=\"translate(-511.000000, -20.000000)\" fill=\"#000000\"><g><path d=\"M556.869,30.41 C554.814,30.41 553.148,32.076 553.148,34.131 C553.148,36.186 554.814,37.852 556.869,37.852 C558.924,37.852 560.59,36.186 560.59,34.131 C560.59,32.076 558.924,30.41 556.869,30.41 M541,60.657 C535.114,60.657 530.342,55.887 530.342,50 C530.342,44.114 535.114,39.342 541,39.342 C546.887,39.342 551.658,44.114 551.658,50 C551.658,55.887 546.887,60.657 541,60.657 M541,33.886 C532.1,33.886 524.886,41.1 524.886,50 C524.886,58.899 532.1,66.113 541,66.113 C549.9,66.113 557.115,58.899 557.115,50 C557.115,41.1 549.9,33.886 541,33.886 M565.378,62.101 C565.244,65.022 564.756,66.606 564.346,67.663 C563.803,69.06 563.154,70.057 562.106,71.106 C561.058,72.155 560.06,72.803 558.662,73.347 C557.607,73.757 556.021,74.244 553.102,74.378 C549.944,74.521 548.997,74.552 541,74.552 C533.003,74.552 532.056,74.521 528.898,74.378 C525.979,74.244 524.393,73.757 523.338,73.347 C521.94,72.803 520.942,72.155 519.894,71.106 C518.846,70.057 518.197,69.06 517.654,67.663 C517.244,66.606 516.755,65.022 516.623,62.101 C516.479,58.943 516.448,57.996 516.448,50 C516.448,42.003 516.479,41.056 516.623,37.899 C516.755,34.978 517.244,33.391 517.654,32.338 C518.197,30.938 518.846,29.942 519.894,28.894 C520.942,27.846 521.94,27.196 523.338,26.654 C524.393,26.244 525.979,25.756 528.898,25.623 C532.057,25.479 533.004,25.448 541,25.448 C548.997,25.448 549.943,25.479 553.102,25.623 C556.021,25.756 557.607,26.244 558.662,26.654 C560.06,27.196 561.058,27.846 562.106,28.894 C563.154,29.942 563.803,30.938 564.346,32.338 C564.756,33.391 565.244,34.978 565.378,37.899 C565.522,41.056 565.552,42.003 565.552,50 C565.552,57.996 565.522,58.943 565.378,62.101 M570.82,37.631 C570.674,34.438 570.167,32.258 569.425,30.349 C568.659,28.377 567.633,26.702 565.965,25.035 C564.297,23.368 562.623,22.342 560.652,21.575 C558.743,20.834 556.562,20.326 553.369,20.18 C550.169,20.033 549.148,20 541,20 C532.853,20 531.831,20.033 528.631,20.18 C525.438,20.326 523.257,20.834 521.349,21.575 C519.376,22.342 517.703,23.368 516.035,25.035 C514.368,26.702 513.342,28.377 512.574,30.349 C511.834,32.258 511.326,34.438 511.181,37.631 C511.035,40.831 511,41.851 511,50 C511,58.147 511.035,59.17 511.181,62.369 C511.326,65.562 511.834,67.743 512.574,69.651 C513.342,71.625 514.368,73.296 516.035,74.965 C517.703,76.634 519.376,77.658 521.349,78.425 C523.257,79.167 525.438,79.673 528.631,79.82 C531.831,79.965 532.853,80.001 541,80.001 C549.148,80.001 550.169,79.965 553.369,79.82 C556.562,79.673 558.743,79.167 560.652,78.425 C562.623,77.658 564.297,76.634 565.965,74.965 C567.633,73.296 568.659,71.625 569.425,69.651 C570.167,67.743 570.674,65.562 570.82,62.369 C570.966,59.17 571,58.147 571,50 C571,41.851 570.966,40.831 570.82,37.631\"></path></g></g></g></svg></div><div style=\"padding-top: 8px;\"> <div style=\" color:#3897f0; font-family:Arial,sans-serif; font-size:14px; font-style:normal; font-weight:550; line-height:18px;\"> View this post on Instagram</div></div><div style=\"padding: 12.5% 0;\"></div> <div style=\"display: flex; flex-direction: row; margin-bottom: 14px; align-items: center;\"><div> <div style=\"background-color: #F4F4F4; border-radius: 50%; height: 12.5px; width: 12.5px; transform: translateX(0px) translateY(7px);\"></div> <div style=\"background-color: #F4F4F4; height: 12.5px; transform: rotate(-45deg) translateX(3px) translateY(1px); width: 12.5px; flex-grow: 0; margin-right: 14px; margin-left: 2px;\"></div> <div style=\"background-color: #F4F4F4; border-radius: 50%; height: 12.5px; width: 12.5px; transform: translateX(9px) translateY(-18px);\"></div></div><div style=\"margin-left: 8px;\"> <div style=\" background-color: #F4F4F4; border-radius: 50%; flex-grow: 0; height: 20px; width: 20px;\"></div> <div style=\" width: 0; height: 0; border-top: 2px solid transparent; border-left: 6px solid #f4f4f4; border-bottom: 2px solid transparent; transform: translateX(16px) translateY(-4px) rotate(30deg)\"></div></div><div style=\"margin-left: auto;\"> <div style=\" width: 0px; border-top: 8px solid #F4F4F4; border-right: 8px solid transparent; transform: translateY(16px);\"></div> <div style=\" background-color: #F4F4F4; flex-grow: 0; height: 12px; width: 16px; transform: translateY(-4px);\"></div> <div style=\" width: 0; height: 0; border-top: 8px solid #F4F4F4; border-left: 8px solid transparent; transform: translateY(-4px) translateX(8px);\"></div></div></div></a> <p style=\" margin:8px 0 0 0; padding:0 4px;\"> <a href=\"https://www.instagram.com/tv/BkQjCfsBIzi/\" style=\" color:#000; font-family:Arial,sans-serif; font-size:14px; font-style:normal; font-weight:normal; line-height:17px; text-decoration:none; word-wrap:break-word;\" target=\"_blank\">Look back at Instagram co-founder and CEO Kevin Systrom (@kevin) introduce IGTV from a live event in San Francisco.</a></p> <p style=\" color:#c9c8cd; font-family:Arial,sans-serif; font-size:14px; line-height:17px; margin-bottom:0; margin-top:8px; overflow:hidden; padding:8px 0 7px; text-align:center; text-overflow:ellipsis; white-space:nowrap;\">A post shared by <a href=\"https://www.instagram.com/instagram/\" style=\" color:#c9c8cd; font-family:Arial,sans-serif; font-size:14px; font-style:normal; font-weight:normal; line-height:17px;\" target=\"_blank\"> Instagram</a> (@instagram) on <time style=\" font-family:Arial,sans-serif; font-size:14px; line-height:17px;\" datetime=\"2018-06-20T19:51:32+00:00\">Jun 20, 2018 at 12:51pm PDT</time></p></div></blockquote>",
  "thumbnail_url": "https://scontent-sjc3-1.cdninstagram.com/vp/29e9eb7cfb2884ccaa31dc47ebd16020/5CCB20F9/t51.2885-15/e15/p480x480/34457000_2079693292311064_7909942227097354240_n.jpg?_nc_ht=scontent-sjc3-1.cdninstagram.com",
  "thumbnail_width": 480,
  "thumbnail_height": 858
}
BODY;
				break;
			case '/reel/COWmlFLB_7P/':
				$response['body'] = <<<BODY
{
  "version": "1.0",
  "author_name": "beautifuldestinations",
  "provider_name": "Instagram",
  "provider_url": "https://www.instagram.com/",
  "type": "rich",
  "width": 600,
  "html": "<blockquote class=\"instagram-media\" data-instgrm-captioned data-instgrm-permalink=\"https://www.instagram.com/reel/COWmlFLB_7P/?utm_source=ig_embed&amp;utm_campaign=loading\" data-instgrm-version=\"13\" style=\" background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:600px; min-width:326px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);\"><div style=\"padding:16px;\"> <a href=\"https://www.instagram.com/reel/COWmlFLB_7P/?utm_source=ig_embed&amp;utm_campaign=loading\" style=\" background:#FFFFFF; line-height:0; padding:0 0; text-align:center; text-decoration:none; width:100%;\" target=\"_blank\"> <div style=\" display: flex; flex-direction: row; align-items: center;\"> <div style=\"background-color: #F4F4F4; border-radius: 50%; flex-grow: 0; height: 40px; margin-right: 14px; width: 40px;\"></div> <div style=\"display: flex; flex-direction: column; flex-grow: 1; justify-content: center;\"> <div style=\" background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; margin-bottom: 6px; width: 100px;\"></div> <div style=\" background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; width: 60px;\"></div></div></div><div style=\"padding: 19% 0;\"></div> <div style=\"display:block; height:50px; margin:0 auto 12px; width:50px;\"><svg width=\"50px\" height=\"50px\" viewBox=\"0 0 60 60\" version=\"1.1\" xmlns=\"https://www.w3.org/2000/svg\" xmlns:xlink=\"https://www.w3.org/1999/xlink\"><g stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\"><g transform=\"translate(-511.000000, -20.000000)\" fill=\"#000000\"><g><path d=\"M556.869,30.41 C554.814,30.41 553.148,32.076 553.148,34.131 C553.148,36.186 554.814,37.852 556.869,37.852 C558.924,37.852 560.59,36.186 560.59,34.131 C560.59,32.076 558.924,30.41 556.869,30.41 M541,60.657 C535.114,60.657 530.342,55.887 530.342,50 C530.342,44.114 535.114,39.342 541,39.342 C546.887,39.342 551.658,44.114 551.658,50 C551.658,55.887 546.887,60.657 541,60.657 M541,33.886 C532.1,33.886 524.886,41.1 524.886,50 C524.886,58.899 532.1,66.113 541,66.113 C549.9,66.113 557.115,58.899 557.115,50 C557.115,41.1 549.9,33.886 541,33.886 M565.378,62.101 C565.244,65.022 564.756,66.606 564.346,67.663 C563.803,69.06 563.154,70.057 562.106,71.106 C561.058,72.155 560.06,72.803 558.662,73.347 C557.607,73.757 556.021,74.244 553.102,74.378 C549.944,74.521 548.997,74.552 541,74.552 C533.003,74.552 532.056,74.521 528.898,74.378 C525.979,74.244 524.393,73.757 523.338,73.347 C521.94,72.803 520.942,72.155 519.894,71.106 C518.846,70.057 518.197,69.06 517.654,67.663 C517.244,66.606 516.755,65.022 516.623,62.101 C516.479,58.943 516.448,57.996 516.448,50 C516.448,42.003 516.479,41.056 516.623,37.899 C516.755,34.978 517.244,33.391 517.654,32.338 C518.197,30.938 518.846,29.942 519.894,28.894 C520.942,27.846 521.94,27.196 523.338,26.654 C524.393,26.244 525.979,25.756 528.898,25.623 C532.057,25.479 533.004,25.448 541,25.448 C548.997,25.448 549.943,25.479 553.102,25.623 C556.021,25.756 557.607,26.244 558.662,26.654 C560.06,27.196 561.058,27.846 562.106,28.894 C563.154,29.942 563.803,30.938 564.346,32.338 C564.756,33.391 565.244,34.978 565.378,37.899 C565.522,41.056 565.552,42.003 565.552,50 C565.552,57.996 565.522,58.943 565.378,62.101 M570.82,37.631 C570.674,34.438 570.167,32.258 569.425,30.349 C568.659,28.377 567.633,26.702 565.965,25.035 C564.297,23.368 562.623,22.342 560.652,21.575 C558.743,20.834 556.562,20.326 553.369,20.18 C550.169,20.033 549.148,20 541,20 C532.853,20 531.831,20.033 528.631,20.18 C525.438,20.326 523.257,20.834 521.349,21.575 C519.376,22.342 517.703,23.368 516.035,25.035 C514.368,26.702 513.342,28.377 512.574,30.349 C511.834,32.258 511.326,34.438 511.181,37.631 C511.035,40.831 511,41.851 511,50 C511,58.147 511.035,59.17 511.181,62.369 C511.326,65.562 511.834,67.743 512.574,69.651 C513.342,71.625 514.368,73.296 516.035,74.965 C517.703,76.634 519.376,77.658 521.349,78.425 C523.257,79.167 525.438,79.673 528.631,79.82 C531.831,79.965 532.853,80.001 541,80.001 C549.148,80.001 550.169,79.965 553.369,79.82 C556.562,79.673 558.743,79.167 560.652,78.425 C562.623,77.658 564.297,76.634 565.965,74.965 C567.633,73.296 568.659,71.625 569.425,69.651 C570.167,67.743 570.674,65.562 570.82,62.369 C570.966,59.17 571,58.147 571,50 C571,41.851 570.966,40.831 570.82,37.631\"></path></g></g></g></svg></div><div style=\"padding-top: 8px;\"> <div style=\" color:#3897f0; font-family:Arial,sans-serif; font-size:14px; font-style:normal; font-weight:550; line-height:18px;\"> View this post on Instagram</div></div><div style=\"padding: 12.5% 0;\"></div> <div style=\"display: flex; flex-direction: row; margin-bottom: 14px; align-items: center;\"><div> <div style=\"background-color: #F4F4F4; border-radius: 50%; height: 12.5px; width: 12.5px; transform: translateX(0px) translateY(7px);\"></div> <div style=\"background-color: #F4F4F4; height: 12.5px; transform: rotate(-45deg) translateX(3px) translateY(1px); width: 12.5px; flex-grow: 0; margin-right: 14px; margin-left: 2px;\"></div> <div style=\"background-color: #F4F4F4; border-radius: 50%; height: 12.5px; width: 12.5px; transform: translateX(9px) translateY(-18px);\"></div></div><div style=\"margin-left: 8px;\"> <div style=\" background-color: #F4F4F4; border-radius: 50%; flex-grow: 0; height: 20px; width: 20px;\"></div> <div style=\" width: 0; height: 0; border-top: 2px solid transparent; border-left: 6px solid #f4f4f4; border-bottom: 2px solid transparent; transform: translateX(16px) translateY(-4px) rotate(30deg)\"></div></div><div style=\"margin-left: auto;\"> <div style=\" width: 0px; border-top: 8px solid #F4F4F4; border-right: 8px solid transparent; transform: translateY(16px);\"></div> <div style=\" background-color: #F4F4F4; flex-grow: 0; height: 12px; width: 16px; transform: translateY(-4px);\"></div> <div style=\" width: 0; height: 0; border-top: 8px solid #F4F4F4; border-left: 8px solid transparent; transform: translateY(-4px) translateX(8px);\"></div></div></div> <div style=\"display: flex; flex-direction: column; flex-grow: 1; justify-content: center; margin-bottom: 24px;\"> <div style=\" background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; margin-bottom: 6px; width: 224px;\"></div> <div style=\" background-color: #F4F4F4; border-radius: 4px; flex-grow: 0; height: 14px; width: 144px;\"></div></div></a><p style=\" color:#c9c8cd; font-family:Arial,sans-serif; font-size:14px; line-height:17px; margin-bottom:0; margin-top:8px; overflow:hidden; padding:8px 0 7px; text-align:center; text-overflow:ellipsis; white-space:nowrap;\"><a href=\"https://www.instagram.com/reel/COWmlFLB_7P/?utm_source=ig_embed&amp;utm_campaign=loading\" style=\" color:#c9c8cd; font-family:Arial,sans-serif; font-size:14px; font-style:normal; font-weight:normal; line-height:17px; text-decoration:none;\" target=\"_blank\">A post shared by BEAUTIFUL DESTINATIONS (@beautifuldestinations)</a></p></div></blockquote><script async src=\"//platform.instagram.com/en_US/embeds.js\"></script>",
  "thumbnail_url": "https://scontent.cdninstagram.com/v/t51.2885-15/e35/p480x480/180530301_500586847748346_9126801522499091678_n.jpg?tp=1&_nc_ht=scontent.cdninstagram.com&_nc_cat=1&_nc_ohc=Hunm2fHSbmQAX-Gcw6Y&edm=AMO9-JQAAAAA&ccb=7-4&oh=fa71df82e5189f6bd7d8424d78cbb22b&oe=609301A4&_nc_sid=b9f2ee",
  "thumbnail_width": 480,
  "thumbnail_height": 853
}
BODY;
				break;
			default:
				return new WP_Error( 'unexpected-http-request', 'Test is making an unexpected HTTP request.' );
		}
		// phpcs:enable

		return $response;
	}

	/**
	 * @covers ::jetpack_shortcode_instagram
	 */
	public function test_shortcode_instagram() {
		$instagram_url = 'https://www.instagram.com/p/BnMO9vRleEx/';
		$content       = '[instagram url="' . $instagram_url . '"]';

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString(
			'<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="' . $instagram_url,
			$shortcode_content
		);
	}

	/**
	 * Test different oEmbed URLs and their output.
	 *
	 * @covers ::jetpack_instagram_oembed_fetch_url
	 * @dataProvider get_instagram_urls
	 *
	 * @param string $original Instagram URL provided by user.
	 * @param string $expected Instagram URL embedded in the final post content.
	 */
	public function test_instagram_oembed_fetch_url( $original, $expected ) {
		global $post;

		$post = self::factory()->post->create_and_get( array( 'post_content' => $original ) );

		setup_postdata( $post );
		ob_start();
		the_content();
		$actual = ob_get_clean();
		wp_reset_postdata();

		$this->assertStringContainsString(
			'<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="' . $expected,
			$actual
		);
	}

	/**
	 * List of variation of Instagram embed URLs.
	 */
	public function get_instagram_urls() {
		return array(
			'simple_image_embed'            => array(
				'https://www.instagram.com/p/BnMO9vRleEx/',
				'https://www.instagram.com/p/BnMO9vRleEx/',
			),
			'instagram_url_with_query_args' => array(
				'https://www.instagram.com/p/BnMO9vRleEx/?utm_source=ig_web_copy_link',
				'https://www.instagram.com/p/BnMO9vRleEx/',
			),
			'video_embed'                   => array(
				'https://www.instagram.com/tv/BkQjCfsBIzi/',
				'https://www.instagram.com/tv/BkQjCfsBIzi/',
			),
			'reel_embed'                    => array(
				'https://www.instagram.com/reel/COWmlFLB_7P/',
				'https://www.instagram.com/reel/COWmlFLB_7P/',
			),
			'image_embed_with_username'     => array(
				'https://www.instagram.com/jeherve/p/BnMO9vRleEx/',
				'https://www.instagram.com/p/BnMO9vRleEx/',
			),
			'video_embed_with_username'     => array(
				'https://www.instagram.com/instagram/tv/BkQjCfsBIzi/',
				'https://www.instagram.com/tv/BkQjCfsBIzi/',
			),
		);
	}

	/**
	 * Uses a real HTTP request to Instagram's oEmbed endpoint.
	 *
	 * @see ::set_up()
	 * @covers ::jetpack_shortcode_instagram
	 * @group external-http
	 */
	public function test_shortcode_instagram_via_oembed_http_request() {
		$instagram_url = 'https://www.instagram.com/p/BnMO9vRleEx/';
		$content       = '[instagram url="' . $instagram_url . '"]';

		$shortcode_content = do_shortcode( $content );

		$this->assertStringContainsString(
			'<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="' . $instagram_url,
			$shortcode_content
		);
	}

	/**
	 * Gets the test data for test_shortcodes_instagram_amp().
	 *
	 * @return array The test data.
	 */
	public function get_instagram_amp_data() {
		$shortcode_id      = 'BnMOk_FFsxg';
		$url_with_id       = 'https://www.instagram.com/p/' . $shortcode_id;
		$short_url_with_id = 'https://instagr.am/p/' . $shortcode_id;
		$wrong_url_with_id = 'https://www.twitter.com/p/' . $shortcode_id;
		$default_height    = 600;

		return array(
			'no_attribute'                   => array(
				'[instagram]',
				'',
			),
			'plain_url'                      => array(
				'[instagram ' . $url_with_id . ']',
				'',
			),
			'non_instagram_url'              => array(
				'[instagram url=' . $wrong_url_with_id . ']',
				'',
			),
			'url_value_as_attribute'         => array(
				'[instagram url=' . $url_with_id . ']',
				'<amp-instagram data-shortcode="' . $shortcode_id . '" layout="responsive" width="' . self::CONTENT_WIDTH . '" height="' . $default_height . '" data-captioned></amp-instagram>',
			),
			'short_url_value_as_attribute'   => array(
				'[instagram url=' . $short_url_with_id . ']',
				'<amp-instagram data-shortcode="' . $shortcode_id . '" layout="responsive" width="' . self::CONTENT_WIDTH . '" height="' . $default_height . '" data-captioned></amp-instagram>',
			),
			'width_in_attributes'            => array(
				'[instagram url=' . $url_with_id . ' width=320]',
				'<amp-instagram data-shortcode="' . $shortcode_id . '" layout="responsive" width="320" height="' . $default_height . '" data-captioned></amp-instagram>',
			),
			'width_and_height_in_attributes' => array(
				'[instagram url=' . $url_with_id . ' width=320 height="200"]',
				'<amp-instagram data-shortcode="' . $shortcode_id . '" layout="responsive" width="320" height="200" data-captioned></amp-instagram>',
			),
			'0_width_in_attributes'          => array(
				'[instagram url=' . $url_with_id . ' width=0]',
				'<amp-instagram data-shortcode="' . $shortcode_id . '" layout="responsive" width="320" height="' . $default_height . '" data-captioned></amp-instagram>',
			),
		);
	}

	/**
	 * Test the AMP-compatible [instagram] shortcode on an AMP endpoint.
	 *
	 * @dataProvider get_instagram_amp_data
	 * @since 8.0.0
	 *
	 * @param string $shortcode_content The shortcode content, as entered in the editor.
	 * @param string $expected The expected return value of the function.
	 */
	public function test_shortcodes_instagram_amp( $shortcode_content, $expected ) {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			self::markTestSkipped( 'WordPress.com does not run the latest version of the AMP plugin yet.' );
			return;
		}

		$GLOBALS['content_width'] = self::CONTENT_WIDTH;
		add_filter( 'jetpack_is_amp_request', '__return_true' );
		$this->assertEquals( $expected, do_shortcode( $shortcode_content ) );
	}

	/**
	 * Test that the AMP [instagram] shortcode logic doesn't run on a non-AMP endpoint.
	 *
	 * @dataProvider get_instagram_amp_data
	 * @since 8.0.0
	 *
	 * @param string $shortcode_content The shortcode as entered in the editor.
	 */
	public function test_shortcodes_instagram_non_amp( $shortcode_content ) {
		add_filter( 'jetpack_is_amp_request', '__return_false' );
		$this->assertStringNotContainsString( 'amp-instagram', do_shortcode( $shortcode_content ) );
	}

	/**
	 * Test the build of a set of allowed parameters from a variety of inputs.
	 *
	 * @dataProvider get_instagram_parameters
	 * @covers ::jetpack_instagram_get_allowed_parameters
	 *
	 * @param string $url      URL of the content to be embedded.
	 * @param array  $atts     Shortcode attributes.
	 * @param array  $expected Array of expected parameters.
	 *
	 * @since 9.1.0
	 */
	public function test_shortcodes_instagram_allowed_parameters( $url, $atts, $expected ) {
		$GLOBALS['content_width'] = self::CONTENT_WIDTH;

		$actual = jetpack_instagram_get_allowed_parameters( $url, $atts );
		$this->assertEquals( $expected, $actual );
	}

	/**
	 * Variety of parameters available from an embed.
	 *
	 * @covers ::jetpack_instagram_get_allowed_parameters
	 *
	 * @since 9.1.0
	 */
	public function get_instagram_parameters() {
		$base_instagram_url = 'https://www.instagram.com/p/BnMOk_FFsxg';

		return array(
			'no_query_strings_no_atts'     => array(
				$base_instagram_url,
				array(),
				array(
					'url'         => $base_instagram_url,
					'width'       => self::CONTENT_WIDTH,
					'height'      => '',
					'hidecaption' => false,
				),
			),
			'invalid_query_string_no_atts' => array(
				$base_instagram_url . '?utm_source=ig_web_copy_link',
				array(),
				array(
					'url'         => $base_instagram_url,
					'width'       => self::CONTENT_WIDTH,
					'height'      => '',
					'hidecaption' => false,
				),
			),
			'invalid_query_string_hidecaption_string_no_atts' => array(
				$base_instagram_url . '?utm_source=ig_web_copy_link&hidecaption=true',
				array(),
				array(
					'url'         => $base_instagram_url,
					'width'       => self::CONTENT_WIDTH,
					'height'      => '',
					'hidecaption' => 'true',
				),
			),
			'hidecaption_string_no_atts'   => array(
				$base_instagram_url . '?hidecaption=true',
				array(),
				array(
					'url'         => $base_instagram_url,
					'width'       => self::CONTENT_WIDTH,
					'height'      => '',
					'hidecaption' => 'true',
				),
			),
			'hidecaption_att'              => array(
				$base_instagram_url,
				array(
					'hidecaption' => 'true',
				),
				array(
					'url'         => $base_instagram_url,
					'width'       => self::CONTENT_WIDTH,
					'height'      => '',
					'hidecaption' => 'true',
				),
			),
			'url_in_att_takes_precedence'  => array(
				'https://www.instagram.com/p/BnMO9vRleEx',
				array(
					'url' => $base_instagram_url,
				),
				array(
					'url'         => $base_instagram_url,
					'width'       => self::CONTENT_WIDTH,
					'height'      => '',
					'hidecaption' => false,
				),
			),
			'invalid_atts_in_url_att'      => array(
				$base_instagram_url,
				array(
					'url' => $base_instagram_url . '?utm_source=ig_web_copy_link',
				),
				array(
					'url'         => $base_instagram_url,
					'width'       => self::CONTENT_WIDTH,
					'height'      => '',
					'hidecaption' => false,
				),
			),
			'custom_width_att'             => array(
				$base_instagram_url,
				array(
					'width' => '420',
				),
				array(
					'url'         => $base_instagram_url,
					'width'       => 420,
					'height'      => '',
					'hidecaption' => false,
				),
			),
			'width_att_out_of_bounds'      => array(
				$base_instagram_url,
				array(
					'width' => '999',
				),
				array(
					'url'         => $base_instagram_url,
					'width'       => 698,
					'height'      => '',
					'hidecaption' => false,
				),
			),
			// Tests some bad URLs to confirm we don't parse them.
			'bad_url_1'                    => array(
				'https://instagram.com.evil.example.com/p/BnMOk_FFsxg',
				array(),
				array(),
			),
			'bad_url_2'                    => array(
				'https://not-really-instagr.am/p/BnMOk_FFsxg',
				array(),
				array(),
			),
		);
	}
}
