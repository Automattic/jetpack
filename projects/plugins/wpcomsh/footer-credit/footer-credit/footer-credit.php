<?php // phpcs:ignore Squiz.Commenting.FileComment.MissingPackageTag
/**
 * Plugin Name: Footer Credit
 * Description: Adjustable Footer Credit
 * Version: 0.4
 * Author: Automattic
 * Author URI: http://automattic.com/
 * License: GPLv2 or later
 */

/**
 * Replace footer credit text on WordPress.com
 * via wpcom_better_footer_credit_link filter in wp-content/blog-plugins/theme-optimizations.php
 *
 * @param string      $link Credit link HTML.
 * @param string|null $lang Language (e.g. 'zh-tw'), or null to detect language.
 *
 * @return string
 */
function footercredit_replace_credit( $link, $lang ) {
	$credit_option = get_option( 'footercredit' );

	if ( ! $credit_option || $credit_option === 'default' ) {
		if ( $link ) {
			return footercredit_make_credit_link_discoverable( $link );
		} else {
			$credit_option = 'powered';
		}
	}

	if ( $credit_option === 'hidden' ) {
		return '';
	}

	$options = footercredit_options();
	$credit  = $options[ $credit_option ] ?? null;
	$url     = apply_filters( 'wpcom_better_footer_credit_url', 'https://wordpress.com/?ref=footer_custom_' . $credit_option, $lang );

	// check for SVG option
	if ( $credit_option === 'svg' ) {
		$link = '<a href="' . esc_url( $url ) . '" title="' . esc_attr__( 'Create a website or blog at WordPress.com', 'wpcomsh' ) . '">' . footercredit_svg() . '</a>';
	} elseif ( $credit !== null ) {
		$link = '<a href="' . esc_url( $url ) . '">' . esc_html( $credit ) . '</a>.';
	} else {
		$link = '';
	}

	return footercredit_make_credit_link_discoverable( $link );
}
add_filter( 'wpcom_better_footer_credit_link', 'footercredit_replace_credit', 10, 2 );

/**
 * Make the footer credit link discoverable by adding data-type="footer-credit" attribute.
 *
 * @param string  $link Credit link HTML.
 * @param boolean $only_in_preview If false, force data-type attribute.
 *
 * @return string
 */
function footercredit_make_credit_link_discoverable( $link, $only_in_preview = true ) {
	if ( ! $only_in_preview || is_customize_preview() ) {
		// phpcs:ignore WordPress.WP.CapitalPDangit.MisspelledInText
		$link_regex = '#(<a)([^>]*href="https?://(?:www\.)?wordpress\.(?:com|org)[^"]*"[^>]*>)#i';
		$link       = preg_replace( $link_regex, '$1 data-type="footer-credit"$2', $link );
	}

	return $link;
}

/**
 * Replace theme credit text on WordPress.com
 * via wpcom_better_footer_theme_link filter in wp-content/blog-plugins/theme-optimizations.php
 *
 * @param  string $credit Original theme footer credit.
 *
 * @return string WordPress.com-ified footer credit.
 */
function footercredit_replace_theme( $credit ) {
	$credit_option = get_option( 'footercredit' );

	if ( ! $credit_option ) {
		return $credit;
	}

	if ( $credit_option !== 'hidden' ) {
		return $credit;
	}

	return '';
}
add_filter( 'wpcom_better_footer_theme_link', 'footercredit_replace_theme', 10, 2 );

/**
 * The footer credits available in the UI - add future options here
 *
 * @return array
 */
