<?php
/**
 * Welcome Page Class
 *
 * Shows a feature overview for the new version (major) and credits.
 *
 * Adapted from code in EDD (Copyright (c) 2012, Pippin Williamson) and WP.
 *
 * @author      WooThemes
 * @category    Admin
 * @package     WooCommerce/Admin
 * @version     2.3.0
*/

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

/**
 * WC_Admin_Welcome class
 */
class WC_Admin_Welcome {

	/**
	 * Hook in tabs.
	 */
	public function __construct() {
		add_action( 'admin_menu', array( $this, 'admin_menus') );
		add_action( 'admin_head', array( $this, 'admin_head' ) );
		add_action( 'admin_init', array( $this, 'welcome'    ) );
	}

	/**
	 * Add admin menus/screens.
	 */
	public function admin_menus() {

		if ( empty( $_GET['page'] ) ) {
			return;
		}

		$welcome_page_name  = __( 'About WooCommerce', 'woocommerce' );
		$welcome_page_title = __( 'Welcome to WooCommerce', 'woocommerce' );

		switch ( $_GET['page'] ) {
			case 'wc-about' :
				$page = add_dashboard_page( $welcome_page_title, $welcome_page_name, 'manage_options', 'wc-about', array( $this, 'about_screen' ) );
				add_action( 'admin_print_styles-' . $page, array( $this, 'admin_css' ) );
			break;
			case 'wc-credits' :
				$page = add_dashboard_page( $welcome_page_title, $welcome_page_name, 'manage_options', 'wc-credits', array( $this, 'credits_screen' ) );
				add_action( 'admin_print_styles-' . $page, array( $this, 'admin_css' ) );
			break;
			case 'wc-translators' :
				$page = add_dashboard_page( $welcome_page_title, $welcome_page_name, 'manage_options', 'wc-translators', array( $this, 'translators_screen' ) );
				add_action( 'admin_print_styles-' . $page, array( $this, 'admin_css' ) );
			break;
		}
	}

	/**
	 * admin_css function.
	 */
	public function admin_css() {
		wp_enqueue_style( 'woocommerce-activation', WC()->plugin_url() . '/assets/css/activation.css', array(), WC_VERSION );
	}

	/**
	 * Add styles just for this page, and remove dashboard page links.
	 */
	public function admin_head() {
		remove_submenu_page( 'index.php', 'wc-about' );
		remove_submenu_page( 'index.php', 'wc-credits' );
		remove_submenu_page( 'index.php', 'wc-translators' );

		?>
		<style type="text/css">
			/*<![CDATA[*/
			.wc-badge:before {
				font-family: WooCommerce !important;
				content: "\e03d";
				color: #fff;
				-webkit-font-smoothing: antialiased;
				-moz-osx-font-smoothing: grayscale;
				font-size: 80px;
				font-weight: normal;
				width: 165px;
				height: 165px;
				line-height: 165px;
				text-align: center;
				position: absolute;
				top: 0;
				<?php echo is_rtl() ? 'right' : 'left'; ?>: 0;
				margin: 0;
				vertical-align: middle;
			}
			.wc-badge {
				position: relative;
				background: #9c5d90;
				text-rendering: optimizeLegibility;
				padding-top: 150px;
				height: 52px;
				width: 165px;
				font-weight: 600;
				font-size: 14px;
				text-align: center;
				color: #ddc8d9;
				margin: 5px 0 0 0;
				-webkit-box-shadow: 0 1px 3px rgba(0,0,0,.2);
				box-shadow: 0 1px 3px rgba(0,0,0,.2);
			}
			.about-wrap .wc-badge {
				position: absolute;
				top: 0;
				<?php echo is_rtl() ? 'left' : 'right'; ?>: 0;
			}
			.about-wrap .wc-feature {
				overflow: visible !important;
				*zoom:1;
			}
			.about-wrap h3 + .wc-feature {
				margin-top: 0;
			}
			.about-wrap .wc-feature:before,
			.about-wrap .wc-feature:after {
				content: " ";
				display: table;
			}
			.about-wrap .wc-feature:after {
				clear: both;
			}
			.about-wrap .feature-rest div {
				width: 50% !important;
				padding-<?php echo is_rtl() ? 'left' : 'right'; ?>: 100px;
				-moz-box-sizing: border-box;
				box-sizing: border-box;
				margin: 0 !important;
			}
			.about-wrap .feature-rest div.last-feature {
				padding-<?php echo is_rtl() ? 'right' : 'left'; ?>: 100px;
				padding-<?php echo is_rtl() ? 'left' : 'right'; ?>: 0;
			}
			.about-wrap div.icon {
				width: 0 !important;
				padding: 0;
				margin: 20px 0 !important;
			}
			.about-wrap .feature-rest div.icon:before {
				font-family: WooCommerce !important;
				font-weight: normal;
				width: 100%;
				font-size: 170px;
				line-height: 125px;
				color: #9c5d90;
				display: inline-block;
				position: relative;
				text-align: center;
				speak: none;
				margin: <?php echo is_rtl() ? '0 -100px 0 0' : '0 0 0 -100px'; ?>;
				content: "\e01d";
				-webkit-font-smoothing: antialiased;
				-moz-osx-font-smoothing: grayscale;
			}
			.about-integrations {
				background: #fff;
				margin: 20px 0;
				padding: 1px 20px 10px;
			}
			.changelog h4 {
				line-height: 1.4;
			}
			/*]]>*/
		</style>
		<?php
	}

	/**
	 * Intro text/links shown on all about pages.
	 */
	private function intro() {

		// Flush after upgrades
		if ( ! empty( $_GET['wc-updated'] ) || ! empty( $_GET['wc-installed'] ) ) {
			flush_rewrite_rules();
		}

		// Drop minor version if 0
		$major_version = substr( WC()->version, 0, 3 );

		// Random tweet - must be kept to 102 chars to "fit"
		$tweets        = array(
			'WooCommerce kickstarts online stores. It\'s free and has been downloaded over 6 million times.',
			'Building an online store? WooCommerce is the leading #eCommerce plugin for WordPress (and it\'s free).',
			'WooCommerce is a free #eCommerce plugin for #WordPress for selling #allthethings online, beautifully.',
			'Ready to ship your idea? WooCommerce is the fastest growing #eCommerce plugin for WordPress on the web'
		);
		shuffle( $tweets );
		?>
		<h1><?php printf( __( 'Welcome to WooCommerce %s', 'woocommerce' ), $major_version ); ?></h1>

		<div class="about-text woocommerce-about-text">
			<?php
				if ( ! empty( $_GET['wc-installed'] ) ) {
					$message = __( 'Thanks, all done!', 'woocommerce' );
				} elseif ( ! empty( $_GET['wc-updated'] ) ) {
					$message = __( 'Thank you for updating to the latest version!', 'woocommerce' );
				} else {
					$message = __( 'Thanks for installing!', 'woocommerce' );
				}

				printf( __( '%s WooCommerce %s is more powerful, stable and secure than ever before. We hope you enjoy using it.', 'woocommerce' ), $message, $major_version );
			?>
		</div>

		<div class="wc-badge"><?php printf( __( 'Version %s', 'woocommerce' ), WC()->version ); ?></div>

		<p class="woocommerce-actions">
			<a href="<?php echo admin_url('admin.php?page=wc-settings'); ?>" class="button button-primary"><?php _e( 'Settings', 'woocommerce' ); ?></a>
			<a href="<?php echo esc_url( apply_filters( 'woocommerce_docs_url', 'http://docs.woothemes.com/documentation/plugins/woocommerce/', 'woocommerce' ) ); ?>" class="docs button button-primary"><?php _e( 'Docs', 'woocommerce' ); ?></a>
			<a href="https://twitter.com/share" class="twitter-share-button" data-url="http://www.woothemes.com/woocommerce/" data-text="<?php echo esc_attr( $tweets[0] ); ?>" data-via="WooThemes" data-size="large">Tweet</a>
			<script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="//platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");</script>
		</p>