function footercredit_options() {
	$options = array(
		'com'     => 'WordPress.com',
		'svg'     => __( 'WordPress.com Logo', 'wpcomsh' ),
		'acom'    => __( 'A WordPress.com Website', 'wpcomsh' ),
		'blog'    => __( 'Blog at WordPress.com', 'wpcomsh' ),
		'powered' => __( 'Powered by WordPress.com', 'wpcomsh' ),
	);

	// In this section we override literal translations with better fitting ones, see
	// p58i-3Ld-p2#comment-32204

	switch ( get_locale() ) {

		case 'ar':
			$options['powered'] = 'مُقدَّم من WordPress.com'; // Powered by WordPress.com
			break;

		case 'de':
			$options['acom']    = 'Eine WordPress.com-Website'; // A WordPress.com website
			$options['blog']    = 'Bloggen bei WordPress.com'; // Blog at WordPress.com
			$options['powered'] = 'Erstellt mit WordPress.com'; // Made with WordPress.com
			break;

		case 'es':
			$options['acom']    = 'Un sitio web WordPress.com'; // A WordPress.com website
			$options['blog']    = 'Crea tu propio blog con WordPress.com'; // Build your own blog with WordPress.com
			$options['powered'] = 'Sitio web ofrecido por WordPress.com'; // Website powered by WordPress.com
			break;

		case 'fr':
			$options['acom']    = 'Un site WordPress.com'; // A WordPress.com website
			$options['blog']    = 'Commencez votre blog avec WordPress.com'; // Start blogging with WordPress.com
			$options['powered'] = 'Ce site vous est proposé par WordPress.com'; // This website is powered by WordPress.com
			break;

		case 'he':
			$options['acom']    = 'אחסון ב-WordPress.com'; // hosted by WordPress.com
			$options['blog']    = 'בלוגים ב-WordPress.com'; // blogs at WordPress.com
			$options['powered'] = 'מבית WordPress.com'; // powered by WordPress.com
			break;

		case 'id':
			$options['acom']    = 'Dibangun di WordPress.com'; // Created using WordPress.com
			$options['blog']    = 'Blog di WordPress.com'; // Blog at WordPress.com
			$options['powered'] = 'Dikelola oleh WordPress.com'; // Hosted by WordPress.com
			break;

		case 'it':
			$options['acom']    = 'Creato su WordPress.com'; // Created on WordPress.com
			$options['blog']    = 'Blog su WordPress.com'; // Blog built on WordPress.com
			$options['powered'] = 'Fornito da WordPress.com'; // Powered by WordPress.com
			break;

		case 'ko':
			$options['acom']    = 'WordPress.com 사이트'; // WordPress.com site
			$options['blog']    = 'WordPress.com 기반'; // Built on WordPress.com
			$options['powered'] = 'WordPress.com 사용'; // Enabled by Wordpress.com
			break;

		case 'nl':
			$options['acom']    = 'Een WordPress.com website'; // A WordPress.com site
			$options['blog']    = 'Maak een eigen blog op WordPress.com'; // Create your own blog at WordPress.com
			$options['powered'] = 'Mogelijk gemaakt door WordPress.com'; // Made possible by WordPress.com
			break;

		case 'pt-br':
			$options['acom']    = 'Site no WordPress.com'; // A WordPress.com site
			$options['blog']    = 'Escreva um blog: WordPress.com'; // Write a blog at WordPress.com
			$options['powered'] = 'Site hospedado por WordPress.com'; // Site hosted by WordPress.com
			break;

		case 'ru':
			$options['acom']    = 'Сайт WordPress.com'; // WordPress.com site
			$options['blog']    = 'Ваш собственный блог на WordPress.com'; // Your own blog on WordPress.com
			$options['powered'] = 'На платформе WordPress.com'; // Hosted by WordPress.com
			break;

		case 'sv':
			$options['acom']    = 'En WordPress.com-webbplats'; // A WordPress.com site
			$options['blog']    = 'Bloggen bor hos WordPress.com'; // This blog lives at WordPress.com
			$options['powered'] = 'Med kraft från WordPress.com'; // With power from WordPress
			break;

		case 'tr':
			$options['acom']    = 'Bir WordPress.com sitenin'; // A WordPress.com site
			$options['powered'] = 'Bu sitenin arkasında WordPress.com\'un gücü var'; // This site is powered by WordPress.com
			break;

		case 'zh-cn':
			$options['acom']    = '本站由 WordPress.com 托管'; // Site hosted by WordPress.com
			$options['blog']    = '在 WordPress.com 玩转博客'; // Have fun blogging with WordPress.com
			$options['powered'] = '本站由 WordPress.com 托管'; // Site hosted by WordPress.com
			break;

		case 'zh-tw':
			$options['blog'] = '在 WordPress.com 建立免費網站或網誌。'; // Create a free website or blog at WordPress.com
			break;
	}

	return $options;
}

/**
 * Output a small SVG for the WordCamp Logo
 *
 * @return string
 */
function footercredit_svg() {
	return '<svg style="fill: currentColor; position: relative; top: 1px;" width="14px" height="15px" viewBox="0 0 14 15" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-labelledby="title" role="img">
			<title id="title">' . esc_html__( 'Create a website or blog at WordPress.com', 'wpcomsh' ) . '</title>
			<path d="M12.5225848,4.97949746 C13.0138466,5.87586309 13.2934037,6.90452431 13.2934037,7.99874074 C13.2934037,10.3205803 12.0351007,12.3476807 10.1640538,13.4385638 L12.0862862,7.88081544 C12.4453251,6.98296834 12.5648813,6.26504621 12.5648813,5.62667922 C12.5648813,5.39497674 12.549622,5.17994084 12.5225848,4.97949746 L12.5225848,4.97949746 Z M7.86730089,5.04801561 C8.24619178,5.02808979 8.58760099,4.98823815 8.58760099,4.98823815 C8.9267139,4.94809022 8.88671369,4.44972248 8.54745263,4.46957423 C8.54745263,4.46957423 7.52803983,4.54957381 6.86996227,4.54957381 C6.25158863,4.54957381 5.21247202,4.46957423 5.21247202,4.46957423 C4.87306282,4.44972248 4.83328483,4.96816418 5.17254589,4.98823815 C5.17254589,4.98823815 5.49358462,5.02808979 5.83269753,5.04801561 L6.81314716,7.73459399 L5.43565839,11.8651647 L3.14394256,5.04801561 C3.52312975,5.02808979 3.86416859,4.98823815 3.86416859,4.98823815 C4.20305928,4.94809022 4.16305906,4.44972248 3.82394616,4.46957423 C3.82394616,4.46957423 2.80475558,4.54957381 2.14660395,4.54957381 C2.02852925,4.54957381 1.88934333,4.54668493 1.74156477,4.54194422 C2.86690406,2.83350881 4.80113651,1.70529256 6.99996296,1.70529256 C8.638342,1.70529256 10.1302017,2.33173369 11.2498373,3.35765419 C11.222726,3.35602457 11.1962815,3.35261718 11.1683554,3.35261718 C10.5501299,3.35261718 10.1114609,3.89113285 10.1114609,4.46957423 C10.1114609,4.98823815 10.4107217,5.42705065 10.7296864,5.94564049 C10.969021,6.36482346 11.248578,6.90326506 11.248578,7.68133501 C11.248578,8.21992476 11.0413918,8.84503256 10.7696866,9.71584277 L10.1417574,11.8132391 L7.86730089,5.04801561 Z M6.99996296,14.2927074 C6.38218192,14.2927074 5.78595654,14.2021153 5.22195356,14.0362644 L7.11048207,8.54925635 L9.04486267,13.8491542 C9.05760348,13.8802652 9.07323319,13.9089317 9.08989995,13.9358945 C8.43574834,14.1661896 7.73285573,14.2927074 6.99996296,14.2927074 L6.99996296,14.2927074 Z M0.706448182,7.99874074 C0.706448182,7.08630113 0.902152921,6.22015756 1.25141403,5.43749503 L4.25357806,13.6627848 C2.15393732,12.6427902 0.706448182,10.4898387 0.706448182,7.99874074 L0.706448182,7.99874074 Z M6.99996296,0.999 C3.14016476,0.999 0,4.13905746 0,7.99874074 C0,11.8585722 3.14016476,14.999 6.99996296,14.999 C10.8596871,14.999 14,11.8585722 14,7.99874074 C14,4.13905746 10.8596871,0.999 6.99996296,0.999 L6.99996296,0.999 Z" id="wordpress-logo-simplified-cmyk" stroke="none" fill=“currentColor” fill-rule="evenodd"></path>
		</svg>';
}

require_once __DIR__ . '/customizer.php';