		<h2 class="nav-tab-wrapper">
			<a class="nav-tab <?php if ( $_GET['page'] == 'wc-about' ) echo 'nav-tab-active'; ?>" href="<?php echo esc_url( admin_url( add_query_arg( array( 'page' => 'wc-about' ), 'index.php' ) ) ); ?>">
				<?php _e( "What's New", 'woocommerce' ); ?>
			</a><a class="nav-tab <?php if ( $_GET['page'] == 'wc-credits' ) echo 'nav-tab-active'; ?>" href="<?php echo esc_url( admin_url( add_query_arg( array( 'page' => 'wc-credits' ), 'index.php' ) ) ); ?>">
				<?php _e( 'Credits', 'woocommerce' ); ?>
			</a><a class="nav-tab <?php if ( $_GET['page'] == 'wc-translators' ) echo 'nav-tab-active'; ?>" href="<?php echo esc_url( admin_url( add_query_arg( array( 'page' => 'wc-translators' ), 'index.php' ) ) ); ?>">
				<?php _e( 'Translators', 'woocommerce' ); ?>
			</a>
		</h2>
		<?php
	}

	/**
	 * Output the about screen.
	 */
	public function about_screen() {
		?>
		<div class="wrap about-wrap">

			<?php $this->intro(); ?>

			<!--<div class="changelog point-releases"></div>-->

			<div class="changelog">
				<h4><?php _e( 'UI Overhaul', 'woocommerce' ); ?></h4>
				<p><?php _e( 'We\'ve updated the user interface on both the front and backend of WooCommerce 2.3 "Handsome Hippo".', 'woocommerce' ); ?></p>

				<div class="changelog about-integrations">
					<div class="wc-feature feature-section col three-col">
						<div>
							<h4><?php _e( 'Frontend UI Improvements', 'woocommerce' ); ?></h4>
							<p><?php _e( 'On the frontend there are several UX enhancements such as the undo-remove-from cart link and responsive table design as well as a fresh, modern look which meshes more fluidly with the current design trends of default WordPress themes.', 'woocommerce' ); ?></p>
						</div>
						<div>
							<h4><?php _e( 'Backend UI Improvements', 'woocommerce' ); ?></h4>
							<p><?php _e( 'On the backend, settings have been re-organised and perform better on hand-held devices for an all round improved user experience. ', 'woocommerce' ); ?></p>
						</div>
						<div class="last-feature">
							<h4><?php _e( 'Webhooks UI', 'woocommerce' ); ?></h4>
						<p><?php printf( __( 'As part of the API, we\'ve introduced a UI for the Webhook system in WooCommerce 2.3. This makes it easier for 3rd party apps to integrate with WooCommerce. Read more in our %sdocs%s.', 'woocommerce' ), '<a href="http://docs.woothemes.com/document/webhooks/">', '</a>' ); ?></p>
						</div>
					</div>
				</div>
			</div>
			<div class="changelog">
				<div class="feature-section col three-col">
					<div>
						<h4><?php _e( 'Geo-locating Customer Location', 'woocommerce' ); ?></h4>
						<p><?php printf( __( 'We have added a new option to geolocate the "Default Customer Location". Coupled with ability to show taxes in your store based on this location, you can show relevant prices store-wide. Enable this in the %ssettings%s.', 'woocommerce' ), '<a href="' . admin_url( 'admin.php?page=wc-settings&tab=tax' ) . '">', '</a>' ); ?></p>
					</div>
					<div>
						<h4><?php _e( 'Color Customization', 'woocommerce' ); ?></h4>
						<p><?php printf( __( 'If you\'re looking to customise the look and feel of the frontend in 2.3, take a look at the free %sWooCommerce Colors plugin%s. This lets you change the colors with a live preview.', 'woocommerce' ), '<a href="https://wordpress.org/plugins/woocommerce-colors/">', '</a>' ); ?></p>
					</div>
					<div class="last-feature">
						<h4><?php _e( 'Improved Reports', 'woocommerce' ); ?></h4>
						<p><?php _e( 'Sales reports can now show net and gross amounts, we\'ve added a print stylesheet, and added extra data on refunds to reports.', 'woocommerce' ); ?></p>
					</div>
				</div>
				<div class="feature-section col three-col">
					<div>
						<h4><?php _e( 'Improved Simplify Gateway', 'woocommerce' ); ?></h4>
						<p><?php printf( __( 'The built in Simplify Commerce Gateway (available in the US) now supports %sHosted Payments%s - a PCI Compliant hosted payment platform.', 'woocommerce' ), '<a href="https://www.simplify.com/commerce/docs/tools/hosted-payments">', '</a>' ); ?></p>
					</div>
					<div>
						<h4><?php _e( 'Email Template Improvements', 'woocommerce' ); ?></h4>
						<p><?php printf( __( 'To make email customization simpler, we\'ve included a CSS Inliner in this release, some new template files for styling emails, and some additional hooks for developers. Read more on our %sdeveloper blog%s.', 'woocommerce' ), '<a href="http://develop.woothemes.com/woocommerce/2014/10/2-3-emails/">', '</a>' ); ?></p>
					</div>
					<div class="last-feature">
						<h4><?php _e( 'Simplified Coupon System', 'woocommerce' ); ?></h4>
						<p><?php printf( __( 'We have simplified the coupon system to ensure discounts are never applied to taxes, and we\'ve improved support for discounting products inclusive of tax. Read more on our %sdevelop blog%s.', 'woocommerce' ), '<a href="http://develop.woothemes.com/woocommerce/2014/12/upcoming-coupon-changes-in-woocommerce-2-3/">', '</a>' ); ?></p>
					</div>
				</div>
			</div>

			<hr />

			<div class="return-to-dashboard">
				<a href="<?php echo esc_url( admin_url( add_query_arg( array( 'page' => 'wc-settings' ), 'admin.php' ) ) ); ?>"><?php _e( 'Go to WooCommerce Settings', 'woocommerce' ); ?></a>
			</div>
		</div>
		<?php
	}

	/**
	 * Output the credits screen.
	 */
	public function credits_screen() {
		?>
		<div class="wrap about-wrap">

			<?php $this->intro(); ?>

			<p class="about-description"><?php printf( __( 'WooCommerce is developed and maintained by a worldwide team of passionate individuals and backed by an awesome developer community. Want to see your name? <a href="%s">Contribute to WooCommerce</a>.', 'woocommerce' ), 'https://github.com/woothemes/woocommerce/blob/master/CONTRIBUTING.md' ); ?></p>

			<?php echo $this->contributors(); ?>
		</div>
		<?php
	}

	/**
	 * Output the translators screen.
	 */
	public function translators_screen() {
		?>
		<div class="wrap about-wrap">

			<?php $this->intro(); ?>

			<p class="about-description"><?php printf( __( 'WooCommerce has been kindly translated into several other languages thanks to our translation team. Want to see your name? <a href="%s">Translate WooCommerce</a>.', 'woocommerce' ), 'https://www.transifex.com/projects/p/woocommerce/' ); ?></p>

			<?php
				// Have to use this to get the list until the API is open...
				/*
				$contributor_json = json_decode( 'string from https://www.transifex.com/api/2/project/woocommerce/languages/', true );

				$contributors = array();

				foreach ( $contributor_json as $group ) {
					$contributors = array_merge( $contributors, $group['coordinators'], $group['reviewers'], $group['translators'] );
				}

				$contributors = array_filter( array_unique( $contributors ) );

				natsort( $contributors );

				foreach ( $contributors as $contributor ) {
					echo htmlspecialchars( '<a href="https://www.transifex.com/accounts/profile/' . $contributor . '">' . $contributor . '</a>, ' );
				}
				*/
			?>

			<p class="wp-credits-list">
				<a href="https://www.transifex.com/accounts/profile/ABSOLUTE_Web">ABSOLUTE_Web</a>, <a href="https://www.transifex.com/accounts/profile/AIRoman">AIRoman</a>, <a href="https://www.transifex.com/accounts/profile/ANNEMARIEDEHAAN11">ANNEMARIEDEHAAN11</a>, <a href="https://www.transifex.com/accounts/profile/Abdumejid">Abdumejid</a>, <a href="https://www.transifex.com/accounts/profile/Adam_Bajer">Adam_Bajer</a>, <a href="https://www.transifex.com/accounts/profile/AeAdawi">AeAdawi</a>, <a href="https://www.transifex.com/accounts/profile/Aerendir">Aerendir</a>, <a href="https://www.transifex.com/accounts/profile/Ahmed_Na">Ahmed_Na</a>, <a href="https://www.transifex.com/accounts/profile/AlexSunnO">AlexSunnO</a>, <a href="https://www.transifex.com/accounts/profile/Aliom">Aliom</a>, <a href="https://www.transifex.com/accounts/profile/Almaz">Almaz</a>, <a href="https://www.transifex.com/accounts/profile/Ana_Sofia_Figueiredo">Ana_Sofia_Figueiredo</a>, <a href="https://www.transifex.com/accounts/profile/Andriy.Gusak">Andriy.Gusak</a>, <a href="https://www.transifex.com/accounts/profile/AngeloLazzari">AngeloLazzari</a>, <a href="https://www.transifex.com/accounts/profile/Anne19">Anne19</a>, <a href="https://www.transifex.com/accounts/profile/Apelsinova">Apelsinova</a>, <a href="https://www.transifex.com/accounts/profile/ArtGoddess">ArtGoddess</a>, <a href="https://www.transifex.com/accounts/profile/Ashleyking">Ashleyking</a>, <a href="https://www.transifex.com/accounts/profile/AslanDoma">AslanDoma</a>, <a href="https://www.transifex.com/accounts/profile/Axium">Axium</a>, <a href="https://www.transifex.com/accounts/profile/BaronAndrea">BaronAndrea</a>, <a href="https://www.transifex.com/accounts/profile/Bhuvanendran">Bhuvanendran</a>, <a href="https://www.transifex.com/accounts/profile/Bitly">Bitly</a>, <a href="https://www.transifex.com/accounts/profile/BlackJad">BlackJad</a>, <a href="https://www.transifex.com/accounts/profile/Bogusław">Bogusław</a>, <a href="https://www.transifex.com/accounts/profile/CVSz">CVSz</a>, <a href="https://www.transifex.com/accounts/profile/Chaos">Chaos</a>, <a href="https://www.transifex.com/accounts/profile/Chea">Chea</a>, <a href="https://www.transifex.com/accounts/profile/Clausen">Clausen</a>, <a href="https://www.transifex.com/accounts/profile/Closemarketing">Closemarketing</a>, <a href="https://www.transifex.com/accounts/profile/CoachBirgit">CoachBirgit</a>, <a href="https://www.transifex.com/accounts/profile/CodeSupply">CodeSupply</a>, <a href="https://www.transifex.com/accounts/profile/Compute">Compute</a>, <a href="https://www.transifex.com/accounts/profile/CreativeAngels">CreativeAngels</a>, <a href="https://www.transifex.com/accounts/profile/DAJOHH">DAJOHH</a>, <a href="https://www.transifex.com/accounts/profile/DJIO">DJIO</a>, <a href="https://www.transifex.com/accounts/profile/DNCTrung">DNCTrung</a>, <a href="https://www.transifex.com/accounts/profile/Dandebortoli">Dandebortoli</a>, <a href="https://www.transifex.com/accounts/profile/DanielDoinitsin">DanielDoinitsin</a>, <a href="https://www.transifex.com/accounts/profile/Davidinosuper">Davidinosuper</a>, <a href="https://www.transifex.com/accounts/profile/Didierjr">Didierjr</a>, <a href="https://www.transifex.com/accounts/profile/Dimis13">Dimis13</a>, <a href="https://www.transifex.com/accounts/profile/Dmitrijb3">Dmitrijb3</a>, <a href="https://www.transifex.com/accounts/profile/Dorawiniweb">Dorawiniweb</a>, <a href="https://www.transifex.com/accounts/profile/Ekushey">Ekushey</a>, <a href="https://www.transifex.com/accounts/profile/EmilEriksen">EmilEriksen</a>, <a href="https://www.transifex.com/accounts/profile/Ewald">Ewald</a>, <a href="https://www.transifex.com/accounts/profile/Falk">Falk</a>, <a href="https://www.transifex.com/accounts/profile/FaniDesign">FaniDesign</a>, <a href="https://www.transifex.com/accounts/profile/Fdu4">Fdu4</a>, <a href="https://www.transifex.com/accounts/profile/Flobin">Flobin</a>, <a href="https://www.transifex.com/accounts/profile/Flums">Flums</a>, <a href="https://www.transifex.com/accounts/profile/FrancoBaccarini">FrancoBaccarini</a>, <a href="https://www.transifex.com/accounts/profile/FrederikRS">FrederikRS</a>, <a href="https://www.transifex.com/accounts/profile/Fredev">Fredev</a>, <a href="https://www.transifex.com/accounts/profile/GabrielGil">GabrielGil</a>, <a href="https://www.transifex.com/accounts/profile/GeertDD">GeertDD</a>, <a href="https://www.transifex.com/accounts/profile/Gerelywave">Gerelywave</a>, <a href="https://www.transifex.com/accounts/profile/GhiMax">GhiMax</a>, <a href="https://www.transifex.com/accounts/profile/Gonzalez74">Gonzalez74</a>, <a href="https://www.transifex.com/accounts/profile/Graffen">Graffen</a>, <a href="https://www.transifex.com/accounts/profile/Graya">Graya</a>, <a href="https://www.transifex.com/accounts/profile/Griga_M">Griga_M</a>, <a href="https://www.transifex.com/accounts/profile/Grześ">Grześ</a>, <a href="https://www.transifex.com/accounts/profile/GsC.Servers">GsC.Servers</a>, <a href="https://www.transifex.com/accounts/profile/Gustavogcps">Gustavogcps</a>, <a href="https://www.transifex.com/accounts/profile/Gyan">Gyan</a>, <a href="https://www.transifex.com/accounts/profile/HanySamir">HanySamir</a>, <a href="https://www.transifex.com/accounts/profile/Harmke">Harmke</a>, <a href="https://www.transifex.com/accounts/profile/HelgaRakel">HelgaRakel</a>, <a href="https://www.transifex.com/accounts/profile/Ian_Razwadowski">Ian_Razwadowski</a>, <a href="https://www.transifex.com/accounts/profile/JKKim">JKKim</a>, <a href="https://www.transifex.com/accounts/profile/Jacobo91">Jacobo91</a>, <a href="https://www.transifex.com/accounts/profile/JamesIng">JamesIng</a>, <a href="https://www.transifex.com/accounts/profile/Janjaapvandijk">Janjaapvandijk</a>, <a href="https://www.transifex.com/accounts/profile/JapanStaff">JapanStaff</a>, <a href="https://www.transifex.com/accounts/profile/JoakimAndersen">JoakimAndersen</a>, <a href="https://www.transifex.com/accounts/profile/Joao_Ernani_A_Costa_Jr">Joao_Ernani_A_Costa_Jr</a>, <a href="https://www.transifex.com/accounts/profile/Joeri">Joeri</a>, <a href="https://www.transifex.com/accounts/profile/JohnRevel">JohnRevel</a>, <a href="https://www.transifex.com/accounts/profile/Josebash">Josebash</a>, <a href="https://www.transifex.com/accounts/profile/KennethJ">KennethJ</a>, <a href="https://www.transifex.com/accounts/profile/Kiba_No_Ou">Kiba_No_Ou</a>, <a href="https://www.transifex.com/accounts/profile/Kind">Kind</a>, <a href="https://www.transifex.com/accounts/profile/Komarovski">Komarovski</a>, <a href="https://www.transifex.com/accounts/profile/LUCIANO19731973">LUCIANO19731973</a>, <a href="https://www.transifex.com/accounts/profile/LaraPinheiros">LaraPinheiros</a>, <a href="https://www.transifex.com/accounts/profile/Lazybadger">Lazybadger</a>, <a href="https://www.transifex.com/accounts/profile/Leones">Leones</a>, <a href="https://www.transifex.com/accounts/profile/LeviMoore">LeviMoore</a>, <a href="https://www.transifex.com/accounts/profile/M.Mellet">M.Mellet</a>, <a href="https://www.transifex.com/accounts/profile/MPV3">MPV3</a>, <a href="https://www.transifex.com/accounts/profile/MadkingWebDesign">MadkingWebDesign</a>, <a href="https://www.transifex.com/accounts/profile/MajaM">MajaM</a>, <a href="https://www.transifex.com/accounts/profile/Maris">Maris</a>, <a href="https://www.transifex.com/accounts/profile/Mastersky">Mastersky</a>, <a href="https://www.transifex.com/accounts/profile/MennStudio">MennStudio</a>, <a href="https://www.transifex.com/accounts/profile/MichalStarybrat">MichalStarybrat</a>, <a href="https://www.transifex.com/accounts/profile/Miefos">Miefos</a>, <a href="https://www.transifex.com/accounts/profile/Miodrag018">Miodrag018</a>, <a href="https://www.transifex.com/accounts/profile/MondayStar">MondayStar</a>, <a href="https://www.transifex.com/accounts/profile/Moo">Moo</a>, <a href="https://www.transifex.com/accounts/profile/Morten">Morten</a>, <a href="https://www.transifex.com/accounts/profile/Mourid">Mourid</a>, <a href="https://www.transifex.com/accounts/profile/NANARUIZS1989">NANARUIZS1989</a>, <a href="https://www.transifex.com/accounts/profile/Nael.Marcos">Nael.Marcos</a>, <a href="https://www.transifex.com/accounts/profile/NeoTrafy">NeoTrafy</a>, <a href="https://www.transifex.com/accounts/profile/Nettpilot">Nettpilot</a>, <a href="https://www.transifex.com/accounts/profile/Networe">Networe</a>, <a href="https://www.transifex.com/accounts/profile/OBenned">OBenned</a>, <a href="https://www.transifex.com/accounts/profile/OttNorml">OttNorml</a>, <a href="https://www.transifex.com/accounts/profile/OxygenPlus">OxygenPlus</a>, <a href="https://www.transifex.com/accounts/profile/PSmolic">PSmolic</a>, <a href="https://www.transifex.com/accounts/profile/Pal74">Pal74</a>, <a href="https://www.transifex.com/accounts/profile/PanglimaKumbang">PanglimaKumbang</a>, <a href="https://www.transifex.com/accounts/profile/PhantasyPhockPhaze">PhantasyPhockPhaze</a>, <a href="https://www.transifex.com/accounts/profile/Piotr_D">Piotr_D</a>, <a href="https://www.transifex.com/accounts/profile/Piotrek290">Piotrek290</a>, <a href="https://www.transifex.com/accounts/profile/Promosnet">Promosnet</a>, <a href="https://www.transifex.com/accounts/profile/Pytlas">Pytlas</a>, <a href="https://www.transifex.com/accounts/profile/Rai">Rai</a>, <a href="https://www.transifex.com/accounts/profile/RaivisKa">RaivisKa</a>, <a href="https://www.transifex.com/accounts/profile/Rakhmanov">Rakhmanov</a>, <a href="https://www.transifex.com/accounts/profile/RealFugu">RealFugu</a>, <a href="https://www.transifex.com/accounts/profile/Rhys">Rhys</a>, <a href="https://www.transifex.com/accounts/profile/RicaNeaga">RicaNeaga</a>, <a href="https://www.transifex.com/accounts/profile/Ricky1990">Ricky1990</a>, <a href="https://www.transifex.com/accounts/profile/RistoNiinemets">RistoNiinemets</a>, <a href="https://www.transifex.com/accounts/profile/Rudimidtgaard">Rudimidtgaard</a>, <a href="https://www.transifex.com/accounts/profile/Samf">Samf</a>, <a href="https://www.transifex.com/accounts/profile/SamuelMunch">SamuelMunch</a>, <a href="https://www.transifex.com/accounts/profile/Sasni">Sasni</a>, <a href="https://www.transifex.com/accounts/profile/Se7enTime">Se7enTime</a>, <a href="https://www.transifex.com/accounts/profile/SeaBiz">SeaBiz</a>, <a href="https://www.transifex.com/accounts/profile/Seonxue">Seonxue</a>, <a href="https://www.transifex.com/accounts/profile/SergeyBiryukov">SergeyBiryukov</a>, <a href="https://www.transifex.com/accounts/profile/Shimlesha">Shimlesha</a>, <a href="https://www.transifex.com/accounts/profile/SilverXp">SilverXp</a>, <a href="https://www.transifex.com/accounts/profile/SinisaMFS">SinisaMFS</a>, <a href="https://www.transifex.com/accounts/profile/SkyHiRider">SkyHiRider</a>, <a href="https://www.transifex.com/accounts/profile/Sluca">Sluca</a>, <a href="https://www.transifex.com/accounts/profile/SzLegradi">SzLegradi</a>, <a href="https://www.transifex.com/accounts/profile/Tarantulo">Tarantulo</a>, <a href="https://www.transifex.com/accounts/profile/TeoThemes">TeoThemes</a>, <a href="https://www.transifex.com/accounts/profile/Thalitapinheiro">Thalitapinheiro</a>, <a href="https://www.transifex.com/accounts/profile/TheBags">TheBags</a>, <a href="https://www.transifex.com/accounts/profile/TheJoe">TheJoe</a>, <a href="https://www.transifex.com/accounts/profile/TheNominated">TheNominated</a>, <a href="https://www.transifex.com/accounts/profile/ThemeBoy">ThemeBoy</a>, <a href="https://www.transifex.com/accounts/profile/ThomasHjorth">ThomasHjorth</a>, <a href="https://www.transifex.com/accounts/profile/TomiToivio">TomiToivio</a>, <a href="https://www.transifex.com/accounts/profile/TopOSScz">TopOSScz</a>, <a href="https://www.transifex.com/accounts/profile/Triheads">Triheads</a>, <a href="https://www.transifex.com/accounts/profile/Truerick">Truerick</a>, <a href="https://www.transifex.com/accounts/profile/TungLampham">TungLampham</a>, <a href="https://www.transifex.com/accounts/profile/Updulah">Updulah</a>, <a href="https://www.transifex.com/accounts/profile/UrgentTranslation">UrgentTranslation</a>, <a href="https://www.transifex.com/accounts/profile/VIPnett">VIPnett</a>, <a href="https://www.transifex.com/accounts/profile/Vaclad">Vaclad</a>, <a href="https://www.transifex.com/accounts/profile/VaporsBazar.Com">VaporsBazar.Com</a>, <a href="https://www.transifex.com/accounts/profile/Vinci">Vinci</a>, <a href="https://www.transifex.com/accounts/profile/Violyne">Violyne</a>, <a href="https://www.transifex.com/accounts/profile/Virtualview">Virtualview</a>, <a href="https://www.transifex.com/accounts/profile/WebArt.es">WebArt.es</a>, <a href="https://www.transifex.com/accounts/profile/Wen89">Wen89</a>, <a href="https://www.transifex.com/accounts/profile/Wonderm00n">Wonderm00n</a>, <a href="https://www.transifex.com/accounts/profile/WordCommerce">WordCommerce</a>, <a href="https://www.transifex.com/accounts/profile/Zouza">Zouza</a>, <a href="https://www.transifex.com/accounts/profile/Zuige">Zuige</a>, <a href="https://www.transifex.com/accounts/profile/a.khanamiryan">a.khanamiryan</a>, <a href="https://www.transifex.com/accounts/profile/aOOn">aOOn</a>, <a href="https://www.transifex.com/accounts/profile/abdmc">abdmc</a>, <a href="https://www.transifex.com/accounts/profile/abouolia">abouolia</a>, <a href="https://www.transifex.com/accounts/profile/adiuvo">adiuvo</a>, <a href="https://www.transifex.com/accounts/profile/ahmedbadawy">ahmedbadawy</a>, <a href="https://www.transifex.com/accounts/profile/akmalff">akmalff</a>, <a href="https://www.transifex.com/accounts/profile/akorsar">akorsar</a>, <a href="https://www.transifex.com/accounts/profile/alaa13212">alaa13212</a>, <a href="https://www.transifex.com/accounts/profile/alaershov">alaershov</a>, <a href="https://www.transifex.com/accounts/profile/albook55">albook55</a>, <a href="https://www.transifex.com/accounts/profile/alichani">alichani</a>, <a href="https://www.transifex.com/accounts/profile/aljs">aljs</a>, <a href="https://www.transifex.com/accounts/profile/almapugaa">almapugaa</a>, <a href="https://www.transifex.com/accounts/profile/alvarogois">alvarogois</a>, <a href="https://www.transifex.com/accounts/profile/amatos">amatos</a>, <a href="https://www.transifex.com/accounts/profile/amilosavljevic09">amilosavljevic09</a>, <a href="https://www.transifex.com/accounts/profile/amisfranky">amisfranky</a>, <a href="https://www.transifex.com/accounts/profile/amitgilad">amitgilad</a>, <a href="https://www.transifex.com/accounts/profile/anabelle">anabelle</a>, <a href="https://www.transifex.com/accounts/profile/anakarenjiina">anakarenjiina</a>, <a href="https://www.transifex.com/accounts/profile/andercola">andercola</a>, <a href="https://www.transifex.com/accounts/profile/andizajn">andizajn</a>, <a href="https://www.transifex.com/accounts/profile/andres.chavez23">andres.chavez23</a>, <a href="https://www.transifex.com/accounts/profile/andrey.lima.ramos">andrey.lima.ramos</a>, <a href="https://www.transifex.com/accounts/profile/andygi">andygi</a>, <a href="https://www.transifex.com/accounts/profile/angel_ruiz">angel_ruiz</a>, <a href="https://www.transifex.com/accounts/profile/anma2308">anma2308</a>, <a href="https://www.transifex.com/accounts/profile/anope">anope</a>, <a href="https://www.transifex.com/accounts/profile/anotherkaz">anotherkaz</a>, <a href="https://www.transifex.com/accounts/profile/arcuza">arcuza</a>, <a href="https://www.transifex.com/accounts/profile/arhipaiva">arhipaiva</a>, <a href="https://www.transifex.com/accounts/profile/arielk">arielk</a>, <a href="https://www.transifex.com/accounts/profile/aroland.hu">aroland.hu</a>, <a href="https://www.transifex.com/accounts/profile/artprojectgroup">artprojectgroup</a>, <a href="https://www.transifex.com/accounts/profile/artur.prip">artur.prip</a>, <a href="https://www.transifex.com/accounts/profile/aruffini">aruffini</a>, <a href="https://www.transifex.com/accounts/profile/asapvaleriy">asapvaleriy</a>, <a href="https://www.transifex.com/accounts/profile/asger2905">asger2905</a>, <a href="https://www.transifex.com/accounts/profile/audilu">audilu</a>, <a href="https://www.transifex.com/accounts/profile/aureliash">aureliash</a>, <a href="https://www.transifex.com/accounts/profile/avarx">avarx</a>, <a href="https://www.transifex.com/accounts/profile/axdil">axdil</a>, <a href="https://www.transifex.com/accounts/profile/badsha_eee">badsha_eee</a>, <a href="https://www.transifex.com/accounts/profile/badushich">badushich</a>, <a href="https://www.transifex.com/accounts/profile/bafakos">bafakos</a>, <a href="https://www.transifex.com/accounts/profile/banned">banned</a>, <a href="https://www.transifex.com/accounts/profile/baobinh152">baobinh152</a>, <a href="https://www.transifex.com/accounts/profile/barrykooij">barrykooij</a>, <a href="https://www.transifex.com/accounts/profile/belal">belal</a>, <a href="https://www.transifex.com/accounts/profile/ben39276">ben39276</a>, <a href="https://www.transifex.com/accounts/profile/bergslay">bergslay</a>, <a href="https://www.transifex.com/accounts/profile/bestariweb.studio">bestariweb.studio</a>, <a href="https://www.transifex.com/accounts/profile/biromax">biromax</a>, <a href="https://www.transifex.com/accounts/profile/blaagnu">blaagnu</a>, <a href="https://www.transifex.com/accounts/profile/blackieA">blackieA</a>, <a href="https://www.transifex.com/accounts/profile/bluecafe">bluecafe</a>, <a href="https://www.transifex.com/accounts/profile/bohoejgaard">bohoejgaard</a>, <a href="https://www.transifex.com/accounts/profile/bombermidia">bombermidia</a>, <a href="https://www.transifex.com/accounts/profile/bornforlogic">bornforlogic</a>, <a href="https://www.transifex.com/accounts/profile/br0ken">br0ken</a>, <a href="https://www.transifex.com/accounts/profile/brankoturk">brankoturk</a>, <a href="https://www.transifex.com/accounts/profile/bulgarian">bulgarian</a>, <a href="https://www.transifex.com/accounts/profile/bumbon4ik">bumbon4ik</a>, <a href="https://www.transifex.com/accounts/profile/busic">busic</a>, <a href="https://www.transifex.com/accounts/profile/cadoo">cadoo</a>, <a href="https://www.transifex.com/accounts/profile/cafevn">cafevn</a>, <a href="https://www.transifex.com/accounts/profile/caititu">caititu</a>, <a href="https://www.transifex.com/accounts/profile/calkut">calkut</a>, <a href="https://www.transifex.com/accounts/profile/calvares">calvares</a>, <a href="https://www.transifex.com/accounts/profile/canohincapie">canohincapie</a>, <a href="https://www.transifex.com/accounts/profile/capouvrage">capouvrage</a>, <a href="https://www.transifex.com/accounts/profile/carletto0282">carletto0282</a>, <a href="https://www.transifex.com/accounts/profile/cassim">cassim</a>, <a href="https://www.transifex.com/accounts/profile/cdevreugd">cdevreugd</a>, <a href="https://www.transifex.com/accounts/profile/cegomez">cegomez</a>, <a href="https://www.transifex.com/accounts/profile/cglaudel">cglaudel</a>, <a href="https://www.transifex.com/accounts/profile/chatzeiliadis">chatzeiliadis</a>, <a href="https://www.transifex.com/accounts/profile/chelling">chelling</a>, <a href="https://www.transifex.com/accounts/profile/chrdesigner">chrdesigner</a>, <a href="https://www.transifex.com/accounts/profile/claudiosmweb">claudiosmweb</a>, <a href="https://www.transifex.com/accounts/profile/claudiuiancic">claudiuiancic</a>, <a href="https://www.transifex.com/accounts/profile/clausRO">clausRO</a>, <a href="https://www.transifex.com/accounts/profile/clausewitz45">clausewitz45</a>, <a href="https://www.transifex.com/accounts/profile/coenjacobs">coenjacobs</a>, <a href="https://www.transifex.com/accounts/profile/colibriinteractive">colibriinteractive</a>, <a href="https://www.transifex.com/accounts/profile/cool2014">cool2014</a>, <a href="https://www.transifex.com/accounts/profile/corsonr">corsonr</a>, <a href="https://www.transifex.com/accounts/profile/cotorusso">cotorusso</a>, <a href="https://www.transifex.com/accounts/profile/cpelham">cpelham</a>, <a href="https://www.transifex.com/accounts/profile/creativejuiz">creativejuiz</a>, <a href="https://www.transifex.com/accounts/profile/cris701">cris701</a>, <a href="https://www.transifex.com/accounts/profile/cristi.dbr">cristi.dbr</a>, <a href="https://www.transifex.com/accounts/profile/cserlevente">cserlevente</a>, <a href="https://www.transifex.com/accounts/profile/culkman">culkman</a>, <a href="https://www.transifex.com/accounts/profile/dabodude">dabodude</a>, <a href="https://www.transifex.com/accounts/profile/dacthang1991">dacthang1991</a>, <a href="https://www.transifex.com/accounts/profile/dajia">dajia</a>, <a href="https://www.transifex.com/accounts/profile/danielp">danielp</a>, <a href="https://www.transifex.com/accounts/profile/danieltehnix">danieltehnix</a>, <a href="https://www.transifex.com/accounts/profile/danitag78">danitag78</a>, <a href="https://www.transifex.com/accounts/profile/dannie.haui">dannie.haui</a>, <a href="https://www.transifex.com/accounts/profile/danon2">danon2</a>, <a href="https://www.transifex.com/accounts/profile/darudar">darudar</a>, <a href="https://www.transifex.com/accounts/profile/davor.padovan">davor.padovan</a>, <a href="https://www.transifex.com/accounts/profile/dawydo">dawydo</a>, <a href="https://www.transifex.com/accounts/profile/deckerweb">deckerweb</a>, <a href="https://www.transifex.com/accounts/profile/deepinsource">deepinsource</a>, <a href="https://www.transifex.com/accounts/profile/dekaru">dekaru</a>, <a href="https://www.transifex.com/accounts/profile/delitestudio">delitestudio</a>, <a href="https://www.transifex.com/accounts/profile/denarefyev">denarefyev</a>, <a href="https://www.transifex.com/accounts/profile/denchev">denchev</a>, <a href="https://www.transifex.com/accounts/profile/dencog">dencog</a>, <a href="https://www.transifex.com/accounts/profile/dhikkay14">dhikkay14</a>, <a href="https://www.transifex.com/accounts/profile/dickysun">dickysun</a>, <a href="https://www.transifex.com/accounts/profile/didikpri">didikpri</a>, <a href="https://www.transifex.com/accounts/profile/difreo">difreo</a>, <a href="https://www.transifex.com/accounts/profile/dima.budzin">dima.budzin</a>, <a href="https://www.transifex.com/accounts/profile/disaada">disaada</a>, <a href="https://www.transifex.com/accounts/profile/discipulorajiv2015">discipulorajiv2015</a>, <a href="https://www.transifex.com/accounts/profile/dix.alex">dix.alex</a>, <a href="https://www.transifex.com/accounts/profile/djarzyna">djarzyna</a>, <a href="https://www.transifex.com/accounts/profile/doorbook">doorbook</a>, <a href="https://www.transifex.com/accounts/profile/drorbek">drorbek</a>, <a href="https://www.transifex.com/accounts/profile/drosendo">drosendo</a>, <a href="https://www.transifex.com/accounts/profile/dualcore">dualcore</a>, <a href="https://www.transifex.com/accounts/profile/dudlaj">dudlaj</a>, <a href="https://www.transifex.com/accounts/profile/duniadapur">duniadapur</a>, <a href="https://www.transifex.com/accounts/profile/dyrer">dyrer</a>, <a href="https://www.transifex.com/accounts/profile/dzonivejin">dzonivejin</a>, <a href="https://www.transifex.com/accounts/profile/e01">e01</a>, <a href="https://www.transifex.com/accounts/profile/ecacreator">ecacreator</a>, <a href="https://www.transifex.com/accounts/profile/ecom24h">ecom24h</a>, <a href="https://www.transifex.com/accounts/profile/eculeus">eculeus</a>, <a href="https://www.transifex.com/accounts/profile/edea">edea</a>, <a href="https://www.transifex.com/accounts/profile/eduardoarandah">eduardoarandah</a>, <a href="https://www.transifex.com/accounts/profile/eezhal92">eezhal92</a>, <a href="https://www.transifex.com/accounts/profile/egill">egill</a>, <a href="https://www.transifex.com/accounts/profile/elct9620">elct9620</a>, <a href="https://www.transifex.com/accounts/profile/elixer">elixer</a>, <a href="https://www.transifex.com/accounts/profile/ellena">ellena</a>, <a href="https://www.transifex.com/accounts/profile/elwins">elwins</a>, <a href="https://www.transifex.com/accounts/profile/embuck">embuck</a>, <a href="https://www.transifex.com/accounts/profile/emidiobattipaglia">emidiobattipaglia</a>, <a href="https://www.transifex.com/accounts/profile/endestaque">endestaque</a>, <a href="https://www.transifex.com/accounts/profile/endomenec">endomenec</a>, <a href="https://www.transifex.com/accounts/profile/ernexto">ernexto</a>, <a href="https://www.transifex.com/accounts/profile/espellcaste">espellcaste</a>, <a href="https://www.transifex.com/accounts/profile/essamsaad">essamsaad</a>, <a href="https://www.transifex.com/accounts/profile/esspressions">esspressions</a>, <a href="https://www.transifex.com/accounts/profile/estebanburgos">estebanburgos</a>, <a href="https://www.transifex.com/accounts/profile/eugenpaun_ro">eugenpaun_ro</a>, <a href="https://www.transifex.com/accounts/profile/evanildobarros">evanildobarros</a>, <a href="https://www.transifex.com/accounts/profile/exlil">exlil</a>, <a href="https://www.transifex.com/accounts/profile/extradragon">extradragon</a>, <a href="https://www.transifex.com/accounts/profile/fabiobraga.eucaristos">fabiobraga.eucaristos</a>, <a href="https://www.transifex.com/accounts/profile/fabyc">fabyc</a>, <a href="https://www.transifex.com/accounts/profile/fantasy1612">fantasy1612</a>, <a href="https://www.transifex.com/accounts/profile/fauzie">fauzie</a>, <a href="https://www.transifex.com/accounts/profile/fdaciuk">fdaciuk</a>, <a href="https://www.transifex.com/accounts/profile/felipersilva">felipersilva</a>, <a href="https://www.transifex.com/accounts/profile/finnes">finnes</a>, <a href="https://www.transifex.com/accounts/profile/flyingoff">flyingoff</a>, <a href="https://www.transifex.com/accounts/profile/fnalescio">fnalescio</a>, <a href="https://www.transifex.com/accounts/profile/fquantium">fquantium</a>, <a href="https://www.transifex.com/accounts/profile/francesco.dicandia">francesco.dicandia</a>, <a href="https://www.transifex.com/accounts/profile/francispio">francispio</a>, <a href="https://www.transifex.com/accounts/profile/fredcar12">fredcar12</a>, <a href="https://www.transifex.com/accounts/profile/fridata">fridata</a>, <a href="https://www.transifex.com/accounts/profile/funmist">funmist</a>, <a href="https://www.transifex.com/accounts/profile/fxbenard">fxbenard</a>, <a href="https://www.transifex.com/accounts/profile/gabejshn">gabejshn</a>, <a href="https://www.transifex.com/accounts/profile/gaspas">gaspas</a>, <a href="https://www.transifex.com/accounts/profile/geerthoekzema">geerthoekzema</a>, <a href="https://www.transifex.com/accounts/profile/genipauba">genipauba</a>, <a href="https://www.transifex.com/accounts/profile/george_pt">george_pt</a>, <a href="https://www.transifex.com/accounts/profile/ghealf">ghealf</a>, <a href="https://www.transifex.com/accounts/profile/giani">giani</a>, <a href="https://www.transifex.com/accounts/profile/gilmarsilvadf">gilmarsilvadf</a>, <a href="https://www.transifex.com/accounts/profile/gingermig">gingermig</a>, <a href="https://www.transifex.com/accounts/profile/givitis">givitis</a>, <a href="https://www.transifex.com/accounts/profile/glamour">glamour</a>, <a href="https://www.transifex.com/accounts/profile/globalaperta">globalaperta</a>, <a href="https://www.transifex.com/accounts/profile/goasdoué">goasdoué</a>, <a href="https://www.transifex.com/accounts/profile/goksy973">goksy973</a>, <a href="https://www.transifex.com/accounts/profile/gonzunigad">gonzunigad</a>, <a href="https://www.transifex.com/accounts/profile/gopress.co.il">gopress.co.il</a>, <a href="https://www.transifex.com/accounts/profile/gordon168">gordon168</a>, <a href="https://www.transifex.com/accounts/profile/gorenc.mirko">gorenc.mirko</a>, <a href="https://www.transifex.com/accounts/profile/greenbee">greenbee</a>, <a href="https://www.transifex.com/accounts/profile/greencore">greencore</a>, <a href="https://www.transifex.com/accounts/profile/greguly">greguly</a>, <a href="https://www.transifex.com/accounts/profile/gugaalves">gugaalves</a>, <a href="https://www.transifex.com/accounts/profile/guilhermecan">guilhermecan</a>, <a href="https://www.transifex.com/accounts/profile/guxin">guxin</a>, <a href="https://www.transifex.com/accounts/profile/hacku">hacku</a>, <a href="https://www.transifex.com/accounts/profile/hafizero">hafizero</a>, <a href="https://www.transifex.com/accounts/profile/hamalah">hamalah</a>, <a href="https://www.transifex.com/accounts/profile/hangga">hangga</a>, <a href="https://www.transifex.com/accounts/profile/hannit">hannit</a>, <a href="https://www.transifex.com/accounts/profile/haruman">haruman</a>, <a href="https://www.transifex.com/accounts/profile/hasanhalabi">hasanhalabi</a>, <a href="https://www.transifex.com/accounts/profile/hegerworld">hegerworld</a>, <a href="https://www.transifex.com/accounts/profile/helio17">helio17</a>, <a href="https://www.transifex.com/accounts/profile/henryk.ibemeinhardt">henryk.ibemeinhardt</a>, <a href="https://www.transifex.com/accounts/profile/hermanudin">hermanudin</a>, <a href="https://www.transifex.com/accounts/profile/hermit096">hermit096</a>, <a href="https://www.transifex.com/accounts/profile/heschin">heschin</a>, <a href="https://www.transifex.com/accounts/profile/hfelipe">hfelipe</a>, <a href="https://www.transifex.com/accounts/profile/hhaawwaa">hhaawwaa</a>, <a href="https://www.transifex.com/accounts/profile/hildago">hildago</a>, <a href="https://www.transifex.com/accounts/profile/hisoka512">hisoka512</a>, <a href="https://www.transifex.com/accounts/profile/hnik.martin">hnik.martin</a>, <a href="https://www.transifex.com/accounts/profile/hoathienthao">hoathienthao</a>, <a href="https://www.transifex.com/accounts/profile/hrich">hrich</a>, <a href="https://www.transifex.com/accounts/profile/hugosigaud">hugosigaud</a>, <a href="https://www.transifex.com/accounts/profile/huy.ng">huy.ng</a>, <a href="https://www.transifex.com/accounts/profile/huytuduy">huytuduy</a>, <a href="https://www.transifex.com/accounts/profile/iadmir">iadmir</a>, <a href="https://www.transifex.com/accounts/profile/iagomelanias">iagomelanias</a>, <a href="https://www.transifex.com/accounts/profile/ideapress">ideapress</a>, <a href="https://www.transifex.com/accounts/profile/ideodora">ideodora</a>, <a href="https://www.transifex.com/accounts/profile/idofri">idofri</a>, <a href="https://www.transifex.com/accounts/profile/ihamed">ihamed</a>, <a href="https://www.transifex.com/accounts/profile/ikadar">ikadar</a>, <a href="https://www.transifex.com/accounts/profile/ilan256">ilan256</a>, <a href="https://www.transifex.com/accounts/profile/imSuhaib">imSuhaib</a>, <a href="https://www.transifex.com/accounts/profile/imranshahryar">imranshahryar</a>, <a href="https://www.transifex.com/accounts/profile/in5arts">in5arts</a>, <a href="https://www.transifex.com/accounts/profile/inceptive">inceptive</a>, <a href="https://www.transifex.com/accounts/profile/inesek">inesek</a>, <a href="https://www.transifex.com/accounts/profile/inlaand">inlaand</a>, <a href="https://www.transifex.com/accounts/profile/inpsyde">inpsyde</a>, <a href="https://www.transifex.com/accounts/profile/ironist">ironist</a>, <a href="https://www.transifex.com/accounts/profile/irsyadzaki">irsyadzaki</a>, <a href="https://www.transifex.com/accounts/profile/ishay1999">ishay1999</a>, <a href="https://www.transifex.com/accounts/profile/israel.cefrin">israel.cefrin</a>, <a href="https://www.transifex.com/accounts/profile/itsameyer">itsameyer</a>, <a href="https://www.transifex.com/accounts/profile/itws">itws</a>, <a href="https://www.transifex.com/accounts/profile/ivy04">ivy04</a>, <a href="https://www.transifex.com/accounts/profile/iwocs">iwocs</a>, <a href="https://www.transifex.com/accounts/profile/izzuddinfz">izzuddinfz</a>, <a href="https://www.transifex.com/accounts/profile/jameskoster">jameskoster</a>, <a href="https://www.transifex.com/accounts/profile/jamesrod29">jamesrod29</a>, <a href="https://www.transifex.com/accounts/profile/jeanfsanto">jeanfsanto</a>, <a href="https://www.transifex.com/accounts/profile/jeanmichell">jeanmichell</a>, <a href="https://www.transifex.com/accounts/profile/jeff2ma">jeff2ma</a>, <a href="https://www.transifex.com/accounts/profile/jeniya5149">jeniya5149</a>, <a href="https://www.transifex.com/accounts/profile/jffelix">jffelix</a>, <a href="https://www.transifex.com/accounts/profile/jhassler">jhassler</a>, <a href="https://www.transifex.com/accounts/profile/jhn_rustan">jhn_rustan</a>, <a href="https://www.transifex.com/accounts/profile/jhovel">jhovel</a>, <a href="https://www.transifex.com/accounts/profile/jigge">jigge</a>, <a href="https://www.transifex.com/accounts/profile/jimconstas">jimconstas</a>, <a href="https://www.transifex.com/accounts/profile/jimkakaz">jimkakaz</a>, <a href="https://www.transifex.com/accounts/profile/jims">jims</a>, <a href="https://www.transifex.com/accounts/profile/jlgd">jlgd</a>, <a href="https://www.transifex.com/accounts/profile/jluisfreitas">jluisfreitas</a>, <a href="https://www.transifex.com/accounts/profile/joelbal">joelbal</a>, <a href="https://www.transifex.com/accounts/profile/joesadaeng">joesadaeng</a>, <a href="https://www.transifex.com/accounts/profile/joesalty">joesalty</a>, <a href="https://www.transifex.com/accounts/profile/johny.raid">johny.raid</a>, <a href="https://www.transifex.com/accounts/profile/jolish">jolish</a>, <a href="https://www.transifex.com/accounts/profile/josefreitas2">josefreitas2</a>, <a href="https://www.transifex.com/accounts/profile/joseluis">joseluis</a>, <a href="https://www.transifex.com/accounts/profile/josh_marom">josh_marom</a>, <a href="https://www.transifex.com/accounts/profile/joy.doctor">joy.doctor</a>, <a href="https://www.transifex.com/accounts/profile/jpBenfica">jpBenfica</a>, <a href="https://www.transifex.com/accounts/profile/jsparic">jsparic</a>, <a href="https://www.transifex.com/accounts/profile/jugmar">jugmar</a>, <a href="https://www.transifex.com/accounts/profile/jujjer">jujjer</a>, <a href="https://www.transifex.com/accounts/profile/junedzhan">junedzhan</a>, <a href="https://www.transifex.com/accounts/profile/jungchang">jungchang</a>, <a href="https://www.transifex.com/accounts/profile/justina_ba">justina_ba</a>, <a href="https://www.transifex.com/accounts/profile/jvissup">jvissup</a>, <a href="https://www.transifex.com/accounts/profile/kammabranding">kammabranding</a>, <a href="https://www.transifex.com/accounts/profile/kampit">kampit</a>, <a href="https://www.transifex.com/accounts/profile/karama89">karama89</a>, <a href="https://www.transifex.com/accounts/profile/karistuck">karistuck</a>, <a href="https://www.transifex.com/accounts/profile/katakutu">katakutu</a>, <a href="https://www.transifex.com/accounts/profile/keller2.m">keller2.m</a>, <a href="https://www.transifex.com/accounts/profile/kenessar">kenessar</a>, <a href="https://www.transifex.com/accounts/profile/kevinnguyen">kevinnguyen</a>, <a href="https://www.transifex.com/accounts/profile/keysuck">keysuck</a>, <a href="https://www.transifex.com/accounts/profile/khalil.delavaran">khalil.delavaran</a>, <a href="https://www.transifex.com/accounts/profile/kikarina">kikarina</a>, <a href="https://www.transifex.com/accounts/profile/kikehz">kikehz</a>, <a href="https://www.transifex.com/accounts/profile/kissmyarch">kissmyarch</a>, <a href="https://www.transifex.com/accounts/profile/kjergaardgraphic">kjergaardgraphic</a>, <a href="https://www.transifex.com/accounts/profile/kjosenet">kjosenet</a>, <a href="https://www.transifex.com/accounts/profile/klemonnier">klemonnier</a>, <a href="https://www.transifex.com/accounts/profile/konglehong">konglehong</a>, <a href="https://www.transifex.com/accounts/profile/kornienko">kornienko</a>, <a href="https://www.transifex.com/accounts/profile/kouteki">kouteki</a>, <a href="https://www.transifex.com/accounts/profile/kraudio">kraudio</a>, <a href="https://www.transifex.com/accounts/profile/kreatik">kreatik</a>, <a href="https://www.transifex.com/accounts/profile/krzysko">krzysko</a>, <a href="https://www.transifex.com/accounts/profile/kubik999">kubik999</a>, <a href="https://www.transifex.com/accounts/profile/kweekarius">kweekarius</a>, <a href="https://www.transifex.com/accounts/profile/kyanuj">kyanuj</a>, <a href="https://www.transifex.com/accounts/profile/labdav">labdav</a>, <a href="https://www.transifex.com/accounts/profile/laco_">laco_</a>, <a href="https://www.transifex.com/accounts/profile/lahiponeja">lahiponeja</a>, <a href="https://www.transifex.com/accounts/profile/lamibo">lamibo</a>, <a href="https://www.transifex.com/accounts/profile/laszlo.espadas">laszlo.espadas</a>, <a href="https://www.transifex.com/accounts/profile/laurbb">laurbb</a>, <a href="https://www.transifex.com/accounts/profile/lemonthirst">lemonthirst</a>, <a href="https://www.transifex.com/accounts/profile/limekex">limekex</a>, <a href="https://www.transifex.com/accounts/profile/lincw">lincw</a>, <a href="https://www.transifex.com/accounts/profile/lingfeng">lingfeng</a>, <a href="https://www.transifex.com/accounts/profile/linnetoglaursen">linnetoglaursen</a>, <a href="https://www.transifex.com/accounts/profile/liorfeld">liorfeld</a>, <a href="https://www.transifex.com/accounts/profile/lobom">lobom</a>, <a href="https://www.transifex.com/accounts/profile/long.run.international">long.run.international</a>, <a href="https://www.transifex.com/accounts/profile/lopescmauro">lopescmauro</a>, <a href="https://www.transifex.com/accounts/profile/louiseana">louiseana</a>, <a href="https://www.transifex.com/accounts/profile/lubalee">lubalee</a>, <a href="https://www.transifex.com/accounts/profile/lucasfreitas">lucasfreitas</a>, <a href="https://www.transifex.com/accounts/profile/lucaso">lucaso</a>, <a href="https://www.transifex.com/accounts/profile/luciferbui">luciferbui</a>, <a href="https://www.transifex.com/accounts/profile/lucky_sevenf">lucky_sevenf</a>, <a href="https://www.transifex.com/accounts/profile/luismcafe">luismcafe</a>, <a href="https://www.transifex.com/accounts/profile/luisrull">luisrull</a>, <a href="https://www.transifex.com/accounts/profile/lukharb">lukharb</a>, <a href="https://www.transifex.com/accounts/profile/lumigam">lumigam</a>, <a href="https://www.transifex.com/accounts/profile/m.cekutis">m.cekutis</a>, <a href="https://www.transifex.com/accounts/profile/m1k3lm">m1k3lm</a>, <a href="https://www.transifex.com/accounts/profile/maateuszt">maateuszt</a>, <a href="https://www.transifex.com/accounts/profile/maayehkhaled">maayehkhaled</a>, <a href="https://www.transifex.com/accounts/profile/macbluy">macbluy</a>, <a href="https://www.transifex.com/accounts/profile/madebyh">madebyh</a>, <a href="https://www.transifex.com/accounts/profile/madswidding">madswidding</a>, <a href="https://www.transifex.com/accounts/profile/manuelvillagrdo">manuelvillagrdo</a>, <a href="https://www.transifex.com/accounts/profile/marc.andressen">marc.andressen</a>, <a href="https://www.transifex.com/accounts/profile/marciotoledo">marciotoledo</a>, <a href="https://www.transifex.com/accounts/profile/marcos.nascimento">marcos.nascimento</a>, <a href="https://www.transifex.com/accounts/profile/marcosof">marcosof</a>, <a href="https://www.transifex.com/accounts/profile/marcozink">marcozink</a>, <a href="https://www.transifex.com/accounts/profile/mariosbekatoros">mariosbekatoros</a>, <a href="https://www.transifex.com/accounts/profile/marioscrafts">marioscrafts</a>, <a href="https://www.transifex.com/accounts/profile/markonikolic">markonikolic</a>, <a href="https://www.transifex.com/accounts/profile/maros336">maros336</a>, <a href="https://www.transifex.com/accounts/profile/martian36">martian36</a>, <a href="https://www.transifex.com/accounts/profile/martinezmr">martinezmr</a>, <a href="https://www.transifex.com/accounts/profile/martinproject">martinproject</a>, <a href="https://www.transifex.com/accounts/profile/math_beck">math_beck</a>, <a href="https://www.transifex.com/accounts/profile/maticer">maticer</a>, <a href="https://www.transifex.com/accounts/profile/mattyza">mattyza</a>, <a href="https://www.transifex.com/accounts/profile/mausimao">mausimao</a>, <a href="https://www.transifex.com/accounts/profile/maxlam">maxlam</a>, <a href="https://www.transifex.com/accounts/profile/mazrobby">mazrobby</a>, <a href="https://www.transifex.com/accounts/profile/mcortizo">mcortizo</a>, <a href="https://www.transifex.com/accounts/profile/me2you">me2you</a>, <a href="https://www.transifex.com/accounts/profile/megamak">megamak</a>, <a href="https://www.transifex.com/accounts/profile/mehdikhatiri">mehdikhatiri</a>, <a href="https://www.transifex.com/accounts/profile/mekom">mekom</a>, <a href="https://www.transifex.com/accounts/profile/meryjoearmstrong">meryjoearmstrong</a>, <a href="https://www.transifex.com/accounts/profile/metallicamu">metallicamu</a>, <a href="https://www.transifex.com/accounts/profile/mgsolipa">mgsolipa</a>, <a href="https://www.transifex.com/accounts/profile/mhmithu">mhmithu</a>, <a href="https://www.transifex.com/accounts/profile/michaeltieso">michaeltieso</a>, <a href="https://www.transifex.com/accounts/profile/michalvittek">michalvittek</a>, <a href="https://www.transifex.com/accounts/profile/michelle_zhang">michelle_zhang</a>, <a href="https://www.transifex.com/accounts/profile/mikaeldui">mikaeldui</a>, <a href="https://www.transifex.com/accounts/profile/mikejolley">mikejolley</a>, <a href="https://www.transifex.com/accounts/profile/mikseris1001">mikseris1001</a>, <a href="https://www.transifex.com/accounts/profile/milord">milord</a>, <a href="https://www.transifex.com/accounts/profile/minima">minima</a>, <a href="https://www.transifex.com/accounts/profile/minimalstudio">minimalstudio</a>, <a href="https://www.transifex.com/accounts/profile/mireczech">mireczech</a>, <a href="https://www.transifex.com/accounts/profile/mirkowhat">mirkowhat</a>, <a href="https://www.transifex.com/accounts/profile/mjepson">mjepson</a>, <a href="https://www.transifex.com/accounts/profile/mktunited">mktunited</a>, <a href="https://www.transifex.com/accounts/profile/mo3aser">mo3aser</a>, <a href="https://www.transifex.com/accounts/profile/mobarak">mobarak</a>, <a href="https://www.transifex.com/accounts/profile/mobiletalk">mobiletalk</a>, <a href="https://www.transifex.com/accounts/profile/mod7">mod7</a>, <a href="https://www.transifex.com/accounts/profile/modularte">modularte</a>, <a href="https://www.transifex.com/accounts/profile/mojtabashahi">mojtabashahi</a>, <a href="https://www.transifex.com/accounts/profile/molfar">molfar</a>, <a href="https://www.transifex.com/accounts/profile/monferro">monferro</a>, <a href="https://www.transifex.com/accounts/profile/monsterporing">monsterporing</a>, <a href="https://www.transifex.com/accounts/profile/moodingaway">moodingaway</a>, <a href="https://www.transifex.com/accounts/profile/moon.modena">moon.modena</a>, <a href="https://www.transifex.com/accounts/profile/mortifactor">mortifactor</a>, <a href="https://www.transifex.com/accounts/profile/moss66">moss66</a>, <a href="https://www.transifex.com/accounts/profile/mostafizur">mostafizur</a>, <a href="https://www.transifex.com/accounts/profile/mruizoea">mruizoea</a>, <a href="https://www.transifex.com/accounts/profile/mspapadopoulou">mspapadopoulou</a>, <a href="https://www.transifex.com/accounts/profile/mucheroni">mucheroni</a>, <a href="https://www.transifex.com/accounts/profile/muhammetayten">muhammetayten</a>, <a href="https://www.transifex.com/accounts/profile/mul14">mul14</a>, <a href="https://www.transifex.com/accounts/profile/muratbutun">muratbutun</a>, <a href="https://www.transifex.com/accounts/profile/mustafamsy">mustafamsy</a>, <a href="https://www.transifex.com/accounts/profile/mylene">mylene</a>, <a href="https://www.transifex.com/accounts/profile/mylowebdesign">mylowebdesign</a>, <a href="https://www.transifex.com/accounts/profile/nabil_kadimi">nabil_kadimi</a>, <a href="https://www.transifex.com/accounts/profile/namanh">namanh</a>, <a href="https://www.transifex.com/accounts/profile/nazar.y92">nazar.y92</a>, <a href="https://www.transifex.com/accounts/profile/nbrites">nbrites</a>, <a href="https://www.transifex.com/accounts/profile/nelblack">nelblack</a>, <a href="https://www.transifex.com/accounts/profile/nellsavedra">nellsavedra</a>, <a href="https://www.transifex.com/accounts/profile/neno0999">neno0999</a>, <a href="https://www.transifex.com/accounts/profile/neskanu">neskanu</a>, <a href="https://www.transifex.com/accounts/profile/ng3but">ng3but</a>, <a href="https://www.transifex.com/accounts/profile/nicolasleon">nicolasleon</a>, <a href="https://www.transifex.com/accounts/profile/niels.heijman">niels.heijman</a>, <a href="https://www.transifex.com/accounts/profile/nielsen01">nielsen01</a>, <a href="https://www.transifex.com/accounts/profile/njevdjo">njevdjo</a>, <a href="https://www.transifex.com/accounts/profile/nneo">nneo</a>, <a href="https://www.transifex.com/accounts/profile/nodarik">nodarik</a>, <a href="https://www.transifex.com/accounts/profile/nopphan">nopphan</a>, <a href="https://www.transifex.com/accounts/profile/nsitbon">nsitbon</a>, <a href="https://www.transifex.com/accounts/profile/nttcreative">nttcreative</a>, <a href="https://www.transifex.com/accounts/profile/nvhcuong">nvhcuong</a>, <a href="https://www.transifex.com/accounts/profile/ocarol">ocarol</a>, <a href="https://www.transifex.com/accounts/profile/ocean90">ocean90</a>, <a href="https://www.transifex.com/accounts/profile/octordigital">octordigital</a>, <a href="https://www.transifex.com/accounts/profile/od3n">od3n</a>, <a href="https://www.transifex.com/accounts/profile/oisie">oisie</a>, <a href="https://www.transifex.com/accounts/profile/okudo">okudo</a>, <a href="https://www.transifex.com/accounts/profile/olavosimas">olavosimas</a>, <a href="https://www.transifex.com/accounts/profile/olmo">olmo</a>, <a href="https://www.transifex.com/accounts/profile/openstream">openstream</a>, <a href="https://www.transifex.com/accounts/profile/openvillage">openvillage</a>, <a href="https://www.transifex.com/accounts/profile/optimuswebsites">optimuswebsites</a>, <a href="https://www.transifex.com/accounts/profile/orlandobp31">orlandobp31</a>, <a href="https://www.transifex.com/accounts/profile/oropesa">oropesa</a>, <a href="https://www.transifex.com/accounts/profile/pabambino">pabambino</a>, <a href="https://www.transifex.com/accounts/profile/paletta">paletta</a>, <a href="https://www.transifex.com/accounts/profile/paoloalbera">paoloalbera</a>, <a href="https://www.transifex.com/accounts/profile/parinya">parinya</a>, <a href="https://www.transifex.com/accounts/profile/pastynko">pastynko</a>, <a href="https://www.transifex.com/accounts/profile/patjun">patjun</a>, <a href="https://www.transifex.com/accounts/profile/patrickheiloo">patrickheiloo</a>, <a href="https://www.transifex.com/accounts/profile/paulgor">paulgor</a>, <a href="https://www.transifex.com/accounts/profile/paulofioratti">paulofioratti</a>, <a href="https://www.transifex.com/accounts/profile/pavlina25">pavlina25</a>, <a href="https://www.transifex.com/accounts/profile/pcepo1987">pcepo1987</a>, <a href="https://www.transifex.com/accounts/profile/pdb">pdb</a>, <a href="https://www.transifex.com/accounts/profile/peboom">peboom</a>, <a href="https://www.transifex.com/accounts/profile/peepe">peepe</a>, <a href="https://www.transifex.com/accounts/profile/peetjay">peetjay</a>, <a href="https://www.transifex.com/accounts/profile/peggywilman">peggywilman</a>, <a href="https://www.transifex.com/accounts/profile/perdersongedal">perdersongedal</a>, <a href="https://www.transifex.com/accounts/profile/persianwoocommerce">persianwoocommerce</a>, <a href="https://www.transifex.com/accounts/profile/petebig182">petebig182</a>, <a href="https://www.transifex.com/accounts/profile/pfrankov">pfrankov</a>, <a href="https://www.transifex.com/accounts/profile/phamdinhdo">phamdinhdo</a>, <a href="https://www.transifex.com/accounts/profile/pindi">pindi</a>, <a href="https://www.transifex.com/accounts/profile/pixolin">pixolin</a>, <a href="https://www.transifex.com/accounts/profile/pksupply">pksupply</a>, <a href="https://www.transifex.com/accounts/profile/plaguna">plaguna</a>, <a href="https://www.transifex.com/accounts/profile/platzh1rsch">platzh1rsch</a>, <a href="https://www.transifex.com/accounts/profile/playseebow">playseebow</a>, <a href="https://www.transifex.com/accounts/profile/podlebar">podlebar</a>, <a href="https://www.transifex.com/accounts/profile/porclick">porclick</a>, <a href="https://www.transifex.com/accounts/profile/potgieterg">potgieterg</a>, <a href="https://www.transifex.com/accounts/profile/ppv1979">ppv1979</a>, <a href="https://www.transifex.com/accounts/profile/prepu">prepu</a>, <a href="https://www.transifex.com/accounts/profile/primecore">primecore</a>, <a href="https://www.transifex.com/accounts/profile/pulanito">pulanito</a>, <a href="https://www.transifex.com/accounts/profile/puny">puny</a>, <a href="https://www.transifex.com/accounts/profile/qisago">qisago</a>, <a href="https://www.transifex.com/accounts/profile/quickbrown">quickbrown</a>, <a href="https://www.transifex.com/accounts/profile/quocanhcgd">quocanhcgd</a>, <a href="https://www.transifex.com/accounts/profile/rabas.marek">rabas.marek</a>, <a href="https://www.transifex.com/accounts/profile/radovanovic3">radovanovic3</a>, <a href="https://www.transifex.com/accounts/profile/rafaelfunchal">rafaelfunchal</a>, <a href="https://www.transifex.com/accounts/profile/rafalwolak">rafalwolak</a>, <a href="https://www.transifex.com/accounts/profile/ragulka">ragulka</a>, <a href="https://www.transifex.com/accounts/profile/rahmatilham">rahmatilham</a>, <a href="https://www.transifex.com/accounts/profile/raininho">raininho</a>, <a href="https://www.transifex.com/accounts/profile/raivis">raivis</a>, <a href="https://www.transifex.com/accounts/profile/ramoonus">ramoonus</a>, <a href="https://www.transifex.com/accounts/profile/razorfish79">razorfish79</a>, <a href="https://www.transifex.com/accounts/profile/rbrock">rbrock</a>, <a href="https://www.transifex.com/accounts/profile/rcovarru">rcovarru</a>, <a href="https://www.transifex.com/accounts/profile/read1">read1</a>, <a href="https://www.transifex.com/accounts/profile/renatofrota">renatofrota</a>, <a href="https://www.transifex.com/accounts/profile/ricardoreis">ricardoreis</a>, <a href="https://www.transifex.com/accounts/profile/richardshaylor">richardshaylor</a>, <a href="https://www.transifex.com/accounts/profile/rickbauck">rickbauck</a>, <a href="https://www.transifex.com/accounts/profile/rickbronkhorst">rickbronkhorst</a>, <a href="https://www.transifex.com/accounts/profile/rickserrat">rickserrat</a>, <a href="https://www.transifex.com/accounts/profile/rics">rics</a>, <a href="https://www.transifex.com/accounts/profile/ridhoyp">ridhoyp</a>, <a href="https://www.transifex.com/accounts/profile/ringi">ringi</a>, <a href="https://www.transifex.com/accounts/profile/rizqyhi">rizqyhi</a>, <a href="https://www.transifex.com/accounts/profile/rkrizanovskis">rkrizanovskis</a>, <a href="https://www.transifex.com/accounts/profile/rociovaldivia">rociovaldivia</a>, <a href="https://www.transifex.com/accounts/profile/rocketeer76">rocketeer76</a>, <a href="https://www.transifex.com/accounts/profile/rodrigoprior">rodrigoprior</a>, <a href="https://www.transifex.com/accounts/profile/roidayan">roidayan</a>, <a href="https://www.transifex.com/accounts/profile/rolfbastiaans">rolfbastiaans</a>, <a href="https://www.transifex.com/accounts/profile/ronshe">ronshe</a>, <a href="https://www.transifex.com/accounts/profile/rot13">rot13</a>, <a href="https://www.transifex.com/accounts/profile/rozumno">rozumno</a>, <a href="https://www.transifex.com/accounts/profile/rpetkov">rpetkov</a>, <a href="https://www.transifex.com/accounts/profile/rsalafi">rsalafi</a>, <a href="https://www.transifex.com/accounts/profile/rsdkrasen">rsdkrasen</a>, <a href="https://www.transifex.com/accounts/profile/rvoogdgeert">rvoogdgeert</a>, <a href="https://www.transifex.com/accounts/profile/rwahmao">rwahmao</a>, <a href="https://www.transifex.com/accounts/profile/s0w4">s0w4</a>, <a href="https://www.transifex.com/accounts/profile/saharj_niksirat">saharj_niksirat</a>, <a href="https://www.transifex.com/accounts/profile/sajjadsalehi">sajjadsalehi</a>, <a href="https://www.transifex.com/accounts/profile/samirbridi">samirbridi</a>, <a href="https://www.transifex.com/accounts/profile/scottaheinrich">scottaheinrich</a>, <a href="https://www.transifex.com/accounts/profile/scottbasgaard">scottbasgaard</a>, <a href="https://www.transifex.com/accounts/profile/sebastian.quagliano">sebastian.quagliano</a>, <a href="https://www.transifex.com/accounts/profile/selakarweb">selakarweb</a>, <a href="https://www.transifex.com/accounts/profile/sennbrink">sennbrink</a>, <a href="https://www.transifex.com/accounts/profile/senormunoz">senormunoz</a>, <a href="https://www.transifex.com/accounts/profile/sergii.s">sergii.s</a>, <a href="https://www.transifex.com/accounts/profile/sergiomiranda">sergiomiranda</a>, <a href="https://www.transifex.com/accounts/profile/sergiubagrin">sergiubagrin</a>, <a href="https://www.transifex.com/accounts/profile/serpav">serpav</a>, <a href="https://www.transifex.com/accounts/profile/shady55">shady55</a>, <a href="https://www.transifex.com/accounts/profile/shopnel">shopnel</a>, <a href="https://www.transifex.com/accounts/profile/shoresh319">shoresh319</a>, <a href="https://www.transifex.com/accounts/profile/sima3110">sima3110</a>, <a href="https://www.transifex.com/accounts/profile/simon.saavedra">simon.saavedra</a>, <a href="https://www.transifex.com/accounts/profile/sindri">sindri</a>, <a href="https://www.transifex.com/accounts/profile/sipostibor.x">sipostibor.x</a>, <a href="https://www.transifex.com/accounts/profile/sirdaniel">sirdaniel</a>, <a href="https://www.transifex.com/accounts/profile/sistemashbs">sistemashbs</a>, <a href="https://www.transifex.com/accounts/profile/sixsigma">sixsigma</a>, <a href="https://www.transifex.com/accounts/profile/slasher.art">slasher.art</a>, <a href="https://www.transifex.com/accounts/profile/smartdatasoft">smartdatasoft</a>, <a href="https://www.transifex.com/accounts/profile/smeier">smeier</a>, <a href="https://www.transifex.com/accounts/profile/snaever">snaever</a>, <a href="https://www.transifex.com/accounts/profile/snowre">snowre</a>, <a href="https://www.transifex.com/accounts/profile/snsnjsn">snsnjsn</a>, <a href="https://www.transifex.com/accounts/profile/softkleen">softkleen</a>, <a href="https://www.transifex.com/accounts/profile/soldier99">soldier99</a>, <a href="https://www.transifex.com/accounts/profile/sovichet">sovichet</a>, <a href="https://www.transifex.com/accounts/profile/srpski.dizajn">srpski.dizajn</a>, <a href="https://www.transifex.com/accounts/profile/st025">st025</a>, <a href="https://www.transifex.com/accounts/profile/standoutmedia">standoutmedia</a>, <a href="https://www.transifex.com/accounts/profile/stena79">stena79</a>, <a href="https://www.transifex.com/accounts/profile/stephaNNb">stephaNNb</a>, <a href="https://www.transifex.com/accounts/profile/stgoos">stgoos</a>, <a href="https://www.transifex.com/accounts/profile/studionetting">studionetting</a>, <a href="https://www.transifex.com/accounts/profile/stuk88">stuk88</a>, <a href="https://www.transifex.com/accounts/profile/suifengtec">suifengtec</a>, <a href="https://www.transifex.com/accounts/profile/sukruozge">sukruozge</a>, <a href="https://www.transifex.com/accounts/profile/sumodirjo">sumodirjo</a>, <a href="https://www.transifex.com/accounts/profile/supermelann">supermelann</a>, <a href="https://www.transifex.com/accounts/profile/supertommi">supertommi</a>, <a href="https://www.transifex.com/accounts/profile/sverrirp">sverrirp</a>, <a href="https://www.transifex.com/accounts/profile/svetrov">svetrov</a>, <a href="https://www.transifex.com/accounts/profile/svinuesa">svinuesa</a>, <a href="https://www.transifex.com/accounts/profile/sweman">sweman</a>, <a href="https://www.transifex.com/accounts/profile/swissky">swissky</a>, <a href="https://www.transifex.com/accounts/profile/swoboda">swoboda</a>, <a href="https://www.transifex.com/accounts/profile/syao.pin">syao.pin</a>, <a href="https://www.transifex.com/accounts/profile/sylvie_janssens">sylvie_janssens</a>, <a href="https://www.transifex.com/accounts/profile/szemcse75">szemcse75</a>, <a href="https://www.transifex.com/accounts/profile/t4rv1">t4rv1</a>, <a href="https://www.transifex.com/accounts/profile/tadeubrasil">tadeubrasil</a>, <a href="https://www.transifex.com/accounts/profile/tamarazuk">tamarazuk</a>, <a href="https://www.transifex.com/accounts/profile/tamvo">tamvo</a>, <a href="https://www.transifex.com/accounts/profile/tanin">tanin</a>, <a href="https://www.transifex.com/accounts/profile/tarikcayir">tarikcayir</a>, <a href="https://www.transifex.com/accounts/profile/teddyostergaard">teddyostergaard</a>, <a href="https://www.transifex.com/accounts/profile/temayra">temayra</a>, <a href="https://www.transifex.com/accounts/profile/teotonioricardo">teotonioricardo</a>, <a href="https://www.transifex.com/accounts/profile/tetsu">tetsu</a>, <a href="https://www.transifex.com/accounts/profile/thanet">thanet</a>, <a href="https://www.transifex.com/accounts/profile/the_fafa">the_fafa</a>, <a href="https://www.transifex.com/accounts/profile/thiagolovatine">thiagolovatine</a>, <a href="https://www.transifex.com/accounts/profile/thien321091">thien321091</a>, <a href="https://www.transifex.com/accounts/profile/thvvieira">thvvieira</a>, <a href="https://www.transifex.com/accounts/profile/tinaswelt">tinaswelt</a>, <a href="https://www.transifex.com/accounts/profile/tinygiantstudios">tinygiantstudios</a>, <a href="https://www.transifex.com/accounts/profile/tivnet">tivnet</a>, <a href="https://www.transifex.com/accounts/profile/tntc1978">tntc1978</a>, <a href="https://www.transifex.com/accounts/profile/toblues">toblues</a>, <a href="https://www.transifex.com/accounts/profile/tofuSCHNITZEL">tofuSCHNITZEL</a>, <a href="https://www.transifex.com/accounts/profile/tohaitrieu">tohaitrieu</a>, <a href="https://www.transifex.com/accounts/profile/tomasha">tomasha</a>, <a href="https://www.transifex.com/accounts/profile/tomboersma">tomboersma</a>, <a href="https://www.transifex.com/accounts/profile/tonz">tonz</a>, <a href="https://www.transifex.com/accounts/profile/torbenlundsgaard">torbenlundsgaard</a>, <a href="https://www.transifex.com/accounts/profile/trinhquocviet">trinhquocviet</a>, <a href="https://www.transifex.com/accounts/profile/tshowhey">tshowhey</a>, <a href="https://www.transifex.com/accounts/profile/tszming">tszming</a>, <a href="https://www.transifex.com/accounts/profile/tue.holm">tue.holm</a>, <a href="https://www.transifex.com/accounts/profile/tukangbajaksawah">tukangbajaksawah</a>, <a href="https://www.transifex.com/accounts/profile/tupeg">tupeg</a>, <a href="https://www.transifex.com/accounts/profile/tuzka">tuzka</a>, <a href="https://www.transifex.com/accounts/profile/twisted_tits">twisted_tits</a>, <a href="https://www.transifex.com/accounts/profile/uah">uah</a>, <a href="https://www.transifex.com/accounts/profile/urioste">urioste</a>, <a href="https://www.transifex.com/accounts/profile/uworx">uworx</a>, <a href="https://www.transifex.com/accounts/profile/vaans.freire">vaans.freire</a>, <a href="https://www.transifex.com/accounts/profile/vagnerlima">vagnerlima</a>, <a href="https://www.transifex.com/accounts/profile/valurthorgunnarsson">valurthorgunnarsson</a>, <a href="https://www.transifex.com/accounts/profile/vanbo">vanbo</a>, <a href="https://www.transifex.com/accounts/profile/vburlak">vburlak</a>, <a href="https://www.transifex.com/accounts/profile/ventruero">ventruero</a>, <a href="https://www.transifex.com/accounts/profile/vernandosimbolon">vernandosimbolon</a>, <a href="https://www.transifex.com/accounts/profile/vestimir">vestimir</a>, <a href="https://www.transifex.com/accounts/profile/viamarket">viamarket</a>, <a href="https://www.transifex.com/accounts/profile/viancu">viancu</a>, <a href="https://www.transifex.com/accounts/profile/viidar">viidar</a>, <a href="https://www.transifex.com/accounts/profile/viktorhanacek">viktorhanacek</a>, <a href="https://www.transifex.com/accounts/profile/vinoddalvi">vinoddalvi</a>, <a href="https://www.transifex.com/accounts/profile/visionreklama">visionreklama</a>, <a href="https://www.transifex.com/accounts/profile/vitivs">vitivs</a>, <a href="https://www.transifex.com/accounts/profile/vitrinebol1">vitrinebol1</a>, <a href="https://www.transifex.com/accounts/profile/vlinicx">vlinicx</a>, <a href="https://www.transifex.com/accounts/profile/vrielance">vrielance</a>, <a href="https://www.transifex.com/accounts/profile/vrnagy">vrnagy</a>, <a href="https://www.transifex.com/accounts/profile/vrozkovec">vrozkovec</a>, <a href="https://www.transifex.com/accounts/profile/vvee">vvee</a>, <a href="https://www.transifex.com/accounts/profile/w4advn">w4advn</a>, <a href="https://www.transifex.com/accounts/profile/wachirakorn">wachirakorn</a>, <a href="https://www.transifex.com/accounts/profile/wady85">wady85</a>, <a href="https://www.transifex.com/accounts/profile/wasim">wasim</a>, <a href="https://www.transifex.com/accounts/profile/wasley">wasley</a>, <a href="https://www.transifex.com/accounts/profile/weal">weal</a>, <a href="https://www.transifex.com/accounts/profile/webby1973">webby1973</a>, <a href="https://www.transifex.com/accounts/profile/wicaksono">wicaksono</a>, <a href="https://www.transifex.com/accounts/profile/willemsiebe">willemsiebe</a>, <a href="https://www.transifex.com/accounts/profile/winnieji">winnieji</a>, <a href="https://www.transifex.com/accounts/profile/woodyln">woodyln</a>, <a href="https://www.transifex.com/accounts/profile/woorockets">woorockets</a>, <a href="https://www.transifex.com/accounts/profile/wpsk">wpsk</a>, <a href="https://www.transifex.com/accounts/profile/wtrans">wtrans</a>, <a href="https://www.transifex.com/accounts/profile/xdosil">xdosil</a>, <a href="https://www.transifex.com/accounts/profile/xepin">xepin</a>, <a href="https://www.transifex.com/accounts/profile/xeviscc">xeviscc</a>, <a href="https://www.transifex.com/accounts/profile/xevivb">xevivb</a>, <a href="https://www.transifex.com/accounts/profile/xuanlt">xuanlt</a>, <a href="https://www.transifex.com/accounts/profile/y12studio">y12studio</a>, <a href="https://www.transifex.com/accounts/profile/yuhuhack">yuhuhack</a>, <a href="https://www.transifex.com/accounts/profile/zaantar">zaantar</a>, <a href="https://www.transifex.com/accounts/profile/zanguanga">zanguanga</a>, <a href="https://www.transifex.com/accounts/profile/zedejose">zedejose</a>, <a href="https://www.transifex.com/accounts/profile/zekule">zekule</a>, <a href="https://www.transifex.com/accounts/profile/zhihus">zhihus</a>, <a href="https://www.transifex.com/accounts/profile/zion.trooper">zion.trooper</a>, <a href="https://www.transifex.com/accounts/profile/zodiac1978">zodiac1978</a>, <a href="https://www.transifex.com/accounts/profile/zolee1">zolee1</a>, <a href="https://www.transifex.com/accounts/profile/Натали">Натали</a>
			</p>
		</div>
		<?php
	}

	/**
	 * Render Contributors List.
	 *
	 * @return string $contributor_list HTML formatted list of contributors.
	 */
	public function contributors() {
		$contributors = $this->get_contributors();

		if ( empty( $contributors ) ) {
			return '';
		}

		$contributor_list = '<ul class="wp-people-group">';

		foreach ( $contributors as $contributor ) {
			$contributor_list .= '<li class="wp-person">';
			$contributor_list .= sprintf( '<a href="%s" title="%s">',
				esc_url( 'https://github.com/' . $contributor->login ),
				esc_html( sprintf( __( 'View %s', 'woocommerce' ), $contributor->login ) )
			);
			$contributor_list .= sprintf( '<img src="%s" width="64" height="64" class="gravatar" alt="%s" />', esc_url( $contributor->avatar_url ), esc_html( $contributor->login ) );
			$contributor_list .= '</a>';
			$contributor_list .= sprintf( '<a class="web" href="%s">%s</a>', esc_url( 'https://github.com/' . $contributor->login ), esc_html( $contributor->login ) );
			$contributor_list .= '</a>';
			$contributor_list .= '</li>';
		}

		$contributor_list .= '</ul>';

		return $contributor_list;
	}

	/**
	 * Retrieve list of contributors from GitHub.
	 *
	 * @return mixed
	 */
	public function get_contributors() {
		$contributors = get_transient( 'woocommerce_contributors' );

		if ( false !== $contributors ) {
			return $contributors;
		}

		$response = wp_remote_get( 'https://api.github.com/repos/woothemes/woocommerce/contributors', array( 'sslverify' => false ) );

		if ( is_wp_error( $response ) || 200 != wp_remote_retrieve_response_code( $response ) ) {
			return array();
		}

		$contributors = json_decode( wp_remote_retrieve_body( $response ) );

		if ( ! is_array( $contributors ) ) {
			return array();
		}

		set_transient( 'woocommerce_contributors', $contributors, HOUR_IN_SECONDS );

		return $contributors;
	}

	/**
	 * Sends user to the welcome page on first activation.
	 */
	public function welcome() {

		// Bail if no activation redirect transient is set
		if ( ! get_transient( '_wc_activation_redirect' ) ) {
			return;
		}

		// Delete the redirect transient
		delete_transient( '_wc_activation_redirect' );

		// Bail if we are waiting to install or update via the interface update/install links
		if ( WC_Admin_Notices::has_notice( 'install' ) || WC_Admin_Notices::has_notice( 'update' ) ) {
			return;
		}

		// Bail if activating from network, or bulk, or within an iFrame
		if ( is_network_admin() || isset( $_GET['activate-multi'] ) || defined( 'IFRAME_REQUEST' ) ) {
			return;
		}

		if ( ( isset( $_GET['action'] ) && 'upgrade-plugin' == $_GET['action'] ) || ( ! empty( $_GET['page'] ) && $_GET['page'] === 'wc-about' ) ) {
			return;
		}

		wp_redirect( admin_url( 'index.php?page=wc-about' ) );
		exit;
	}
}

new WC_Admin_Welcome();
