<?php // phpcs:disable
// This file is copied over from GlotPress/GlotPress-WP project and does not nessitate linting.

if ( ! class_exists( 'GP_Locale' ) ) :

	class GP_Locale {
		public $english_name;
		public $native_name;
		public $text_direction      = 'ltr';
		public $lang_code_iso_639_1 = null;
		public $lang_code_iso_639_2 = null;
		public $lang_code_iso_639_3 = null;
		public $country_code;
		public $wp_locale; // This should only be set for locales that are officially supported on translate.wordpress.org.
		public $slug;
		public $nplurals                         = 2;
		public $plural_expression                = 'n != 1';
		public $google_code                      = null;
		public $preferred_sans_serif_font_family = null;
		public $facebook_locale                  = null;
		public $alphabet = 'latin';
		public $word_count_type = 'words';

		/**
		 *
		 * @since 3.0.0
		 *
		 * @var array
		 */

		// TODO: days, months, decimals, quotes

		private $_index_for_number;

		public function __construct( $args = array() ) {
			foreach ( $args as $key => $value ) {
				$this->$key = $value;
			}
		}

		public static function __set_state( $state ) {
			return new GP_Locale( $state );
		}

		/**
		 * Make deprecated properties checkable for backwards compatibility.
		 *
		 * @param string $name Property to check if set.
		 * @return bool Whether the property is set.
		 */
		public function __isset( $name ) {
			if ( 'rtl' == $name ) {
				return isset( $this->text_direction );
			}
			return false;
		}

		/**
		 * Make deprecated properties readable for backwards compatibility.
		 *
		 * @param string $name Property to get.
		 * @return mixed Property.
		 */
		public function __get( $name ) {
			if ( 'rtl' == $name ) {
				return ( 'rtl' === $this->text_direction );
			}

			return null;
		}

		public function combined_name() {
			/* translators: combined name for locales: 1: name in English, 2: native name */
			return sprintf( _x( '%1$s/%2$s', 'locales', 'jetpack-compat' ), $this->english_name, $this->native_name );
		}

		public function numbers_for_index( $index, $how_many = 3, $test_up_to = 1000 ) {
			$numbers = array();

			for ( $number = 0; $number < $test_up_to; ++$number ) {
				if ( $this->index_for_number( $number ) == $index ) {
					$numbers[] = $number;

					if ( count( $numbers ) >= $how_many ) {
						break;
					}
				}
			}

			return $numbers;
		}

		public function index_for_number( $number ) {
			if ( ! isset( $this->_index_for_number ) ) {
				$gettext                 = new Gettext_Translations;
				$expression              = $gettext->parenthesize_plural_exression( $this->plural_expression );
				$this->_index_for_number = $gettext->make_plural_form_function( $this->nplurals, $expression );
			}

			$f = $this->_index_for_number;

			return $f( $number );
		}

		/**
		 * When converting the object to a string, the combined name is returned.
		 *
		 * @since 3.0.0
		 *
		 * @return string Combined name of locale.
		 */
		public function __toString() {
			return $this->combined_name();
		}
	}

endif;

if ( ! class_exists( 'GP_Locales' ) ) :

	class GP_Locales {

		public $locales = array();

		public function __construct() {
			$aa                      = new GP_Locale();
			$aa->english_name        = 'Afar';
			$aa->native_name         = 'Afaraf';
			$aa->lang_code_iso_639_1 = 'aa';
			$aa->lang_code_iso_639_2 = 'aar';
			$aa->slug                = 'aa';

			$ae                      = new GP_Locale();
			$ae->english_name        = 'Avestan';
			$ae->native_name         = 'Avesta';
			$ae->lang_code_iso_639_1 = 'ae';
			$ae->lang_code_iso_639_2 = 'ave';
			$ae->slug                = 'ae';
			$ae->alphabet            = 'avestan';

			$af                      = new GP_Locale();
			$af->english_name        = 'Afrikaans';
			$af->native_name         = 'Afrikaans';
			$af->lang_code_iso_639_1 = 'af';
			$af->lang_code_iso_639_2 = 'afr';
			$af->country_code        = 'za';
			$af->wp_locale           = 'af';
			$af->slug                = 'af';
			$af->google_code         = 'af';
			$af->facebook_locale     = 'af_ZA';

			$ak                      = new GP_Locale();
			$ak->english_name        = 'Akan';
			$ak->native_name         = 'Akan';
			$ak->lang_code_iso_639_1 = 'ak';
			$ak->lang_code_iso_639_2 = 'aka';
			$ak->slug                = 'ak';
			$ak->facebook_locale     = 'ak_GH';
			$ak->alphabet            = 'adinkra';

			$am                      = new GP_Locale();
			$am->english_name        = 'Amharic';
			$am->native_name         = 'አማርኛ';
			$am->lang_code_iso_639_1 = 'am';
			$am->lang_code_iso_639_2 = 'amh';
			$am->country_code        = 'et';
			$am->wp_locale           = 'am';
			$am->slug                = 'am';
			$am->facebook_locale     = 'am_ET';
			$am->alphabet            = 'geez';

			$an                      = new GP_Locale();
			$an->english_name        = 'Aragonese';
			$an->native_name         = 'Aragonés';
			$an->lang_code_iso_639_1 = 'an';
			$an->lang_code_iso_639_2 = 'arg';
			$an->lang_code_iso_639_3 = 'arg';
			$an->country_code        = 'es';
			$an->wp_locale           = 'arg';
			$an->slug                = 'an';

			$ar                                   = new GP_Locale();
			$ar->english_name                     = 'Arabic';
			$ar->native_name                      = 'العربية';
			$ar->lang_code_iso_639_1              = 'ar';
			$ar->lang_code_iso_639_2              = 'ara';
			$ar->wp_locale                        = 'ar';
			$ar->slug                             = 'ar';
			$ar->nplurals                         = 6;
			$ar->plural_expression                = '(n == 0) ? 0 : ((n == 1) ? 1 : ((n == 2) ? 2 : ((n % 100 >= 3 && n % 100 <= 10) ? 3 : ((n % 100 >= 11 && n % 100 <= 99) ? 4 : 5))))';
			$ar->text_direction                   = 'rtl';
			$ar->preferred_sans_serif_font_family = 'Tahoma';
			$ar->google_code                      = 'ar';
			$ar->facebook_locale                  = 'ar_AR';
			$ar->alphabet                         = 'arabic';

			$arq                      = new GP_Locale();
			$arq->english_name        = 'Algerian Arabic';
			$arq->native_name         = 'الدارجة الجزايرية';
			$arq->lang_code_iso_639_1 = 'ar';
			$arq->lang_code_iso_639_3 = 'arq';
			$arq->country_code        = 'dz';
			$arq->wp_locale           = 'arq';
			$arq->slug                = 'arq';
			$arq->nplurals            = 6;
			$arq->plural_expression   = '(n == 0) ? 0 : ((n == 1) ? 1 : ((n == 2) ? 2 : ((n % 100 >= 3 && n % 100 <= 10) ? 3 : ((n % 100 >= 11 && n % 100 <= 99) ? 4 : 5))))';
			$arq->text_direction      = 'rtl';
			$arq->alphabet            = 'arabic';

			$ary                      = new GP_Locale();
			$ary->english_name        = 'Moroccan Arabic';
			$ary->native_name         = 'العربية المغربية';
			$ary->lang_code_iso_639_1 = 'ar';
			$ary->lang_code_iso_639_3 = 'ary';
			$ary->country_code        = 'ma';
			$ary->wp_locale           = 'ary';
			$ary->slug                = 'ary';
			$ary->nplurals            = 6;
			$ary->plural_expression   = '(n == 0) ? 0 : ((n == 1) ? 1 : ((n == 2) ? 2 : ((n % 100 >= 3 && n % 100 <= 10) ? 3 : ((n % 100 >= 11 && n % 100 <= 99) ? 4 : 5))))';
			$ary->text_direction      = 'rtl';
			$ary->alphabet            = 'arabic';

			$as                      = new GP_Locale();
			$as->english_name        = 'Assamese';
			$as->native_name         = 'অসমীয়া';
			$as->lang_code_iso_639_1 = 'as';
			$as->lang_code_iso_639_2 = 'asm';
			$as->lang_code_iso_639_3 = 'asm';
			$as->country_code        = 'in';
			$as->wp_locale           = 'as';
			$as->slug                = 'as';
			$as->facebook_locale     = 'as_IN';
			$as->alphabet            = 'assamese';

			$ast                      = new GP_Locale();
			$ast->english_name        = 'Asturian';
			$ast->native_name         = 'Asturianu';
			$ast->lang_code_iso_639_2 = 'ast';
			$ast->lang_code_iso_639_3 = 'ast';
			$ast->country_code        = 'es';
			$ast->wp_locale           = 'ast';
			$ast->slug                = 'ast';

			$av                      = new GP_Locale();
			$av->english_name        = 'Avaric';
			$av->native_name         = 'авар мацӀ';
			$av->lang_code_iso_639_1 = 'av';
			$av->lang_code_iso_639_2 = 'ava';
			$av->slug                = 'av';
			$av->alphabet            = 'cyrillic';

			$ay                      = new GP_Locale();
			$ay->english_name        = 'Aymara';
			$ay->native_name         = 'aymar aru';
			$ay->lang_code_iso_639_1 = 'ay';
			$ay->lang_code_iso_639_2 = 'aym';
			$ay->country_code        = 'bo';
			$ay->slug                = 'ay';
			$ay->nplurals            = 1;
			$ay->plural_expression   = '0';
			$ay->facebook_locale     = 'ay_BO';

			$az                      = new GP_Locale();
			$az->english_name        = 'Azerbaijani';
			$az->native_name         = 'Azərbaycan dili';
			$az->lang_code_iso_639_1 = 'az';
			$az->lang_code_iso_639_2 = 'aze';
			$az->country_code        = 'az';
			$az->wp_locale           = 'az';
			$az->slug                = 'az';
			$az->google_code         = 'az';
			$az->facebook_locale     = 'az_AZ';

			$azb                      = new GP_Locale();
			$azb->english_name        = 'South Azerbaijani';
			$azb->native_name         = 'گؤنئی آذربایجان';
			$azb->lang_code_iso_639_1 = 'az';
			$azb->lang_code_iso_639_3 = 'azb';
			$azb->country_code        = 'ir';
			$azb->wp_locale           = 'azb';
			$azb->slug                = 'azb';
			$azb->text_direction      = 'rtl';
			$azb->alphabet            = 'persian';

			$az_tr                      = new GP_Locale();
			$az_tr->english_name        = 'Azerbaijani (Turkey)';
			$az_tr->native_name         = 'Azərbaycan Türkcəsi';
			$az_tr->lang_code_iso_639_1 = 'az';
			$az_tr->lang_code_iso_639_2 = 'aze';
			$az_tr->country_code        = 'tr';
			$az_tr->wp_locale           = 'az_TR';
			$az_tr->slug                = 'az-tr';

			$ba                      = new GP_Locale();
			$ba->english_name        = 'Bashkir';
			$ba->native_name         = 'башҡорт теле';
			$ba->lang_code_iso_639_1 = 'ba';
			$ba->lang_code_iso_639_2 = 'bak';
			$ba->wp_locale           = 'ba';
			$ba->slug                = 'ba';
			$ba->alphabet            = 'cyrillic';

			$bal                      = new GP_Locale();
			$bal->english_name        = 'Catalan (Balear)';
			$bal->native_name         = 'Català (Balear)';
			$bal->lang_code_iso_639_2 = 'bal';
			$bal->country_code        = 'es';
			$bal->wp_locale           = 'bal';
			$bal->slug                = 'bal';

			$bcc                      = new GP_Locale();
			$bcc->english_name        = 'Balochi Southern';
			$bcc->native_name         = 'بلوچی مکرانی';
			$bcc->lang_code_iso_639_3 = 'bcc';
			$bcc->country_code        = 'pk';
			$bcc->wp_locale           = 'bcc';
			$bcc->slug                = 'bcc';
			$bcc->nplurals            = 1;
			$bcc->plural_expression   = '0';
			$bcc->text_direction      = 'rtl';
			$bcc->alphabet            = 'balochi';

			$be                      = new GP_Locale();
			$be->english_name        = 'Belarusian';
			$be->native_name         = 'Беларуская мова';
			$be->lang_code_iso_639_1 = 'be';
			$be->lang_code_iso_639_2 = 'bel';
			$be->country_code        = 'by';
			$be->wp_locale           = 'bel';
			$be->slug                = 'bel';
			$be->nplurals            = 3;
			$be->plural_expression   = '(n % 10 == 1 && n % 100 != 11) ? 0 : ((n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? 1 : 2)';
			$be->google_code         = 'be';
			$be->facebook_locale     = 'be_BY';
			$be->alphabet            = 'cyrillic';

			$bg                      = new GP_Locale();
			$bg->english_name        = 'Bulgarian';
			$bg->native_name         = 'Български';
			$bg->lang_code_iso_639_1 = 'bg';
			$bg->lang_code_iso_639_2 = 'bul';
			$bg->country_code        = 'bg';
			$bg->wp_locale           = 'bg_BG';
			$bg->slug                = 'bg';
			$bg->google_code         = 'bg';
			$bg->facebook_locale     = 'bg_BG';
			$bg->alphabet            = 'cyrillic';

			$bgn                      = new GP_Locale();
			$bgn->english_name        = 'Western Balochi';
			$bgn->native_name         = 'بلوچی‎';
			$bgn->lang_code_iso_639_3 = 'bgn';
			$bgn->country_code        = 'pk';
			$bgn->wp_locale           = 'bgn';
			$bgn->slug                = 'bgn';
			$bgn->text_direction      = 'rtl';
			$bgn->alphabet            = 'balochi';

			$bh                      = new GP_Locale();
			$bh->english_name        = 'Bihari';
			$bh->native_name         = 'भोजपुरी';
			$bh->lang_code_iso_639_1 = 'bh';
			$bh->lang_code_iso_639_2 = 'bih';
			$bh->slug                = 'bh';
			$bh->alphabet            = 'devanagari';

			$bho                      = new GP_Locale();
			$bho->english_name        = 'Bhojpuri';
			$bho->native_name         = 'भोजपुरी';
			$bho->lang_code_iso_639_3 = 'bho';
			$bho->country_code        = 'in';
			$bho->wp_locale           = 'bho';
			$bho->slug                = 'bho';
			$bho->alphabet            = 'devanagari';

			$bi                      = new GP_Locale();
			$bi->english_name        = 'Bislama';
			$bi->native_name         = 'Bislama';
			$bi->lang_code_iso_639_1 = 'bi';
			$bi->lang_code_iso_639_2 = 'bis';
			$bi->country_code        = 'vu';
			$bi->slug                = 'bi';

			$bm                      = new GP_Locale();
			$bm->english_name        = 'Bambara';
			$bm->native_name         = 'Bamanankan';
			$bm->lang_code_iso_639_1 = 'bm';
			$bm->lang_code_iso_639_2 = 'bam';
			$bm->slug                = 'bm';

			$bn_bd                      = new GP_Locale();
			$bn_bd->english_name        = 'Bengali (Bangladesh)';
			$bn_bd->native_name         = 'বাংলা';
			$bn_bd->lang_code_iso_639_1 = 'bn';
			$bn_bd->country_code        = 'bd';
			$bn_bd->wp_locale           = 'bn_BD';
			$bn_bd->slug                = 'bn';
			$bn_bd->google_code         = 'bn';
			$bn_bd->alphabet            = 'bengali';

			$bn_in                      = new GP_Locale();
			$bn_in->english_name        = 'Bengali (India)';
			$bn_in->native_name         = 'বাংলা (ভারত)';
			$bn_in->lang_code_iso_639_1 = 'bn';
			$bn_in->country_code        = 'in';
			$bn_in->wp_locale           = 'bn_IN';
			$bn_in->slug                = 'bn-in';
			$bn_in->google_code         = 'bn';
			$bn_in->facebook_locale     = 'bn_IN';
			$bn_in->nplurals            = 2;
			$bn_in->plural_expression   = 'n > 1';
			$bn_in->alphabet            = 'bengali';

			$bo                      = new GP_Locale();
			$bo->english_name        = 'Tibetan';
			$bo->native_name         = 'བོད་ཡིག';
			$bo->lang_code_iso_639_1 = 'bo';
			$bo->lang_code_iso_639_2 = 'tib';
			$bo->wp_locale           = 'bo';
			$bo->slug                = 'bo';
			$bo->nplurals            = 1;
			$bo->plural_expression   = '0';
			$bo->alphabet            = 'tibetan';
			$bo->word_count_type     = 'characters_excluding_spaces';

			$br                      = new GP_Locale();
			$br->english_name        = 'Breton';
			$br->native_name         = 'Brezhoneg';
			$br->lang_code_iso_639_1 = 'br';
			$br->lang_code_iso_639_2 = 'bre';
			$br->lang_code_iso_639_3 = 'bre';
			$br->country_code        = 'fr';
			$br->wp_locale           = 'bre';
			$br->slug                = 'br';
			$br->nplurals            = 2;
			$br->plural_expression   = 'n > 1';
			$br->facebook_locale     = 'br_FR';

			$brx                      = new GP_Locale();
			$brx->english_name        = 'Bodo';
			$brx->native_name         = 'बोडो‎';
			$brx->lang_code_iso_639_3 = 'brx';
			$brx->country_code        = 'in';
			$brx->wp_locale           = 'brx';
			$brx->slug                = 'brx';
			$brx->alphabet            = 'devanagari';

			$bs                      = new GP_Locale();
			$bs->english_name        = 'Bosnian';
			$bs->native_name         = 'Bosanski';
			$bs->lang_code_iso_639_1 = 'bs';
			$bs->lang_code_iso_639_2 = 'bos';
			$bs->country_code        = 'ba';
			$bs->wp_locale           = 'bs_BA';
			$bs->slug                = 'bs';
			$bs->nplurals            = 3;
			$bs->plural_expression   = '(n % 10 == 1 && n % 100 != 11) ? 0 : ((n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? 1 : 2)';
			$bs->google_code         = 'bs';
			$bs->facebook_locale     = 'bs_BA';

			$ca                      = new GP_Locale();
			$ca->english_name        = 'Catalan';
			$ca->native_name         = 'Català';
			$ca->lang_code_iso_639_1 = 'ca';
			$ca->lang_code_iso_639_2 = 'cat';
			$ca->wp_locale           = 'ca';
			$ca->slug                = 'ca';
			$ca->google_code         = 'ca';
			$ca->facebook_locale     = 'ca_ES';

			$ca_valencia                      = new GP_Locale();
			$ca_valencia->english_name        = 'Catalan (Valencian)';
			$ca_valencia->native_name         = 'Català (Valencià)';
			$ca_valencia->lang_code_iso_639_1 = 'ca';
			$ca_valencia->lang_code_iso_639_2 = 'cat';
			$ca_valencia->wp_locale           = 'ca_valencia';
			$ca_valencia->slug                = 'ca-val';
			$ca_valencia->google_code         = 'ca';
			$ca_valencia->facebook_locale     = 'ca_ES';

			$ce                      = new GP_Locale();
			$ce->english_name        = 'Chechen';
			$ce->native_name         = 'Нохчийн мотт';
			$ce->lang_code_iso_639_1 = 'ce';
			$ce->lang_code_iso_639_2 = 'che';
			$ce->slug                = 'ce';
			$ce->alphabet            = 'cyrillic';

			$ceb                      = new GP_Locale();
			$ceb->english_name        = 'Cebuano';
			$ceb->native_name         = 'Cebuano';
			$ceb->lang_code_iso_639_2 = 'ceb';
			$ceb->lang_code_iso_639_3 = 'ceb';
			$ceb->country_code        = 'ph';
			$ceb->wp_locale           = 'ceb';
			$ceb->slug                = 'ceb';
			$ceb->facebook_locale     = 'cx_PH';

			$ch                      = new GP_Locale();
			$ch->english_name        = 'Chamorro';
			$ch->native_name         = 'Chamoru';
			$ch->lang_code_iso_639_1 = 'ch';
			$ch->lang_code_iso_639_2 = 'cha';
			$ch->slug                = 'ch';

			$ckb                      = new GP_Locale();
			$ckb->english_name        = 'Kurdish (Sorani)';
			$ckb->native_name         = 'كوردی‎';
			$ckb->lang_code_iso_639_1 = 'ku';
			$ckb->lang_code_iso_639_3 = 'ckb';
			$ckb->country_code        = 'iq';
			$ckb->wp_locale           = 'ckb';
			$ckb->slug                = 'ckb';
			$ckb->text_direction      = 'rtl';
			$ckb->facebook_locale     = 'cb_IQ';
			$ckb->alphabet            = 'sorani';

			$co                      = new GP_Locale();
			$co->english_name        = 'Corsican';
			$co->native_name         = 'Corsu';
			$co->lang_code_iso_639_1 = 'co';
			$co->lang_code_iso_639_2 = 'cos';
			$co->country_code        = 'it';
			$co->wp_locale           = 'co';
			$co->slug                = 'co';

			$cor                      = new GP_Locale();
			$cor->english_name        = 'Cornish';
			$cor->native_name         = 'Kernewek';
			$cor->lang_code_iso_639_1 = 'kw';
			$cor->lang_code_iso_639_2 = 'cor';
			$cor->country_code        = 'gb';
			$cor->wp_locale           = 'cor';
			$cor->slug                = 'cor';
			$cor->nplurals            = 6;
			$cor->plural_expression   = '(n == 0) ? 0 : ((n == 1) ? 1 : (((n % 100 == 2 || n % 100 == 22 || n % 100 == 42 || n % 100 == 62 || n % 100 == 82) || n % 1000 == 0 && (n % 100000 >= 1000 && n % 100000 <= 20000 || n % 100000 == 40000 || n % 100000 == 60000 || n % 100000 == 80000) || n != 0 && n % 1000000 == 100000) ? 2 : ((n % 100 == 3 || n % 100 == 23 || n % 100 == 43 || n % 100 == 63 || n % 100 == 83) ? 3 : ((n != 1 && (n % 100 == 1 || n % 100 == 21 || n % 100 == 41 || n % 100 == 61 || n % 100 == 81)) ? 4 : 5))))';

			$cr                      = new GP_Locale();
			$cr->english_name        = 'Cree';
			$cr->native_name         = 'ᓀᐦᐃᔭᐍᐏᐣ';
			$cr->lang_code_iso_639_1 = 'cr';
			$cr->lang_code_iso_639_2 = 'cre';
			$cr->country_code        = 'ca';
			$cr->slug                = 'cr';
			$cr->alphabet            = 'syllabics';

			$cs                      = new GP_Locale();
			$cs->english_name        = 'Czech';
			$cs->native_name         = 'Čeština';
			$cs->lang_code_iso_639_1 = 'cs';
			$cs->lang_code_iso_639_2 = 'ces';
			$cs->country_code        = 'cz';
			$cs->wp_locale           = 'cs_CZ';
			$cs->slug                = 'cs';
			$cs->nplurals            = 3;
			$cs->plural_expression   = '(n == 1) ? 0 : ((n >= 2 && n <= 4) ? 1 : 2)';
			$cs->google_code         = 'cs';
			$cs->facebook_locale     = 'cs_CZ';

			$csb                      = new GP_Locale();
			$csb->english_name        = 'Kashubian';
			$csb->native_name         = 'Kaszëbsczi';
			$csb->lang_code_iso_639_2 = 'csb';
			$csb->slug                = 'csb';
			$csb->nplurals            = 3;
			$csb->plural_expression   = 'n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2';

			$cu                      = new GP_Locale();
			$cu->english_name        = 'Church Slavic';
			$cu->native_name         = 'ѩзыкъ словѣньскъ';
			$cu->lang_code_iso_639_1 = 'cu';
			$cu->lang_code_iso_639_2 = 'chu';
			$cu->slug                = 'cu';
			$cu->alphabet            = 'cyrillic';

			$cv                      = new GP_Locale();
			$cv->english_name        = 'Chuvash';
			$cv->native_name         = 'чӑваш чӗлхи';
			$cv->lang_code_iso_639_1 = 'cv';
			$cv->lang_code_iso_639_2 = 'chv';
			$cv->country_code        = 'ru';
			$cv->slug                = 'cv';
			$cv->alphabet            = 'cyrillic';

			$cy                      = new GP_Locale();
			$cy->english_name        = 'Welsh';
			$cy->native_name         = 'Cymraeg';
			$cy->lang_code_iso_639_1 = 'cy';
			$cy->lang_code_iso_639_2 = 'cym';
			$cy->country_code        = 'gb';
			$cy->wp_locale           = 'cy';
			$cy->slug                = 'cy';
			$cy->nplurals            = 4;
			$cy->plural_expression   = '(n==1) ? 0 : (n==2) ? 1 : (n != 8 && n != 11) ? 2 : 3';
			$cy->google_code         = 'cy';
			$cy->facebook_locale     = 'cy_GB';

			$da                      = new GP_Locale();
			$da->english_name        = 'Danish';
			$da->native_name         = 'Dansk';
			$da->lang_code_iso_639_1 = 'da';
			$da->lang_code_iso_639_2 = 'dan';
			$da->country_code        = 'dk';
			$da->wp_locale           = 'da_DK';
			$da->slug                = 'da';
			$da->google_code         = 'da';
			$da->facebook_locale     = 'da_DK';

			$de                      = new GP_Locale();
			$de->english_name        = 'German';
			$de->native_name         = 'Deutsch';
			$de->lang_code_iso_639_1 = 'de';
			$de->country_code        = 'de';
			$de->wp_locale           = 'de_DE';
			$de->slug                = 'de';
			$de->google_code         = 'de';
			$de->facebook_locale     = 'de_DE';

			$de_at                      = new GP_Locale();
			$de_at->english_name        = 'German (Austria)';
			$de_at->native_name         = 'Deutsch (Österreich)';
			$de_at->lang_code_iso_639_1 = 'de';
			$de_at->country_code        = 'at';
			$de_at->wp_locale           = 'de_AT';
			$de_at->slug                = 'de-at';
			$de_at->google_code         = 'de';

			$de_ch                      = new GP_Locale();
			$de_ch->english_name        = 'German (Switzerland)';
			$de_ch->native_name         = 'Deutsch (Schweiz)';
			$de_ch->lang_code_iso_639_1 = 'de';
			$de_ch->country_code        = 'ch';
			$de_ch->wp_locale           = 'de_CH';
			$de_ch->slug                = 'de-ch';
			$de_ch->google_code         = 'de';

			$dsb                      = new GP_Locale();
			$dsb->english_name        = 'Lower Sorbian';
			$dsb->native_name         = 'Dolnoserbšćina';
			$dsb->lang_code_iso_639_2 = 'dsb';
			$dsb->lang_code_iso_639_3 = 'dsb';
			$dsb->country_code        = 'de';
			$dsb->wp_locale           = 'dsb';
			$dsb->slug                = 'dsb';
			$dsb->nplurals            = 4;
			$dsb->plural_expression   = '(n % 100 == 1) ? 0 : ((n % 100 == 2) ? 1 : ((n % 100 == 3 || n % 100 == 4) ? 2 : 3))';

			$dv                      = new GP_Locale();
			$dv->english_name        = 'Dhivehi';
			$dv->native_name         = 'ދިވެހި';
			$dv->lang_code_iso_639_1 = 'dv';
			$dv->lang_code_iso_639_2 = 'div';
			$dv->country_code        = 'mv';
			$dv->wp_locale           = 'dv';
			$dv->slug                = 'dv';
			$dv->text_direction      = 'rtl';
			$dv->alphabet            = 'thaana';

			$dzo                      = new GP_Locale();
			$dzo->english_name        = 'Dzongkha';
			$dzo->native_name         = 'རྫོང་ཁ';
			$dzo->lang_code_iso_639_1 = 'dz';
			$dzo->lang_code_iso_639_2 = 'dzo';
			$dzo->country_code        = 'bt';
			$dzo->wp_locale           = 'dzo';
			$dzo->slug                = 'dzo';
			$dzo->nplurals            = 1;
			$dzo->plural_expression   = '0';
			$dzo->alphabet            = 'tibetan';

			$ewe                      = new GP_Locale();
			$ewe->english_name        = 'Ewe';
			$ewe->native_name         = 'Eʋegbe';
			$ewe->lang_code_iso_639_1 = 'ee';
			$ewe->lang_code_iso_639_2 = 'ewe';
			$ewe->lang_code_iso_639_3 = 'ewe';
			$ewe->country_code        = 'gh';
			$ewe->wp_locale           = 'ewe';
			$ewe->slug                = 'ee';

			$el                      = new GP_Locale();
			$el->english_name        = 'Greek';
			$el->native_name         = 'Ελληνικά';
			$el->lang_code_iso_639_1 = 'el';
			$el->lang_code_iso_639_2 = 'ell';
			$el->country_code        = 'gr';
			$el->wp_locale           = 'el';
			$el->slug                = 'el';
			$el->google_code         = 'el';
			$el->facebook_locale     = 'el_GR';
			$el->alphabet            = 'greek';

			$el_po               = new GP_Locale();
			$el_po->english_name = 'Greek (Polytonic)';
			$el_po->native_name  = 'Greek (Polytonic)'; // TODO.
			$el_po->country_code = 'gr';
			$el_po->slug         = 'el-po';
			$el_po->alphabet     = 'polytonic';

			$emoji                      = new GP_Locale();
			$emoji->english_name        = 'Emoji';
			$emoji->native_name         = "\xf0\x9f\x8c\x8f\xf0\x9f\x8c\x8d\xf0\x9f\x8c\x8e (Emoji)";
			$emoji->lang_code_iso_639_2 = 'art';
			$emoji->wp_locale           = 'art_xemoji';
			$emoji->slug                = 'art-xemoji';
			$emoji->nplurals            = 1;
			$emoji->plural_expression   = '0';
			$emoji->alphabet            = 'emoji';

			$en                      = new GP_Locale();
			$en->english_name        = 'English';
			$en->native_name         = 'English';
			$en->lang_code_iso_639_1 = 'en';
			$en->country_code        = 'us';
			$en->wp_locale           = 'en_US';
			$en->slug                = 'en';
			$en->google_code         = 'en';
			$en->facebook_locale     = 'en_US';

			$en_au                      = new GP_Locale();
			$en_au->english_name        = 'English (Australia)';
			$en_au->native_name         = 'English (Australia)';
			$en_au->lang_code_iso_639_1 = 'en';
			$en_au->lang_code_iso_639_2 = 'eng';
			$en_au->lang_code_iso_639_3 = 'eng';
			$en_au->country_code        = 'au';
			$en_au->wp_locale           = 'en_AU';
			$en_au->slug                = 'en-au';
			$en_au->google_code         = 'en';

			$en_ca                      = new GP_Locale();
			$en_ca->english_name        = 'English (Canada)';
			$en_ca->native_name         = 'English (Canada)';
			$en_ca->lang_code_iso_639_1 = 'en';
			$en_ca->lang_code_iso_639_2 = 'eng';
			$en_ca->lang_code_iso_639_3 = 'eng';
			$en_ca->country_code        = 'ca';
			$en_ca->wp_locale           = 'en_CA';
			$en_ca->slug                = 'en-ca';
			$en_ca->google_code         = 'en';

			$en_gb                      = new GP_Locale();
			$en_gb->english_name        = 'English (UK)';
			$en_gb->native_name         = 'English (UK)';
			$en_gb->lang_code_iso_639_1 = 'en';
			$en_gb->lang_code_iso_639_2 = 'eng';
			$en_gb->lang_code_iso_639_3 = 'eng';
			$en_gb->country_code        = 'gb';
			$en_gb->wp_locale           = 'en_GB';
			$en_gb->slug                = 'en-gb';
			$en_gb->google_code         = 'en';
			$en_gb->facebook_locale     = 'en_GB';

			$en_ie                      = new GP_Locale();
			$en_ie->english_name        = 'English (Ireland)';
			$en_ie->native_name         = 'English (Ireland)';
			$en_ie->lang_code_iso_639_1 = 'en';
			$en_ie->lang_code_iso_639_2 = 'eng';
			$en_ie->lang_code_iso_639_3 = 'eng';
			$en_ie->country_code        = 'ie';
			$en_ie->slug                = 'en-ie';
			$en_ie->google_code         = 'en';

			$en_nz                      = new GP_Locale();
			$en_nz->english_name        = 'English (New Zealand)';
			$en_nz->native_name         = 'English (New Zealand)';
			$en_nz->lang_code_iso_639_1 = 'en';
			$en_nz->lang_code_iso_639_2 = 'eng';
			$en_nz->lang_code_iso_639_3 = 'eng';
			$en_nz->country_code        = 'nz';
			$en_nz->wp_locale           = 'en_NZ';
			$en_nz->slug                = 'en-nz';
			$en_nz->google_code         = 'en';

			$en_za                      = new GP_Locale();
			$en_za->english_name        = 'English (South Africa)';
			$en_za->native_name         = 'English (South Africa)';
			$en_za->lang_code_iso_639_1 = 'en';
			$en_za->lang_code_iso_639_2 = 'eng';
			$en_za->lang_code_iso_639_3 = 'eng';
			$en_za->country_code        = 'za';
			$en_za->wp_locale           = 'en_ZA';
			$en_za->slug                = 'en-za';
			$en_za->google_code         = 'en';

			$eo                      = new GP_Locale();
			$eo->english_name        = 'Esperanto';
			$eo->native_name         = 'Esperanto';
			$eo->lang_code_iso_639_1 = 'eo';
			$eo->lang_code_iso_639_2 = 'epo';
			$eo->wp_locale           = 'eo';
			$eo->slug                = 'eo';
			$eo->google_code         = 'eo';
			$eo->facebook_locale     = 'eo_EO';

			$es                      = new GP_Locale();
			$es->english_name        = 'Spanish (Spain)';
			$es->native_name         = 'Español';
			$es->lang_code_iso_639_1 = 'es';
			$es->lang_code_iso_639_2 = 'spa';
			$es->lang_code_iso_639_3 = 'spa';
			$es->country_code        = 'es';
			$es->wp_locale           = 'es_ES';
			$es->slug                = 'es';
			$es->google_code         = 'es';
			$es->facebook_locale     = 'es_ES';

			$es_an                      = new GP_Locale();
			$es_an->english_name        = 'Spanish (Andalusia)';
			$es_an->native_name         = 'Español de Andalucía';
			$es_an->lang_code_iso_639_1 = 'es';
			$es_an->lang_code_iso_639_2 = 'spa';
			$es_an->lang_code_iso_639_3 = 'spa';
			$es_an->country_code        = 'es';
			$es_an->wp_locale           = 'es_AN';
			$es_an->slug                = 'es-an';

			$es_ar                      = new GP_Locale();
			$es_ar->english_name        = 'Spanish (Argentina)';
			$es_ar->native_name         = 'Español de Argentina';
			$es_ar->lang_code_iso_639_1 = 'es';
			$es_ar->lang_code_iso_639_2 = 'spa';
			$es_ar->lang_code_iso_639_3 = 'spa';
			$es_ar->country_code        = 'ar';
			$es_ar->wp_locale           = 'es_AR';
			$es_ar->slug                = 'es-ar';
			$es_ar->google_code         = 'es';
			$es_ar->facebook_locale     = 'es_LA';

			$es_cl                      = new GP_Locale();
			$es_cl->english_name        = 'Spanish (Chile)';
			$es_cl->native_name         = 'Español de Chile';
			$es_cl->lang_code_iso_639_1 = 'es';
			$es_cl->lang_code_iso_639_2 = 'spa';
			$es_cl->lang_code_iso_639_3 = 'spa';
			$es_cl->country_code        = 'cl';
			$es_cl->wp_locale           = 'es_CL';
			$es_cl->slug                = 'es-cl';
			$es_cl->google_code         = 'es';
			$es_cl->facebook_locale     = 'es_LA';

			$es_co                      = new GP_Locale();
			$es_co->english_name        = 'Spanish (Colombia)';
			$es_co->native_name         = 'Español de Colombia';
			$es_co->lang_code_iso_639_1 = 'es';
			$es_co->lang_code_iso_639_2 = 'spa';
			$es_co->lang_code_iso_639_3 = 'spa';
			$es_co->country_code        = 'co';
			$es_co->wp_locale           = 'es_CO';
			$es_co->slug                = 'es-co';
			$es_co->google_code         = 'es';
			$es_co->facebook_locale     = 'es_LA';

			$es_cr                      = new GP_Locale();
			$es_cr->english_name        = 'Spanish (Costa Rica)';
			$es_cr->native_name         = 'Español de Costa Rica';
			$es_cr->lang_code_iso_639_1 = 'es';
			$es_cr->lang_code_iso_639_2 = 'spa';
			$es_cr->lang_code_iso_639_3 = 'spa';
			$es_cr->country_code        = 'cr';
			$es_cr->wp_locale           = 'es_CR';
			$es_cr->slug                = 'es-cr';
			$es_cr->google_code         = 'es';
			$es_cr->facebook_locale     = 'es_LA';

			$es_do                      = new GP_Locale();
			$es_do->english_name        = 'Spanish (Dominican Republic)';
			$es_do->native_name         = 'Español de República Dominicana';
			$es_do->lang_code_iso_639_1 = 'es';
			$es_do->lang_code_iso_639_2 = 'spa';
			$es_do->lang_code_iso_639_3 = 'spa';
			$es_do->country_code        = 'do';
			$es_do->wp_locale           = 'es_DO';
			$es_do->slug                = 'es-do';
			$es_do->google_code         = 'es';
			$es_do->facebook_locale     = 'es_LA';

			$es_ec                      = new GP_Locale();
			$es_ec->english_name        = 'Spanish (Ecuador)';
			$es_ec->native_name         = 'Español de Ecuador';
			$es_ec->lang_code_iso_639_1 = 'es';
			$es_ec->lang_code_iso_639_2 = 'spa';
			$es_ec->lang_code_iso_639_3 = 'spa';
			$es_ec->country_code        = 'ec';
			$es_ec->wp_locale           = 'es_EC';
			$es_ec->slug                = 'es-ec';
			$es_ec->google_code         = 'es';
			$es_ec->facebook_locale     = 'es_LA';

			$es_gt                      = new GP_Locale();
			$es_gt->english_name        = 'Spanish (Guatemala)';
			$es_gt->native_name         = 'Español de Guatemala';
			$es_gt->lang_code_iso_639_1 = 'es';
			$es_gt->lang_code_iso_639_2 = 'spa';
			$es_gt->lang_code_iso_639_3 = 'spa';
			$es_gt->country_code        = 'gt';
			$es_gt->wp_locale           = 'es_GT';
			$es_gt->slug                = 'es-gt';
			$es_gt->google_code         = 'es';
			$es_gt->facebook_locale     = 'es_LA';

			$es_hn                      = new GP_Locale();
			$es_hn->english_name        = 'Spanish (Honduras)';
			$es_hn->native_name         = 'Español de Honduras';
			$es_hn->lang_code_iso_639_1 = 'es';
			$es_hn->lang_code_iso_639_2 = 'spa';
			$es_hn->lang_code_iso_639_3 = 'spa';
			$es_hn->country_code        = 'hn';
			$es_hn->wp_locale           = 'es_HN';
			$es_hn->slug                = 'es-hn';
			$es_hn->google_code         = 'es';
			$es_hn->facebook_locale     = 'es_LA';

			$es_mx                      = new GP_Locale();
			$es_mx->english_name        = 'Spanish (Mexico)';
			$es_mx->native_name         = 'Español de México';
			$es_mx->lang_code_iso_639_1 = 'es';
			$es_mx->lang_code_iso_639_2 = 'spa';
			$es_mx->lang_code_iso_639_3 = 'spa';
			$es_mx->country_code        = 'mx';
			$es_mx->wp_locale           = 'es_MX';
			$es_mx->slug                = 'es-mx';
			$es_mx->google_code         = 'es';
			$es_mx->facebook_locale     = 'es_LA';

			$es_pa                      = new GP_Locale();
			$es_pa->english_name        = 'Spanish (Panama)';
			$es_pa->native_name         = 'Español de Panamá';
			$es_pa->lang_code_iso_639_1 = 'es';
			$es_pa->lang_code_iso_639_2 = 'spa';
			$es_pa->lang_code_iso_639_3 = 'spa';
			$es_pa->country_code        = 'pa';
			$es_pa->slug                = 'es-pa';
			$es_pa->google_code         = 'es';
			$es_pa->facebook_locale     = 'es_LA';

			$es_pe                      = new GP_Locale();
			$es_pe->english_name        = 'Spanish (Peru)';
			$es_pe->native_name         = 'Español de Perú';
			$es_pe->lang_code_iso_639_1 = 'es';
			$es_pe->lang_code_iso_639_2 = 'spa';
			$es_pe->lang_code_iso_639_3 = 'spa';
			$es_pe->country_code        = 'pe';
			$es_pe->wp_locale           = 'es_PE';
			$es_pe->slug                = 'es-pe';
			$es_pe->google_code         = 'es';
			$es_pe->facebook_locale     = 'es_LA';

			$es_pr                      = new GP_Locale();
			$es_pr->english_name        = 'Spanish (Puerto Rico)';
			$es_pr->native_name         = 'Español de Puerto Rico';
			$es_pr->lang_code_iso_639_1 = 'es';
			$es_pr->lang_code_iso_639_2 = 'spa';
			$es_pr->lang_code_iso_639_3 = 'spa';
			$es_pr->country_code        = 'pr';
			$es_pr->wp_locale           = 'es_PR';
			$es_pr->slug                = 'es-pr';
			$es_pr->google_code         = 'es';
			$es_pr->facebook_locale     = 'es_LA';

			$es_us                      = new GP_Locale();
			$es_us->english_name        = 'Spanish (US)';
			$es_us->native_name         = 'Español de los Estados Unidos';
			$es_us->lang_code_iso_639_1 = 'es';
			$es_us->lang_code_iso_639_2 = 'spa';
			$es_us->lang_code_iso_639_3 = 'spa';
			$es_us->country_code        = 'us';
			$es_us->slug                = 'es-us';
			$es_us->google_code         = 'es';

			$es_uy                      = new GP_Locale();
			$es_uy->english_name        = 'Spanish (Uruguay)';
			$es_uy->native_name         = 'Español de Uruguay';
			$es_uy->lang_code_iso_639_1 = 'es';
			$es_uy->lang_code_iso_639_2 = 'spa';
			$es_uy->lang_code_iso_639_3 = 'spa';
			$es_uy->country_code        = 'uy';
			$es_uy->wp_locale           = 'es_UY';
			$es_uy->slug                = 'es-uy';
			$es_uy->google_code         = 'es';
			$es_uy->facebook_locale     = 'es_LA';

			$es_ve                      = new GP_Locale();
			$es_ve->english_name        = 'Spanish (Venezuela)';
			$es_ve->native_name         = 'Español de Venezuela';
			$es_ve->lang_code_iso_639_1 = 'es';
			$es_ve->lang_code_iso_639_2 = 'spa';
			$es_ve->lang_code_iso_639_3 = 'spa';
			$es_ve->country_code        = 've';
			$es_ve->wp_locale           = 'es_VE';
			$es_ve->slug                = 'es-ve';
			$es_ve->google_code         = 'es';
			$es_ve->facebook_locale     = 'es_LA';

			$et                      = new GP_Locale();
			$et->english_name        = 'Estonian';
			$et->native_name         = 'Eesti';
			$et->lang_code_iso_639_1 = 'et';
			$et->lang_code_iso_639_2 = 'est';
			$et->country_code        = 'ee';
			$et->wp_locale           = 'et';
			$et->slug                = 'et';
			$et->google_code         = 'et';
			$et->facebook_locale     = 'et_EE';

			$eu                      = new GP_Locale();
			$eu->english_name        = 'Basque';
			$eu->native_name         = 'Euskara';
			$eu->lang_code_iso_639_1 = 'eu';
			$eu->lang_code_iso_639_2 = 'eus';
			$eu->country_code        = 'es';
			$eu->wp_locale           = 'eu';
			$eu->slug                = 'eu';
			$eu->google_code         = 'eu';
			$eu->facebook_locale     = 'eu_ES';

			$fa                      = new GP_Locale();
			$fa->english_name        = 'Persian';
			$fa->native_name         = 'فارسی';
			$fa->lang_code_iso_639_1 = 'fa';
			$fa->lang_code_iso_639_2 = 'fas';
			$fa->wp_locale           = 'fa_IR';
			$fa->slug                = 'fa';
			$fa->nplurals            = 2;
			$fa->plural_expression   = 'n > 1';
			$fa->text_direction      = 'rtl';
			$fa->google_code         = 'fa';
			$fa->facebook_locale     = 'fa_IR';
			$fa->alphabet            = 'persian';

			$fa_af                      = new GP_Locale();
			$fa_af->english_name        = 'Persian (Afghanistan)';
			$fa_af->native_name         = '(فارسی (افغانستان';
			$fa_af->lang_code_iso_639_1 = 'fa';
			$fa_af->lang_code_iso_639_2 = 'fas';
			$fa_af->country_code        = 'af';
			$fa_af->wp_locale           = 'fa_AF';
			$fa_af->slug                = 'fa-af';
			$fa_af->nplurals            = 2;
			$fa_af->plural_expression   = 'n > 1';
			$fa_af->text_direction      = 'rtl';
			$fa_af->google_code         = 'fa';
			$fa_af->alphabet            = 'persian';

			$ff_sn                      = new GP_Locale();
			$ff_sn->english_name        = 'Fulah';
			$ff_sn->native_name         = 'Pulaar';
			$ff_sn->lang_code_iso_639_1 = 'ff';
			$ff_sn->lang_code_iso_639_2 = 'fuc';
			$ff_sn->country_code        = 'sn';
			$ff_sn->wp_locale           = 'fuc';
			$ff_sn->slug                = 'fuc';

			$fi                      = new GP_Locale();
			$fi->english_name        = 'Finnish';
			$fi->native_name         = 'Suomi';
			$fi->lang_code_iso_639_1 = 'fi';
			$fi->lang_code_iso_639_2 = 'fin';
			$fi->country_code        = 'fi';
			$fi->wp_locale           = 'fi';
			$fi->slug                = 'fi';
			$fi->google_code         = 'fi';
			$fi->facebook_locale     = 'fi_FI';

			$fj                      = new GP_Locale();
			$fj->english_name        = 'Fijian';
			$fj->native_name         = 'Vosa Vakaviti';
			$fj->lang_code_iso_639_1 = 'fj';
			$fj->lang_code_iso_639_2 = 'fij';
			$fj->country_code        = 'fj';
			$fj->slug                = 'fj';

			$fo                      = new GP_Locale();
			$fo->english_name        = 'Faroese';
			$fo->native_name         = 'Føroyskt';
			$fo->lang_code_iso_639_1 = 'fo';
			$fo->lang_code_iso_639_2 = 'fao';
			$fo->country_code        = 'fo';
			$fo->wp_locale           = 'fo';
			$fo->slug                = 'fo';
			$fo->facebook_locale     = 'fo_FO';

			$fon                      = new GP_Locale();
			$fon->english_name        = 'Fon';
			$fon->native_name         = 'fɔ̀ngbè';
			$fon->lang_code_iso_639_2 = 'fon';
			$fon->lang_code_iso_639_3 = 'fon';
			$fon->country_code        = 'bj';
			$fon->wp_locale           = 'fon';
			$fon->slug                = 'fon';

			$fr                      = new GP_Locale();
			$fr->english_name        = 'French (France)';
			$fr->native_name         = 'Français';
			$fr->lang_code_iso_639_1 = 'fr';
			$fr->country_code        = 'fr';
			$fr->wp_locale           = 'fr_FR';
			$fr->slug                = 'fr';
			$fr->nplurals            = 2;
			$fr->plural_expression   = 'n > 1';
			$fr->google_code         = 'fr';
			$fr->facebook_locale     = 'fr_FR';

			$fr_be                      = new GP_Locale();
			$fr_be->english_name        = 'French (Belgium)';
			$fr_be->native_name         = 'Français de Belgique';
			$fr_be->lang_code_iso_639_1 = 'fr';
			$fr_be->lang_code_iso_639_2 = 'fra';
			$fr_be->country_code        = 'be';
			$fr_be->wp_locale           = 'fr_BE';
			$fr_be->slug                = 'fr-be';
			$fr_be->nplurals            = 2;
			$fr_be->plural_expression   = 'n > 1';

			$fr_ca                      = new GP_Locale();
			$fr_ca->english_name        = 'French (Canada)';
			$fr_ca->native_name         = 'Français du Canada';
			$fr_ca->lang_code_iso_639_1 = 'fr';
			$fr_ca->lang_code_iso_639_2 = 'fra';
			$fr_ca->country_code        = 'ca';
			$fr_ca->wp_locale           = 'fr_CA';
			$fr_ca->slug                = 'fr-ca';
			$fr_ca->nplurals            = 2;
			$fr_ca->plural_expression   = 'n > 1';
			$fr_ca->facebook_locale     = 'fr_CA';

			$fr_ch                      = new GP_Locale();
			$fr_ch->english_name        = 'French (Switzerland)';
			$fr_ch->native_name         = 'Français de Suisse';
			$fr_ch->lang_code_iso_639_1 = 'fr';
			$fr_ch->lang_code_iso_639_2 = 'fra';
			$fr_ch->country_code        = 'ch';
			$fr_ch->slug                = 'fr-ch';
			$fr_ch->nplurals            = 2;
			$fr_ch->plural_expression   = 'n > 1';

			$frp                      = new GP_Locale();
			$frp->english_name        = 'Arpitan';
			$frp->native_name         = 'Arpitan';
			$frp->lang_code_iso_639_3 = 'frp';
			$frp->country_code        = 'fr';
			$frp->wp_locale           = 'frp';
			$frp->slug                = 'frp';
			$frp->nplurals            = 2;
			$frp->plural_expression   = 'n > 1';

			$ful                      = new GP_Locale();
			$ful->english_name        = 'Fula';
			$ful->native_name         = 'Fulfulde';
			$ful->lang_code_iso_639_1 = 'ff';
			$ful->lang_code_iso_639_2 = 'ful';
			$ful->lang_code_iso_639_3 = 'ful';
			$ful->country_code        = 'ng';
			$ful->slug                = 'ful';
			$ful->facebook_locale     = 'ff_NG';

			$fur                      = new GP_Locale();
			$fur->english_name        = 'Friulian';
			$fur->native_name         = 'Friulian';
			$fur->lang_code_iso_639_2 = 'fur';
			$fur->lang_code_iso_639_3 = 'fur';
			$fur->country_code        = 'it';
			$fur->wp_locale           = 'fur';
			$fur->slug                = 'fur';

			$fy                      = new GP_Locale();
			$fy->english_name        = 'Frisian';
			$fy->native_name         = 'Frysk';
			$fy->lang_code_iso_639_1 = 'fy';
			$fy->lang_code_iso_639_2 = 'fry';
			$fy->country_code        = 'nl';
			$fy->wp_locale           = 'fy';
			$fy->slug                = 'fy';
			$fy->facebook_locale     = 'fy_NL';

			$ga                      = new GP_Locale();
			$ga->english_name        = 'Irish';
			$ga->native_name         = 'Gaelige';
			$ga->lang_code_iso_639_1 = 'ga';
			$ga->lang_code_iso_639_2 = 'gle';
			$ga->country_code        = 'ie';
			$ga->slug                = 'ga';
			$ga->wp_locale           = 'ga';
			$ga->nplurals            = 5;
			$ga->plural_expression   = '(n == 1) ? 0 : ((n == 2) ? 1 : ((n >= 3 && n <= 6) ? 2 : ((n >= 7 && n <= 10) ? 3 : 4)))';
			$ga->google_code         = 'ga';
			$ga->facebook_locale     = 'ga_IE';

			$gax                      = new GP_Locale();
			$gax->english_name        = 'Borana-Arsi-Guji Oromo';
			$gax->native_name         = 'Afaan Oromoo';
			$gax->lang_code_iso_639_3 = 'gax';
			$gax->country_code        = 'et';
			$gax->slug                = 'gax';
			$gax->wp_locale           = 'gax';
			$gax->nplurals            = 2;
			$gax->plural_expression   = 'n > 1';

			$gd                      = new GP_Locale();
			$gd->english_name        = 'Scottish Gaelic';
			$gd->native_name         = 'Gàidhlig';
			$gd->lang_code_iso_639_1 = 'gd';
			$gd->lang_code_iso_639_2 = 'gla';
			$gd->lang_code_iso_639_3 = 'gla';
			$gd->country_code        = 'gb';
			$gd->wp_locale           = 'gd';
			$gd->slug                = 'gd';
			$gd->nplurals            = 4;
			$gd->plural_expression   = '(n == 1 || n == 11) ? 0 : ((n == 2 || n == 12) ? 1 : ((n >= 3 && n <= 10 || n >= 13 && n <= 19) ? 2 : 3))';
			$gd->google_code         = 'gd';

			$gl                      = new GP_Locale();
			$gl->english_name        = 'Galician';
			$gl->native_name         = 'Galego';
			$gl->lang_code_iso_639_1 = 'gl';
			$gl->lang_code_iso_639_2 = 'glg';
			$gl->country_code        = 'es';
			$gl->wp_locale           = 'gl_ES';
			$gl->slug                = 'gl';
			$gl->google_code         = 'gl';
			$gl->facebook_locale     = 'gl_ES';

			$gn                      = new GP_Locale();
			$gn->english_name        = 'Guaraní';
			$gn->native_name         = 'Avañe\'ẽ';
			$gn->lang_code_iso_639_1 = 'gn';
			$gn->lang_code_iso_639_2 = 'grn';
			$gn->slug                = 'gn';

			$gsw                      = new GP_Locale();
			$gsw->english_name        = 'Swiss German';
			$gsw->native_name         = 'Schwyzerdütsch';
			$gsw->lang_code_iso_639_2 = 'gsw';
			$gsw->lang_code_iso_639_3 = 'gsw';
			$gsw->country_code        = 'ch';
			$gsw->slug                = 'gsw';

			$gu                      = new GP_Locale();
			$gu->english_name        = 'Gujarati';
			$gu->native_name         = 'ગુજરાતી';
			$gu->lang_code_iso_639_1 = 'gu';
			$gu->lang_code_iso_639_2 = 'guj';
			$gu->wp_locale           = 'gu';
			$gu->slug                = 'gu';
			$gu->google_code         = 'gu';
			$gu->facebook_locale     = 'gu_IN';
			$gu->alphabet            = 'gujarati';

			$ha                      = new GP_Locale();
			$ha->english_name        = 'Hausa (Arabic)';
			$ha->native_name         = 'هَوُسَ';
			$ha->lang_code_iso_639_1 = 'ha';
			$ha->lang_code_iso_639_2 = 'hau';
			$ha->slug                = 'ha';
			$ha->text_direction      = 'rtl';
			$ha->google_code         = 'ha';
			$ha->alphabet            = 'arabic';

			$hat                      = new GP_Locale();
			$hat->english_name        = 'Haitian Creole';
			$hat->native_name         = 'Kreyol ayisyen';
			$hat->lang_code_iso_639_1 = 'ht';
			$hat->lang_code_iso_639_2 = 'hat';
			$hat->lang_code_iso_639_3 = 'hat';
			$hat->country_code        = 'ht';
			$hat->wp_locale           = 'hat';
			$hat->slug                = 'hat';

			$hau                      = new GP_Locale();
			$hau->english_name        = 'Hausa';
			$hau->native_name         = 'Harshen Hausa';
			$hau->lang_code_iso_639_1 = 'ha';
			$hau->lang_code_iso_639_2 = 'hau';
			$hau->lang_code_iso_639_3 = 'hau';
			$hau->country_code        = 'ng';
			$hau->wp_locale           = 'hau';
			$hau->slug                = 'hau';
			$hau->google_code         = 'ha';
			$hau->facebook_locale     = 'ha_NG';

			$haw                      = new GP_Locale();
			$haw->english_name        = 'Hawaiian';
			$haw->native_name         = 'Ōlelo Hawaiʻi';
			$haw->lang_code_iso_639_2 = 'haw';
			$haw->country_code        = 'us';
			$haw->wp_locale           = 'haw_US';
			$haw->slug                = 'haw';

			$haz                      = new GP_Locale();
			$haz->english_name        = 'Hazaragi';
			$haz->native_name         = 'هزاره گی';
			$haz->lang_code_iso_639_3 = 'haz';
			$haz->country_code        = 'af';
			$haz->wp_locale           = 'haz';
			$haz->slug                = 'haz';
			$haz->text_direction      = 'rtl';
			$haz->alphabet            = 'arabic';

			$he                      = new GP_Locale();
			$he->english_name        = 'Hebrew';
			$he->native_name         = 'עִבְרִית';
			$he->lang_code_iso_639_1 = 'he';
			$he->country_code        = 'il';
			$he->wp_locale           = 'he_IL';
			$he->slug                = 'he';
			$he->text_direction      = 'rtl';
			$he->google_code         = 'iw';
			$he->facebook_locale     = 'he_IL';
			$he->alphabet            = 'hebrew';

			$hi                      = new GP_Locale();
			$hi->english_name        = 'Hindi';
			$hi->native_name         = 'हिन्दी';
			$hi->lang_code_iso_639_1 = 'hi';
			$hi->lang_code_iso_639_2 = 'hin';
			$hi->country_code        = 'in';
			$hi->wp_locale           = 'hi_IN';
			$hi->slug                = 'hi';
			$hi->google_code         = 'hi';
			$hi->facebook_locale     = 'hi_IN';
			$hi->alphabet            = 'devanagari';

			$hr                      = new GP_Locale();
			$hr->english_name        = 'Croatian';
			$hr->native_name         = 'Hrvatski';
			$hr->lang_code_iso_639_1 = 'hr';
			$hr->lang_code_iso_639_2 = 'hrv';
			$hr->country_code        = 'hr';
			$hr->wp_locale           = 'hr';
			$hr->slug                = 'hr';
			$hr->nplurals            = 3;
			$hr->plural_expression   = '(n % 10 == 1 && n % 100 != 11) ? 0 : ((n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? 1 : 2)';
			$hr->google_code         = 'hr';
			$hr->facebook_locale     = 'hr_HR';

			$hsb                      = new GP_Locale();
			$hsb->english_name        = 'Upper Sorbian';
			$hsb->native_name         = 'Hornjoserbšćina';
			$hsb->lang_code_iso_639_2 = 'hsb';
			$hsb->lang_code_iso_639_3 = 'hsb';
			$hsb->country_code        = 'de';
			$hsb->wp_locale           = 'hsb';
			$hsb->slug                = 'hsb';
			$hsb->nplurals            = 4;
			$hsb->plural_expression   = '(n % 100 == 1) ? 0 : ((n % 100 == 2) ? 1 : ((n % 100 == 3 || n % 100 == 4) ? 2 : 3))';

			$hu                      = new GP_Locale();
			$hu->english_name        = 'Hungarian';
			$hu->native_name         = 'Magyar';
			$hu->lang_code_iso_639_1 = 'hu';
			$hu->lang_code_iso_639_2 = 'hun';
			$hu->country_code        = 'hu';
			$hu->wp_locale           = 'hu_HU';
			$hu->slug                = 'hu';
			$hu->google_code         = 'hu';
			$hu->facebook_locale     = 'hu_HU';

			$hy                      = new GP_Locale();
			$hy->english_name        = 'Armenian';
			$hy->native_name         = 'Հայերեն';
			$hy->lang_code_iso_639_1 = 'hy';
			$hy->lang_code_iso_639_2 = 'hye';
			$hy->country_code        = 'am';
			$hy->wp_locale           = 'hy';
			$hy->slug                = 'hy';
			$hy->google_code         = 'hy';
			$hy->facebook_locale     = 'hy_AM';
			$hy->alphabet            = 'armenian';

			$ia                      = new GP_Locale();
			$ia->english_name        = 'Interlingua';
			$ia->native_name         = 'Interlingua';
			$ia->lang_code_iso_639_1 = 'ia';
			$ia->lang_code_iso_639_2 = 'ina';
			$ia->slug                = 'ia';

			$ibo                      = new GP_Locale();
			$ibo->english_name        = 'Igbo';
			$ibo->native_name         = 'Asụsụ Igbo';
			$ibo->lang_code_iso_639_1 = 'ig';
			$ibo->lang_code_iso_639_2 = 'ibo';
			$ibo->lang_code_iso_639_3 = 'ibo';
			$ibo->country_code        = 'ng';
			$ibo->wp_locale           = 'ibo';
			$ibo->slug                = 'ibo';
			$ibo->nplurals            = 1;
			$ibo->plural_expression   = '0';
			$ibo->google_code         = 'ig';

			$id                      = new GP_Locale();
			$id->english_name        = 'Indonesian';
			$id->native_name         = 'Bahasa Indonesia';
			$id->lang_code_iso_639_1 = 'id';
			$id->lang_code_iso_639_2 = 'ind';
			$id->country_code        = 'id';
			$id->wp_locale           = 'id_ID';
			$id->slug                = 'id';
			$id->nplurals            = 2;
			$id->plural_expression   = 'n > 1';
			$id->google_code         = 'id';
			$id->facebook_locale     = 'id_ID';

			$ido                      = new GP_Locale();
			$ido->english_name        = 'Ido';
			$ido->native_name         = 'Ido';
			$ido->lang_code_iso_639_1 = 'io';
			$ido->lang_code_iso_639_2 = 'ido';
			$ido->lang_code_iso_639_3 = 'ido';
			$ido->wp_locale           = 'ido';
			$ido->slug                = 'ido';

			$ike                      = new GP_Locale();
			$ike->english_name        = 'Inuktitut';
			$ike->native_name         = 'ᐃᓄᒃᑎᑐᑦ';
			$ike->lang_code_iso_639_1 = 'iu';
			$ike->lang_code_iso_639_2 = 'iku';
			$ike->country_code        = 'ca';
			$ike->slug                = 'ike';
			$ike->nplurals            = 3;
			$ike->plural_expression   = '(n == 1) ? 0 : ((n == 2) ? 1 : 2)';
			$ike->alphabet            = 'syllabics';

			$ilo                      = new GP_Locale();
			$ilo->english_name        = 'Iloko';
			$ilo->native_name         = 'Pagsasao nga Iloko';
			$ilo->lang_code_iso_639_2 = 'ilo';
			$ilo->country_code        = 'ph';
			$ilo->slug                = 'ilo';

			$is                      = new GP_Locale();
			$is->english_name        = 'Icelandic';
			$is->native_name         = 'Íslenska';
			$is->lang_code_iso_639_1 = 'is';
			$is->lang_code_iso_639_2 = 'isl';
			$is->country_code        = 'is';
			$is->slug                = 'is';
			$is->wp_locale           = 'is_IS';
			$is->nplurals            = 2;
			$is->plural_expression   = 'n % 10 != 1 || n % 100 == 11';
			$is->google_code         = 'is';
			$is->facebook_locale     = 'is_IS';

			$it                      = new GP_Locale();
			$it->english_name        = 'Italian';
			$it->native_name         = 'Italiano';
			$it->lang_code_iso_639_1 = 'it';
			$it->lang_code_iso_639_2 = 'ita';
			$it->country_code        = 'it';
			$it->wp_locale           = 'it_IT';
			$it->slug                = 'it';
			$it->google_code         = 'it';
			$it->facebook_locale     = 'it_IT';

			$ja                      = new GP_Locale();
			$ja->english_name        = 'Japanese';
			$ja->native_name         = '日本語';
			$ja->lang_code_iso_639_1 = 'ja';
			$ja->country_code        = 'jp';
			$ja->wp_locale           = 'ja';
			$ja->slug                = 'ja';
			$ja->google_code         = 'ja';
			$ja->facebook_locale     = 'ja_JP';
			$ja->nplurals            = 1;
			$ja->plural_expression   = '0';
			$ja->alphabet            = 'kanji';
			$ja->word_count_type     = 'characters_including_spaces';

			$jv                      = new GP_Locale();
			$jv->english_name        = 'Javanese';
			$jv->native_name         = 'Basa Jawa';
			$jv->lang_code_iso_639_1 = 'jv';
			$jv->lang_code_iso_639_2 = 'jav';
			$jv->country_code        = 'id';
			$jv->wp_locale           = 'jv_ID';
			$jv->slug                = 'jv';
			$jv->google_code         = 'jw';
			$jv->facebook_locale     = 'jv_ID';

			$ka                      = new GP_Locale();
			$ka->english_name        = 'Georgian';
			$ka->native_name         = 'ქართული';
			$ka->lang_code_iso_639_1 = 'ka';
			$ka->lang_code_iso_639_2 = 'kat';
			$ka->country_code        = 'ge';
			$ka->wp_locale           = 'ka_GE';
			$ka->slug                = 'ka';
			$ka->nplurals            = 1;
			$ka->plural_expression   = '0';
			$ka->google_code         = 'ka';
			$ka->facebook_locale     = 'ka_GE';
			$ka->alphabet            = 'georgian';

			$kaa                      = new GP_Locale();
			$kaa->english_name        = 'Karakalpak';
			$kaa->native_name         = 'Qaraqalpaq tili';
			$kaa->lang_code_iso_639_2 = 'kaa';
			$kaa->lang_code_iso_639_3 = 'kaa';
			$kaa->country_code        = 'uz';
			$kaa->wp_locale           = 'kaa';
			$kaa->slug                = 'kaa';

			$kab                      = new GP_Locale();
			$kab->english_name        = 'Kabyle';
			$kab->native_name         = 'Taqbaylit';
			$kab->lang_code_iso_639_2 = 'kab';
			$kab->lang_code_iso_639_3 = 'kab';
			$kab->country_code        = 'dz';
			$kab->wp_locale           = 'kab';
			$kab->slug                = 'kab';
			$kab->nplurals            = 2;
			$kab->plural_expression   = 'n > 1';

			$kal                      = new GP_Locale();
			$kal->english_name        = 'Greenlandic';
			$kal->native_name         = 'Kalaallisut';
			$kal->lang_code_iso_639_1 = 'kl';
			$kal->lang_code_iso_639_2 = 'kal';
			$kal->lang_code_iso_639_3 = 'kal';
			$kal->country_code        = 'gl';
			$kal->wp_locale           = 'kal';
			$kal->slug                = 'kal';

			$kin                      = new GP_Locale();
			$kin->english_name        = 'Kinyarwanda';
			$kin->native_name         = 'Ikinyarwanda';
			$kin->lang_code_iso_639_1 = 'rw';
			$kin->lang_code_iso_639_2 = 'kin';
			$kin->lang_code_iso_639_3 = 'kin';
			$kin->wp_locale           = 'kin';
			$kin->country_code        = 'rw';
			$kin->slug                = 'kin';
			$kin->facebook_locale     = 'rw_RW';

			$kk                      = new GP_Locale();
			$kk->english_name        = 'Kazakh';
			$kk->native_name         = 'Қазақ тілі';
			$kk->lang_code_iso_639_1 = 'kk';
			$kk->lang_code_iso_639_2 = 'kaz';
			$kk->country_code        = 'kz';
			$kk->wp_locale           = 'kk';
			$kk->slug                = 'kk';
			$kk->google_code         = 'kk';
			$kk->facebook_locale     = 'kk_KZ';
			$kk->alphabet            = 'cyrillic';

			$km                      = new GP_Locale();
			$km->english_name        = 'Khmer';
			$km->native_name         = 'ភាសាខ្មែរ';
			$km->lang_code_iso_639_1 = 'km';
			$km->lang_code_iso_639_2 = 'khm';
			$km->country_code        = 'kh';
			$km->wp_locale           = 'km';
			$km->slug                = 'km';
			$km->nplurals            = 1;
			$km->plural_expression   = '0';
			$km->google_code         = 'km';
			$km->facebook_locale     = 'km_KH';
			$km->alphabet            = 'khmer';
			$km->word_count_type     = 'characters_excluding_spaces';

			$kmr                      = new GP_Locale();
			$kmr->english_name        = 'Kurdish (Kurmanji)';
			$kmr->native_name         = 'Kurdî';
			$kmr->lang_code_iso_639_1 = 'ku';
			$kmr->lang_code_iso_639_3 = 'kmr';
			$kmr->country_code        = 'tr';
			$kmr->wp_locale           = 'kmr';
			$kmr->slug                = 'kmr';
			$kmr->facebook_locale     = 'ku_TR';

			$kn                      = new GP_Locale();
			$kn->english_name        = 'Kannada';
			$kn->native_name         = 'ಕನ್ನಡ';
			$kn->lang_code_iso_639_1 = 'kn';
			$kn->lang_code_iso_639_2 = 'kan';
			$kn->country_code        = 'in';
			$kn->wp_locale           = 'kn';
			$kn->slug                = 'kn';
			$kn->google_code         = 'kn';
			$kn->facebook_locale     = 'kn_IN';
			$kn->alphabet            = 'kannada';

			$ko                      = new GP_Locale();
			$ko->english_name        = 'Korean';
			$ko->native_name         = '한국어';
			$ko->lang_code_iso_639_1 = 'ko';
			$ko->lang_code_iso_639_2 = 'kor';
			$ko->country_code        = 'kr';
			$ko->wp_locale           = 'ko_KR';
			$ko->slug                = 'ko';
			$ko->nplurals            = 1;
			$ko->plural_expression   = '0';
			$ko->google_code         = 'ko';
			$ko->facebook_locale     = 'ko_KR';
			$ko->alphabet            = 'hangul';

			$ks                      = new GP_Locale();
			$ks->english_name        = 'Kashmiri';
			$ks->native_name         = 'कश्मीरी';
			$ks->lang_code_iso_639_1 = 'ks';
			$ks->lang_code_iso_639_2 = 'kas';
			$ks->slug                = 'ks';
			$ks->alphabet            = 'devanagari';

			$kir                      = new GP_Locale();
			$kir->english_name        = 'Kyrgyz';
			$kir->native_name         = 'Кыргызча';
			$kir->lang_code_iso_639_1 = 'ky';
			$kir->lang_code_iso_639_2 = 'kir';
			$kir->lang_code_iso_639_3 = 'kir';
			$kir->country_code        = 'kg';
			$kir->wp_locale           = 'kir';
			$kir->slug                = 'kir';
			$kir->google_code         = 'ky';
			$kir->alphabet            = 'cyrillic';

			$la                      = new GP_Locale();
			$la->english_name        = 'Latin';
			$la->native_name         = 'Latine';
			$la->lang_code_iso_639_1 = 'la';
			$la->lang_code_iso_639_2 = 'lat';
			$la->slug                = 'la';
			$la->google_code         = 'la';
			$la->facebook_locale     = 'la_VA';

			$lb                      = new GP_Locale();
			$lb->english_name        = 'Luxembourgish';
			$lb->native_name         = 'Lëtzebuergesch';
			$lb->lang_code_iso_639_1 = 'lb';
			$lb->country_code        = 'lu';
			$lb->wp_locale           = 'lb_LU';
			$lb->slug                = 'lb';

			$li                      = new GP_Locale();
			$li->english_name        = 'Limburgish';
			$li->native_name         = 'Limburgs';
			$li->lang_code_iso_639_1 = 'li';
			$li->lang_code_iso_639_2 = 'lim';
			$li->lang_code_iso_639_3 = 'lim';
			$li->country_code        = 'nl';
			$li->wp_locale           = 'li';
			$li->slug                = 'li';
			$li->facebook_locale     = 'li_NL';

			$lij                      = new GP_Locale();
			$lij->english_name        = 'Ligurian';
			$lij->native_name         = 'Lìgure';
			$lij->lang_code_iso_639_3 = 'lij';
			$lij->country_code        = 'it';
			$lij->wp_locale           = 'lij';
			$lij->slug                = 'lij';

			$lin                      = new GP_Locale();
			$lin->english_name        = 'Lingala';
			$lin->native_name         = 'Ngala';
			$lin->lang_code_iso_639_1 = 'ln';
			$lin->lang_code_iso_639_2 = 'lin';
			$lin->country_code        = 'cd';
			$lin->wp_locale           = 'lin';
			$lin->slug                = 'lin';
			$lin->nplurals            = 2;
			$lin->plural_expression   = 'n > 1';
			$lin->facebook_locale     = 'ln_CD';

			$lmo                      = new GP_Locale();
			$lmo->english_name        = 'Lombard';
			$lmo->native_name         = 'Lombardo';
			$lmo->lang_code_iso_639_3 = 'lmo';
			$lmo->country_code        = 'it';
			$lmo->wp_locale           = 'lmo';
			$lmo->slug                = 'lmo';

			$lo                      = new GP_Locale();
			$lo->english_name        = 'Lao';
			$lo->native_name         = 'ພາສາລາວ';
			$lo->lang_code_iso_639_1 = 'lo';
			$lo->lang_code_iso_639_2 = 'lao';
			$lo->country_code        = 'la';
			$lo->wp_locale           = 'lo';
			$lo->slug                = 'lo';
			$lo->nplurals            = 1;
			$lo->plural_expression   = '0';
			$lo->google_code         = 'lo';
			$lo->facebook_locale     = 'lo_LA';
			$lo->alphabet            = 'lao';

			$lt                      = new GP_Locale();
			$lt->english_name        = 'Lithuanian';
			$lt->native_name         = 'Lietuvių kalba';
			$lt->lang_code_iso_639_1 = 'lt';
			$lt->lang_code_iso_639_2 = 'lit';
			$lt->country_code        = 'lt';
			$lt->wp_locale           = 'lt_LT';
			$lt->slug                = 'lt';
			$lt->nplurals            = 3;
			$lt->plural_expression   = '(n % 10 == 1 && (n % 100 < 11 || n % 100 > 19)) ? 0 : ((n % 10 >= 2 && n % 10 <= 9 && (n % 100 < 11 || n % 100 > 19)) ? 1 : 2)';
			$lt->google_code         = 'lt';
			$lt->facebook_locale     = 'lt_LT';

			$lug                      = new GP_Locale();
			$lug->english_name        = 'Luganda';
			$lug->native_name         = 'Oluganda';
			$lug->lang_code_iso_639_1 = 'lg';
			$lug->lang_code_iso_639_2 = 'lug';
			$lug->lang_code_iso_639_3 = 'lug';
			$lug->country_code        = 'ug';
			$lug->wp_locale           = 'lug';
			$lug->slug                = 'lug';

			$lv                      = new GP_Locale();
			$lv->english_name        = 'Latvian';
			$lv->native_name         = 'Latviešu valoda';
			$lv->lang_code_iso_639_1 = 'lv';
			$lv->lang_code_iso_639_2 = 'lav';
			$lv->country_code        = 'lv';
			$lv->wp_locale           = 'lv';
			$lv->slug                = 'lv';
			$lv->nplurals            = 3;
			$lv->plural_expression   = '(n % 10 == 0 || n % 100 >= 11 && n % 100 <= 19) ? 0 : ((n % 10 == 1 && n % 100 != 11) ? 1 : 2)';
			$lv->google_code         = 'lv';
			$lv->facebook_locale     = 'lv_LV';

			$mai                      = new GP_Locale();
			$mai->english_name        = 'Maithili';
			$mai->native_name         = 'मैथिली';
			$mai->lang_code_iso_639_2 = 'mai';
			$mai->lang_code_iso_639_3 = 'mai';
			$mai->country_code        = 'in';
			$mai->wp_locale           = 'mai';
			$mai->slug                = 'mai';
			$mai->alphabet            = 'devanagari';

			$me                    = new GP_Locale();
			$me->english_name      = 'Montenegrin';
			$me->native_name       = 'Crnogorski jezik';
			$me->country_code      = 'me';
			$me->wp_locale         = 'me_ME';
			$me->slug              = 'me';
			$me->nplurals          = 3;
			$me->plural_expression = '(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2)';

			$mfe                      = new GP_Locale();
			$mfe->english_name        = 'Mauritian Creole';
			$mfe->native_name         = 'Kreol Morisien';
			$mfe->lang_code_iso_639_3 = 'mfe';
			$mfe->country_code        = 'mu';
			$mfe->wp_locale           = 'mfe';
			$mfe->slug                = 'mfe';
			$mfe->nplurals            = 1;
			$mfe->plural_expression   = '0';

			$mg                      = new GP_Locale();
			$mg->english_name        = 'Malagasy';
			$mg->native_name         = 'Malagasy';
			$mg->lang_code_iso_639_1 = 'mg';
			$mg->lang_code_iso_639_2 = 'mlg';
			$mg->country_code        = 'mg';
			$mg->wp_locale           = 'mg_MG';
			$mg->slug                = 'mg';
			$mg->google_code         = 'mg';
			$mg->facebook_locale     = 'mg_MG';

			$mhr                      = new GP_Locale();
			$mhr->english_name        = 'Mari (Meadow)';
			$mhr->native_name         = 'Олык марий';
			$mhr->lang_code_iso_639_3 = 'mhr';
			$mhr->country_code        = 'ru';
			$mhr->slug                = 'mhr';
			$mhr->alphabet            = 'cyrillic';

			$mk                      = new GP_Locale();
			$mk->english_name        = 'Macedonian';
			$mk->native_name         = 'Македонски јазик';
			$mk->lang_code_iso_639_1 = 'mk';
			$mk->lang_code_iso_639_2 = 'mkd';
			$mk->country_code        = 'mk';
			$mk->wp_locale           = 'mk_MK';
			$mk->slug                = 'mk';
			$mk->nplurals            = 2;
			$mk->plural_expression   = 'n % 10 != 1 || n % 100 == 11';
			$mk->google_code         = 'mk';
			$mk->facebook_locale     = 'mk_MK';
			$mk->alphabet            = 'cyrillic';

			$ml                      = new GP_Locale();
			$ml->english_name        = 'Malayalam';
			$ml->native_name         = 'മലയാളം';
			$ml->lang_code_iso_639_1 = 'ml';
			$ml->lang_code_iso_639_2 = 'mal';
			$ml->country_code        = 'in';
			$ml->wp_locale           = 'ml_IN';
			$ml->slug                = 'ml';
			$ml->google_code         = 'ml';
			$ml->facebook_locale     = 'ml_IN';
			$ml->alphabet            = 'malayalam';

			$mlt                      = new GP_Locale();
			$mlt->english_name        = 'Maltese';
			$mlt->native_name         = 'Malti';
			$mlt->lang_code_iso_639_1 = 'mt';
			$mlt->lang_code_iso_639_2 = 'mlt';
			$mlt->lang_code_iso_639_3 = 'mlt';
			$mlt->country_code        = 'mt';
			$mlt->wp_locale           = 'mlt';
			$mlt->slug                = 'mlt';
			$mlt->nplurals            = 4;
			$mlt->plural_expression   = '(n == 1) ? 0 : ((n == 0 || n % 100 >= 2 && n % 100 <= 10) ? 1 : ((n % 100 >= 11 && n % 100 <= 19) ? 2 : 3))';
			$mlt->google_code         = 'mt';
			$mlt->facebook_locale     = 'mt_MT';

			$mn                      = new GP_Locale();
			$mn->english_name        = 'Mongolian';
			$mn->native_name         = 'Монгол';
			$mn->lang_code_iso_639_1 = 'mn';
			$mn->lang_code_iso_639_2 = 'mon';
			$mn->country_code        = 'mn';
			$mn->wp_locale           = 'mn';
			$mn->slug                = 'mn';
			$mn->google_code         = 'mn';
			$mn->facebook_locale     = 'mn_MN';
			$mn->alphabet            = 'cyrillic';

			$mr                      = new GP_Locale();
			$mr->english_name        = 'Marathi';
			$mr->native_name         = 'मराठी';
			$mr->lang_code_iso_639_1 = 'mr';
			$mr->lang_code_iso_639_2 = 'mar';
			$mr->wp_locale           = 'mr';
			$mr->slug                = 'mr';
			$mr->google_code         = 'mr';
			$mr->facebook_locale     = 'mr_IN';
			$mr->alphabet            = 'devanagari';

			$mri                      = new GP_Locale();
			$mri->english_name        = 'Maori';
			$mri->native_name         = 'Te Reo Māori';
			$mri->lang_code_iso_639_1 = 'mi';
			$mri->lang_code_iso_639_3 = 'mri';
			$mri->country_code        = 'nz';
			$mri->slug                = 'mri';
			$mri->wp_locale           = 'mri';
			$mri->nplurals            = 2;
			$mri->plural_expression   = 'n > 1';
			$mri->google_code         = 'mi';

			$mrj                      = new GP_Locale();
			$mrj->english_name        = 'Mari (Hill)';
			$mrj->native_name         = 'Кырык мары';
			$mrj->lang_code_iso_639_3 = 'mrj';
			$mrj->country_code        = 'ru';
			$mrj->slug                = 'mrj';
			$mrj->alphabet            = 'cyrillic';

			$ms                      = new GP_Locale();
			$ms->english_name        = 'Malay';
			$ms->native_name         = 'Bahasa Melayu';
			$ms->lang_code_iso_639_1 = 'ms';
			$ms->lang_code_iso_639_2 = 'msa';
			$ms->wp_locale           = 'ms_MY';
			$ms->slug                = 'ms';
			$ms->nplurals            = 1;
			$ms->plural_expression   = '0';
			$ms->google_code         = 'ms';
			$ms->facebook_locale     = 'ms_MY';

			$mwl                      = new GP_Locale();
			$mwl->english_name        = 'Mirandese';
			$mwl->native_name         = 'Mirandés';
			$mwl->lang_code_iso_639_2 = 'mwl';
			$mwl->slug                = 'mwl';

			$my                      = new GP_Locale();
			$my->english_name        = 'Myanmar (Burmese)';
			$my->native_name         = 'ဗမာစာ';
			$my->lang_code_iso_639_1 = 'my';
			$my->lang_code_iso_639_2 = 'mya';
			$my->country_code        = 'mm';
			$my->wp_locale           = 'my_MM';
			$my->slug                = 'mya';
			$my->google_code         = 'my';
			$my->alphabet            = 'burmese';

			$ne                      = new GP_Locale();
			$ne->english_name        = 'Nepali';
			$ne->native_name         = 'नेपाली';
			$ne->lang_code_iso_639_1 = 'ne';
			$ne->lang_code_iso_639_2 = 'nep';
			$ne->country_code        = 'np';
			$ne->wp_locale           = 'ne_NP';
			$ne->slug                = 'ne';
			$ne->google_code         = 'ne';
			$ne->facebook_locale     = 'ne_NP';
			$ne->alphabet            = 'devanagari';

			$nb                      = new GP_Locale();
			$nb->english_name        = 'Norwegian (Bokmål)';
			$nb->native_name         = 'Norsk bokmål';
			$nb->lang_code_iso_639_1 = 'nb';
			$nb->lang_code_iso_639_2 = 'nob';
			$nb->country_code        = 'no';
			$nb->wp_locale           = 'nb_NO';
			$nb->slug                = 'nb';
			$nb->google_code         = 'no';
			$nb->facebook_locale     = 'nb_NO';

			$nl                      = new GP_Locale();
			$nl->english_name        = 'Dutch';
			$nl->native_name         = 'Nederlands';
			$nl->lang_code_iso_639_1 = 'nl';
			$nl->lang_code_iso_639_2 = 'nld';
			$nl->country_code        = 'nl';
			$nl->wp_locale           = 'nl_NL';
			$nl->slug                = 'nl';
			$nl->google_code         = 'nl';
			$nl->facebook_locale     = 'nl_NL';

			$nl_be                      = new GP_Locale();
			$nl_be->english_name        = 'Dutch (Belgium)';
			$nl_be->native_name         = 'Nederlands (België)';
			$nl_be->lang_code_iso_639_1 = 'nl';
			$nl_be->lang_code_iso_639_2 = 'nld';
			$nl_be->country_code        = 'be';
			$nl_be->wp_locale           = 'nl_BE';
			$nl_be->slug                = 'nl-be';
			$nl_be->google_code         = 'nl';

			$no                      = new GP_Locale();
			$no->english_name        = 'Norwegian';
			$no->native_name         = 'Norsk';
			$no->lang_code_iso_639_1 = 'no';
			$no->lang_code_iso_639_2 = 'nor';
			$no->country_code        = 'no';
			$no->slug                = 'no';
			$no->google_code         = 'no';

			$nn                      = new GP_Locale();
			$nn->english_name        = 'Norwegian (Nynorsk)';
			$nn->native_name         = 'Norsk nynorsk';
			$nn->lang_code_iso_639_1 = 'nn';
			$nn->lang_code_iso_639_2 = 'nno';
			$nn->country_code        = 'no';
			$nn->wp_locale           = 'nn_NO';
			$nn->slug                = 'nn';
			$nn->google_code         = 'no';
			$nn->facebook_locale     = 'nn_NO';

			$nqo                      = new GP_Locale();
			$nqo->english_name        = 'N’ko';
			$nqo->native_name         = 'ߒߞߏ';
			$nqo->lang_code_iso_639_2 = 'nqo';
			$nqo->lang_code_iso_639_3 = 'nqo';
			$nqo->country_code        = 'gn';
			$nqo->wp_locale           = 'nqo';
			$nqo->slug                = 'nqo';
			$nqo->text_direction      = 'rtl';
			$nqo->alphabet            = 'nko';

			$nso                      = new GP_Locale();
			$nso->english_name        = 'Northern Sotho';
			$nso->native_name         = 'Sesotho sa Leboa';
			$nso->lang_code_iso_639_2 = 'nso';
			$nso->lang_code_iso_639_3 = 'nso';
			$nso->country_code        = 'za';
			$nso->slug                = 'nso';

			$oci                      = new GP_Locale();
			$oci->english_name        = 'Occitan';
			$oci->native_name         = 'Occitan';
			$oci->lang_code_iso_639_1 = 'oc';
			$oci->lang_code_iso_639_2 = 'oci';
			$oci->country_code        = 'fr';
			$oci->wp_locale           = 'oci';
			$oci->slug                = 'oci';
			$oci->nplurals            = 2;
			$oci->plural_expression   = 'n > 1';

			$orm                      = new GP_Locale();
			$orm->english_name        = 'Oromo';
			$orm->native_name         = 'Afaan Oromo';
			$orm->lang_code_iso_639_1 = 'om';
			$orm->lang_code_iso_639_2 = 'orm';
			$orm->lang_code_iso_639_3 = 'orm';
			$orm->slug                = 'orm';
			$orm->plural_expression   = 'n > 1';

			$ory                      = new GP_Locale();
			$ory->english_name        = 'Oriya';
			$ory->native_name         = 'ଓଡ଼ିଆ';
			$ory->lang_code_iso_639_1 = 'or';
			$ory->lang_code_iso_639_2 = 'ory';
			$ory->country_code        = 'in';
			$ory->wp_locale           = 'ory';
			$ory->slug                = 'ory';
			$ory->facebook_locale     = 'or_IN';
			$ory->alphabet            = 'odia';

			$os                      = new GP_Locale();
			$os->english_name        = 'Ossetic';
			$os->native_name         = 'Ирон';
			$os->lang_code_iso_639_1 = 'os';
			$os->lang_code_iso_639_2 = 'oss';
			$os->wp_locale           = 'os';
			$os->slug                = 'os';
			$os->alphabet            = 'cyrillic';

			$pa                      = new GP_Locale();
			$pa->english_name        = 'Panjabi (India)';
			$pa->native_name         = 'ਪੰਜਾਬੀ';
			$pa->lang_code_iso_639_1 = 'pa';
			$pa->lang_code_iso_639_2 = 'pan';
			$pa->country_code        = 'in';
			$pa->wp_locale           = 'pa_IN';
			$pa->slug                = 'pa';
			$pa->google_code         = 'pa';
			$pa->nplurals            = 2;
			$pa->plural_expression   = 'n > 1';
			$pa->facebook_locale     = 'pa_IN';
			$pa->alphabet            = 'gurmukhi';

			$pa_pk                       = new GP_Locale();
			$pa_pk->english_name         = 'Punjabi (Pakistan)';
			$pa_pk->native_name          = 'پنجابی';
			$pa_pk->lang_code_iso_639_1  = 'pa';
			$pa_pk->lang_code_iso_639_2  = 'pan';
			$pa_pk->country_code         = 'pk';
			$pa_pk->wp_locale            = 'pa_PK';
			$pa_pk->slug                 = 'pa-pk';
			$pa_pk->nplurals             = 2;
			$pa_pk->plural_expression    = 'n > 1';
			$pa_pk->google_code          = 'pa';
			$pa_pk->alphabet             = 'shahmukhi';

			$pap_cw                      = new GP_Locale();
			$pap_cw->english_name        = 'Papiamento (Curaçao and Bonaire)';
			$pap_cw->native_name         = 'Papiamentu';
			$pap_cw->lang_code_iso_639_2 = 'pap';
			$pap_cw->lang_code_iso_639_3 = 'pap';
			$pap_cw->country_code        = 'cw';
			$pap_cw->wp_locale           = 'pap_CW';
			$pap_cw->slug                = 'pap-cw';

			$pap_aw                      = new GP_Locale();
			$pap_aw->english_name        = 'Papiamento (Aruba)';
			$pap_aw->native_name         = 'Papiamento';
			$pap_aw->lang_code_iso_639_2 = 'pap';
			$pap_aw->lang_code_iso_639_3 = 'pap';
			$pap_aw->country_code        = 'aw';
			$pap_aw->wp_locale           = 'pap_AW';
			$pap_aw->slug                = 'pap-aw';

			$pcd                      = new GP_Locale();
			$pcd->english_name        = 'Picard';
			$pcd->native_name         = 'Ch’ti';
			$pcd->lang_code_iso_639_3 = 'pcd';
			$pcd->country_code        = 'fr';
			$pcd->wp_locale           = 'pcd';
			$pcd->slug                = 'pcd';
			$pcd->nplurals            = 2;
			$pcd->plural_expression   = 'n > 1';

			$pcm                      = new GP_Locale();
			$pcm->english_name        = 'Nigerian Pidgin';
			$pcm->native_name         = 'Nigerian Pidgin';
			$pcm->lang_code_iso_639_3 = 'pcm';
			$pcm->country_code        = 'ng';
			$pcm->wp_locale           = 'pcm';
			$pcm->slug                = 'pcm';

			$pirate                      = new GP_Locale();
			$pirate->english_name        = 'English (Pirate)';
			$pirate->native_name         = 'English (Pirate)';
			$pirate->lang_code_iso_639_2 = 'art';
			$pirate->wp_locale           = 'art_xpirate';
			$pirate->slug                = 'pirate';
			$pirate->google_code         = 'xx-pirate';
			$pirate->facebook_locale     = 'en_PI';

			$pl                      = new GP_Locale();
			$pl->english_name        = 'Polish';
			$pl->native_name         = 'Polski';
			$pl->lang_code_iso_639_1 = 'pl';
			$pl->lang_code_iso_639_2 = 'pol';
			$pl->country_code        = 'pl';
			$pl->wp_locale           = 'pl_PL';
			$pl->slug                = 'pl';
			$pl->nplurals            = 3;
			$pl->plural_expression   = '(n == 1) ? 0 : ((n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? 1 : 2)';
			$pl->google_code         = 'pl';
			$pl->facebook_locale     = 'pl_PL';

			$pt                      = new GP_Locale();
			$pt->english_name        = 'Portuguese (Portugal)';
			$pt->native_name         = 'Português';
			$pt->lang_code_iso_639_1 = 'pt';
			$pt->country_code        = 'pt';
			$pt->wp_locale           = 'pt_PT';
			$pt->slug                = 'pt';
			$pt->google_code         = 'pt-PT';
			$pt->facebook_locale     = 'pt_PT';

			$pt_ao90                      = new GP_Locale();
			$pt_ao90->english_name        = 'Portuguese (Portugal, AO90)';
			$pt_ao90->native_name         = 'Português (AO90)';
			$pt_ao90->lang_code_iso_639_1 = 'pt';
			$pt_ao90->country_code        = 'pt';
			$pt_ao90->wp_locale           = 'pt_PT_ao90';
			$pt_ao90->slug                = 'pt-ao90';
			$pt_ao90->google_code         = 'pt-PT';

			$pt_ao                      = new GP_Locale();
			$pt_ao->english_name        = 'Portuguese (Angola)';
			$pt_ao->native_name         = 'Português de Angola';
			$pt_ao->lang_code_iso_639_1 = 'pt';
			$pt_ao->country_code        = 'ao';
			$pt_ao->wp_locale           = 'pt_AO';
			$pt_ao->slug                = 'pt-ao';

			$pt_br                      = new GP_Locale();
			$pt_br->english_name        = 'Portuguese (Brazil)';
			$pt_br->native_name         = 'Português do Brasil';
			$pt_br->lang_code_iso_639_1 = 'pt';
			$pt_br->lang_code_iso_639_2 = 'por';
			$pt_br->country_code        = 'br';
			$pt_br->wp_locale           = 'pt_BR';
			$pt_br->slug                = 'pt-br';
			$pt_br->nplurals            = 2;
			$pt_br->plural_expression   = 'n > 1';
			$pt_br->google_code         = 'pt-BR';
			$pt_br->facebook_locale     = 'pt_BR';

			$ps                      = new GP_Locale();
			$ps->english_name        = 'Pashto';
			$ps->native_name         = 'پښتو';
			$ps->lang_code_iso_639_1 = 'ps';
			$ps->lang_code_iso_639_2 = 'pus';
			$ps->country_code        = 'af';
			$ps->wp_locale           = 'ps';
			$ps->slug                = 'ps';
			$ps->text_direction      = 'rtl';
			$ps->facebook_locale     = 'ps_AF';
			$ps->alphabet            = 'pashto';

			$rhg                      = new GP_Locale();
			$rhg->english_name        = 'Rohingya';
			$rhg->native_name         = 'Ruáinga';
			$rhg->lang_code_iso_639_3 = 'rhg';
			$rhg->country_code        = 'mm';
			$rhg->wp_locale           = 'rhg';
			$rhg->slug                = 'rhg';
			$rhg->nplurals            = 1;
			$rhg->plural_expression   = '0';

			$rif                      = new GP_Locale();
			$rif->english_name        = 'Tarifit';
			$rif->native_name         = 'Tarifiyt';
			$rif->lang_code_iso_639_3 = 'rif';
			$rif->country_code        = 'ma';
			$rif->slug                = 'rif';

			$ro                      = new GP_Locale();
			$ro->english_name        = 'Romanian';
			$ro->native_name         = 'Română';
			$ro->lang_code_iso_639_1 = 'ro';
			$ro->lang_code_iso_639_2 = 'ron';
			$ro->country_code        = 'ro';
			$ro->wp_locale           = 'ro_RO';
			$ro->slug                = 'ro';
			$ro->nplurals            = 3;
			$ro->plural_expression   = '(n == 1) ? 0 : ((n == 0 || n % 100 >= 2 && n % 100 <= 19) ? 1 : 2)';
			$ro->google_code         = 'ro';
			$ro->facebook_locale     = 'ro_RO';

			$roh                      = new GP_Locale();
			$roh->english_name        = 'Romansh';
			$roh->native_name         = 'Rumantsch';
			$roh->lang_code_iso_639_1 = 'rm';
			$roh->lang_code_iso_639_2 = 'roh';
			$roh->lang_code_iso_639_3 = 'roh';
			$roh->country_code        = 'ch';
			$roh->wp_locale           = 'roh';
			$roh->slug                = 'roh';

			$ru                      = new GP_Locale();
			$ru->english_name        = 'Russian';
			$ru->native_name         = 'Русский';
			$ru->lang_code_iso_639_1 = 'ru';
			$ru->lang_code_iso_639_2 = 'rus';
			$ru->country_code        = 'ru';
			$ru->wp_locale           = 'ru_RU';
			$ru->slug                = 'ru';
			$ru->nplurals            = 3;
			$ru->plural_expression   = '(n % 10 == 1 && n % 100 != 11) ? 0 : ((n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? 1 : 2)';
			$ru->google_code         = 'ru';
			$ru->facebook_locale     = 'ru_RU';
			$ru->alphabet            = 'cyrillic';

			$rue                      = new GP_Locale();
			$rue->english_name        = 'Rusyn';
			$rue->native_name         = 'Русиньскый';
			$rue->lang_code_iso_639_3 = 'rue';
			$rue->slug                = 'rue';
			$rue->nplurals            = 3;
			$rue->plural_expression   = '(n % 10 == 1 && n % 100 != 11) ? 0 : ((n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? 1 : 2)';
			$rue->alphabet            = 'cyrillic';

			$rup                      = new GP_Locale();
			$rup->english_name        = 'Aromanian';
			$rup->native_name         = 'Armãneashce';
			$rup->lang_code_iso_639_2 = 'rup';
			$rup->lang_code_iso_639_3 = 'rup';
			$rup->country_code        = 'mk';
			$rup->slug                = 'rup';

			$sah                      = new GP_Locale();
			$sah->english_name        = 'Sakha';
			$sah->native_name         = 'Сахалыы';
			$sah->lang_code_iso_639_2 = 'sah';
			$sah->lang_code_iso_639_3 = 'sah';
			$sah->country_code        = 'ru';
			$sah->wp_locale           = 'sah';
			$sah->slug                = 'sah';
			$sah->alphabet            = 'cyrillic';

			$sa_in                      = new GP_Locale();
			$sa_in->english_name        = 'Sanskrit';
			$sa_in->native_name         = 'भारतम्';
			$sa_in->lang_code_iso_639_1 = 'sa';
			$sa_in->lang_code_iso_639_2 = 'san';
			$sa_in->lang_code_iso_639_3 = 'san';
			$sa_in->country_code        = 'in';
			$sa_in->wp_locale           = 'sa_IN';
			$sa_in->slug                = 'sa-in';
			$sa_in->facebook_locale     = 'sa_IN';
			$sa_in->alphabet            = 'brahmic';

			$scn                      = new GP_Locale();
			$scn->english_name        = 'Sicilian';
			$scn->native_name         = 'Sicilianu';
			$scn->lang_code_iso_639_3 = 'scn';
			$scn->country_code        = 'it';
			$scn->wp_locale           = 'scn';
			$scn->slug                = 'scn';

			$si                      = new GP_Locale();
			$si->english_name        = 'Sinhala';
			$si->native_name         = 'සිංහල';
			$si->lang_code_iso_639_1 = 'si';
			$si->lang_code_iso_639_2 = 'sin';
			$si->country_code        = 'lk';
			$si->wp_locale           = 'si_LK';
			$si->slug                = 'si';
			$si->google_code         = 'si';
			$si->facebook_locale     = 'si_LK';
			$si->alphabet            = 'sinhala';

			$sk                      = new GP_Locale();
			$sk->english_name        = 'Slovak';
			$sk->native_name         = 'Slovenčina';
			$sk->lang_code_iso_639_1 = 'sk';
			$sk->lang_code_iso_639_2 = 'slk';
			$sk->country_code        = 'sk';
			$sk->slug                = 'sk';
			$sk->wp_locale           = 'sk_SK';
			$sk->nplurals            = 3;
			$sk->plural_expression   = '(n == 1) ? 0 : ((n >= 2 && n <= 4) ? 1 : 2)';
			$sk->google_code         = 'sk';
			$sk->facebook_locale     = 'sk_SK';

			$skr                      = new GP_Locale();
			$skr->english_name        = 'Saraiki';
			$skr->native_name         = 'سرائیکی';
			$skr->lang_code_iso_639_3 = 'skr';
			$skr->country_code        = 'pk';
			$skr->wp_locale           = 'skr';
			$skr->slug                = 'skr';
			$skr->text_direction      = 'rtl';
			$skr->alphabet            = 'saraiki';

			$sl                      = new GP_Locale();
			$sl->english_name        = 'Slovenian';
			$sl->native_name         = 'Slovenščina';
			$sl->lang_code_iso_639_1 = 'sl';
			$sl->lang_code_iso_639_2 = 'slv';
			$sl->country_code        = 'si';
			$sl->wp_locale           = 'sl_SI';
			$sl->slug                = 'sl';
			$sl->nplurals            = 4;
			$sl->plural_expression   = '(n % 100 == 1) ? 0 : ((n % 100 == 2) ? 1 : ((n % 100 == 3 || n % 100 == 4) ? 2 : 3))';
			$sl->google_code         = 'sl';
			$sl->facebook_locale     = 'sl_SI';

			$sna                      = new GP_Locale();
			$sna->english_name        = 'Shona';
			$sna->native_name         = 'ChiShona';
			$sna->lang_code_iso_639_1 = 'sn';
			$sna->lang_code_iso_639_3 = 'sna';
			$sna->country_code        = 'zw';
			$sna->wp_locale           = 'sna';
			$sna->slug                = 'sna';

			$snd                      = new GP_Locale();
			$snd->english_name        = 'Sindhi';
			$snd->native_name         = 'سنڌي';
			$snd->lang_code_iso_639_1 = 'sd';
			$snd->lang_code_iso_639_2 = 'snd';
			$snd->lang_code_iso_639_3 = 'snd';
			$snd->country_code        = 'pk';
			$snd->wp_locale           = 'snd';
			$snd->slug                = 'snd';
			$snd->text_direction      = 'rtl';
			$snd->alphabet            = 'arabic';

			$so                      = new GP_Locale();
			$so->english_name        = 'Somali';
			$so->native_name         = 'Afsoomaali';
			$so->lang_code_iso_639_1 = 'so';
			$so->lang_code_iso_639_2 = 'som';
			$so->lang_code_iso_639_3 = 'som';
			$so->country_code        = 'so';
			$so->wp_locale           = 'so_SO';
			$so->slug                = 'so';
			$so->google_code         = 'so';
			$so->facebook_locale     = 'so_SO';

			$sq                      = new GP_Locale();
			$sq->english_name        = 'Albanian';
			$sq->native_name         = 'Shqip';
			$sq->lang_code_iso_639_1 = 'sq';
			$sq->lang_code_iso_639_2 = 'sqi';
			$sq->wp_locale           = 'sq';
			$sq->country_code        = 'al';
			$sq->slug                = 'sq';
			$sq->google_code         = 'sq';
			$sq->facebook_locale     = 'sq_AL';

			$sq_xk                      = new GP_Locale();
			$sq_xk->english_name        = 'Shqip (Kosovo)';
			$sq_xk->native_name         = 'Për Kosovën Shqip';
			$sq_xk->lang_code_iso_639_1 = 'sq';
			$sq_xk->country_code        = 'xk'; // Temporary country code until Kosovo is assigned an ISO code.
			$sq_xk->wp_locale           = 'sq_XK';
			$sq_xk->slug                = 'sq-xk';

			$sr                      = new GP_Locale();
			$sr->english_name        = 'Serbian';
			$sr->native_name         = 'Српски језик';
			$sr->lang_code_iso_639_1 = 'sr';
			$sr->lang_code_iso_639_2 = 'srp';
			$sr->country_code        = 'rs';
			$sr->wp_locale           = 'sr_RS';
			$sr->slug                = 'sr';
			$sr->nplurals            = 3;
			$sr->plural_expression   = '(n % 10 == 1 && n % 100 != 11) ? 0 : ((n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? 1 : 2)';
			$sr->google_code         = 'sr';
			$sr->facebook_locale     = 'sr_RS';
			$sr->alphabet            = 'cyrillic';

			$srd                      = new GP_Locale();
			$srd->english_name        = 'Sardinian';
			$srd->native_name         = 'Sardu';
			$srd->lang_code_iso_639_1 = 'sc';
			$srd->lang_code_iso_639_2 = 'srd';
			$srd->country_code        = 'it';
			$srd->wp_locale           = 'srd';
			$srd->slug                = 'srd';
			$srd->facebook_locale     = 'sc_IT';

			$ssw                      = new GP_Locale();
			$ssw->english_name        = 'Swati';
			$ssw->native_name         = 'SiSwati';
			$ssw->lang_code_iso_639_1 = 'ss';
			$ssw->lang_code_iso_639_2 = 'ssw';
			$ssw->lang_code_iso_639_3 = 'ssw';
			$ssw->country_code        = 'sz';
			$ssw->wp_locale           = 'ssw';
			$ssw->slug                = 'ssw';

			$su                      = new GP_Locale();
			$su->english_name        = 'Sundanese';
			$su->native_name         = 'Basa Sunda';
			$su->lang_code_iso_639_1 = 'su';
			$su->lang_code_iso_639_2 = 'sun';
			$su->country_code        = 'id';
			$su->wp_locale           = 'su_ID';
			$su->slug                = 'su';
			$su->nplurals            = 1;
			$su->plural_expression   = '0';
			$su->google_code         = 'su';

			$sv                      = new GP_Locale();
			$sv->english_name        = 'Swedish';
			$sv->native_name         = 'Svenska';
			$sv->lang_code_iso_639_1 = 'sv';
			$sv->lang_code_iso_639_2 = 'swe';
			$sv->country_code        = 'se';
			$sv->wp_locale           = 'sv_SE';
			$sv->slug                = 'sv';
			$sv->google_code         = 'sv';
			$sv->facebook_locale     = 'sv_SE';

			$sw                      = new GP_Locale();
			$sw->english_name        = 'Swahili';
			$sw->native_name         = 'Kiswahili';
			$sw->lang_code_iso_639_1 = 'sw';
			$sw->lang_code_iso_639_2 = 'swa';
			$sw->wp_locale           = 'sw';
			$sw->slug                = 'sw';
			$sw->google_code         = 'sw';
			$sw->facebook_locale     = 'sw_KE';

			$syr                      = new GP_Locale();
			$syr->english_name        = 'Syriac';
			$syr->native_name         = 'Syriac';
			$syr->lang_code_iso_639_3 = 'syr';
			$syr->country_code        = 'iq';
			$syr->wp_locale           = 'syr';
			$syr->slug                = 'syr';
			$syr->alphabet            = 'syriac';

			$szl                      = new GP_Locale();
			$szl->english_name        = 'Silesian';
			$szl->native_name         = 'Ślōnskŏ gŏdka';
			$szl->lang_code_iso_639_3 = 'szl';
			$szl->country_code        = 'pl';
			$szl->wp_locale           = 'szl';
			$szl->slug                = 'szl';
			$szl->nplurals            = 3;
			$szl->plural_expression   = '(n==1 ? 0 : n%10>=2 && n%10<=4 && n%100==20 ? 1 : 2)';
			$szl->facebook_locale     = 'sz_PL';

			$ta                      = new GP_Locale();
			$ta->english_name        = 'Tamil';
			$ta->native_name         = 'தமிழ்';
			$ta->lang_code_iso_639_1 = 'ta';
			$ta->lang_code_iso_639_2 = 'tam';
			$ta->country_code        = 'in';
			$ta->wp_locale           = 'ta_IN';
			$ta->slug                = 'ta';
			$ta->google_code         = 'ta';
			$ta->facebook_locale     = 'ta_IN';
			$ta->alphabet            = 'tamil';

			$ta_lk                      = new GP_Locale();
			$ta_lk->english_name        = 'Tamil (Sri Lanka)';
			$ta_lk->native_name         = 'தமிழ்';
			$ta_lk->lang_code_iso_639_1 = 'ta';
			$ta_lk->lang_code_iso_639_2 = 'tam';
			$ta_lk->country_code        = 'lk';
			$ta_lk->wp_locale           = 'ta_LK';
			$ta_lk->slug                = 'ta-lk';
			$ta_lk->google_code         = 'ta';
			$ta_lk->alphabet            = 'tamil';

			$tah                      = new GP_Locale();
			$tah->english_name        = 'Tahitian';
			$tah->native_name         = 'Reo Tahiti';
			$tah->lang_code_iso_639_1 = 'ty';
			$tah->lang_code_iso_639_2 = 'tah';
			$tah->lang_code_iso_639_3 = 'tah';
			$tah->country_code        = 'pf';
			$tah->wp_locale           = 'tah';
			$tah->slug                = 'tah';
			$tah->nplurals            = 2;
			$tah->plural_expression   = 'n > 1';

			$te                      = new GP_Locale();
			$te->english_name        = 'Telugu';
			$te->native_name         = 'తెలుగు';
			$te->lang_code_iso_639_1 = 'te';
			$te->lang_code_iso_639_2 = 'tel';
			$te->wp_locale           = 'te';
			$te->slug                = 'te';
			$te->google_code         = 'te';
			$te->facebook_locale     = 'te_IN';
			$te->alphabet            = 'telugu';

			$tg                      = new GP_Locale();
			$tg->english_name        = 'Tajik';
			$tg->native_name         = 'Тоҷикӣ';
			$tg->lang_code_iso_639_1 = 'tg';
			$tg->lang_code_iso_639_2 = 'tgk';
			$tg->country_code        = 'tj';
			$tg->wp_locale           = 'tg';
			$tg->slug                = 'tg';
			$tg->google_code         = 'tg';
			$tg->facebook_locale     = 'tg_TJ';
			$tg->alphabet            = 'cyrillic';

			$th                      = new GP_Locale();
			$th->english_name        = 'Thai';
			$th->native_name         = 'ไทย';
			$th->lang_code_iso_639_1 = 'th';
			$th->lang_code_iso_639_2 = 'tha';
			$th->wp_locale           = 'th';
			$th->slug                = 'th';
			$th->nplurals            = 1;
			$th->plural_expression   = '0';
			$th->google_code         = 'th';
			$th->facebook_locale     = 'th_TH';
			$th->alphabet            = 'thai';
			$th->word_count_type     = 'characters_excluding_spaces';

			$tir                      = new GP_Locale();
			$tir->english_name        = 'Tigrinya';
			$tir->native_name         = 'ትግርኛ';
			$tir->lang_code_iso_639_1 = 'ti';
			$tir->lang_code_iso_639_2 = 'tir';
			$tir->country_code        = 'er';
			$tir->wp_locale           = 'tir';
			$tir->slug                = 'tir';
			$tir->nplurals            = 1;
			$tir->plural_expression   = '0';
			$tir->alphabet            = 'geez';

			$tlh                      = new GP_Locale();
			$tlh->english_name        = 'Klingon';
			$tlh->native_name         = 'TlhIngan';
			$tlh->lang_code_iso_639_2 = 'tlh';
			$tlh->slug                = 'tlh';
			$tlh->nplurals            = 1;
			$tlh->plural_expression   = '0';
			$tlh->facebook_locale     = 'tl_ST';

			$tl                      = new GP_Locale();
			$tl->english_name        = 'Tagalog';
			$tl->native_name         = 'Tagalog';
			$tl->lang_code_iso_639_1 = 'tl';
			$tl->lang_code_iso_639_2 = 'tgl';
			$tl->country_code        = 'ph';
			$tl->wp_locale           = 'tl';
			$tl->slug                = 'tl';
			$tl->google_code         = 'tl';
			$tl->facebook_locale     = 'tl_PH';

			$tr                      = new GP_Locale();
			$tr->english_name        = 'Turkish';
			$tr->native_name         = 'Türkçe';
			$tr->lang_code_iso_639_1 = 'tr';
			$tr->lang_code_iso_639_2 = 'tur';
			$tr->country_code        = 'tr';
			$tr->wp_locale           = 'tr_TR';
			$tr->slug                = 'tr';
			$tr->nplurals            = 2;
			$tr->plural_expression   = 'n > 1';
			$tr->google_code         = 'tr';
			$tr->facebook_locale     = 'tr_TR';

			$tt_ru                      = new GP_Locale();
			$tt_ru->english_name        = 'Tatar';
			$tt_ru->native_name         = 'Татар теле';
			$tt_ru->lang_code_iso_639_1 = 'tt';
			$tt_ru->lang_code_iso_639_2 = 'tat';
			$tt_ru->country_code        = 'ru';
			$tt_ru->wp_locale           = 'tt_RU';
			$tt_ru->slug                = 'tt';
			$tt_ru->nplurals            = 1;
			$tt_ru->plural_expression   = '0';
			$tt_ru->facebook_locale     = 'tt_RU';
			$tt_ru->alphabet            = 'cyrillic';

			$tuk                      = new GP_Locale();
			$tuk->english_name        = 'Turkmen';
			$tuk->native_name         = 'Türkmençe';
			$tuk->lang_code_iso_639_1 = 'tk';
			$tuk->lang_code_iso_639_2 = 'tuk';
			$tuk->country_code        = 'tm';
			$tuk->wp_locale           = 'tuk';
			$tuk->slug                = 'tuk';
			$tuk->nplurals            = 2;
			$tuk->plural_expression   = 'n > 1';
			$tuk->facebook_locale     = 'tk_TM';

			$twd                      = new GP_Locale();
			$twd->english_name        = 'Tweants';
			$twd->native_name         = 'Twents';
			$twd->lang_code_iso_639_3 = 'twd';
			$twd->country_code        = 'nl';
			$twd->wp_locale           = 'twd';
			$twd->slug                = 'twd';

			$tzm                      = new GP_Locale();
			$tzm->english_name        = 'Tamazight (Central Atlas)';
			$tzm->native_name         = 'ⵜⴰⵎⴰⵣⵉⵖⵜ';
			$tzm->lang_code_iso_639_2 = 'tzm';
			$tzm->country_code        = 'ma';
			$tzm->wp_locale           = 'tzm';
			$tzm->slug                = 'tzm';
			$tzm->nplurals            = 2;
			$tzm->plural_expression   = 'n > 1';
			$tzm->alphabet            = 'tifinagh';

			$udm                      = new GP_Locale();
			$udm->english_name        = 'Udmurt';
			$udm->native_name         = 'Удмурт кыл';
			$udm->lang_code_iso_639_2 = 'udm';
			$udm->slug                = 'udm';
			$udm->alphabet            = 'cyrillic';

			$ug                      = new GP_Locale();
			$ug->english_name        = 'Uighur';
			$ug->native_name         = 'ئۇيغۇرچە';
			$ug->lang_code_iso_639_1 = 'ug';
			$ug->lang_code_iso_639_2 = 'uig';
			$ug->country_code        = 'cn';
			$ug->wp_locale           = 'ug_CN';
			$ug->slug                = 'ug';
			$ug->text_direction      = 'rtl';
			$ug->alphabet            = 'uyghur';

			$uk                      = new GP_Locale();
			$uk->english_name        = 'Ukrainian';
			$uk->native_name         = 'Українська';
			$uk->lang_code_iso_639_1 = 'uk';
			$uk->lang_code_iso_639_2 = 'ukr';
			$uk->country_code        = 'ua';
			$uk->wp_locale           = 'uk';
			$uk->slug                = 'uk';
			$uk->nplurals            = 3;
			$uk->plural_expression   = '(n % 10 == 1 && n % 100 != 11) ? 0 : ((n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? 1 : 2)';
			$uk->google_code         = 'uk';
			$uk->facebook_locale     = 'uk_UA';
			$uk->alphabet            = 'cyrillic';

			$ur                      = new GP_Locale();
			$ur->english_name        = 'Urdu';
			$ur->native_name         = 'اردو';
			$ur->lang_code_iso_639_1 = 'ur';
			$ur->lang_code_iso_639_2 = 'urd';
			$ur->country_code        = 'pk';
			$ur->wp_locale           = 'ur';
			$ur->slug                = 'ur';
			$ur->text_direction      = 'rtl';
			$ur->google_code         = 'ur';
			$ur->facebook_locale     = 'ur_PK';
			$ur->alphabet            = 'persian';

			$uz                      = new GP_Locale();
			$uz->english_name        = 'Uzbek';
			$uz->native_name         = 'O‘zbekcha';
			$uz->lang_code_iso_639_1 = 'uz';
			$uz->lang_code_iso_639_2 = 'uzb';
			$uz->country_code        = 'uz';
			$uz->wp_locale           = 'uz_UZ';
			$uz->slug                = 'uz';
			$uz->nplurals            = 1;
			$uz->plural_expression   = '0';
			$uz->google_code         = 'uz';
			$uz->facebook_locale     = 'uz_UZ';

			$vec                      = new GP_Locale();
			$vec->english_name        = 'Venetian';
			$vec->native_name         = 'Vèneto';
			$vec->lang_code_iso_639_2 = 'roa';
			$vec->lang_code_iso_639_3 = 'vec';
			$vec->country_code        = 'it';
			$vec->slug                = 'vec';
			$vec->wp_locale           = 'vec';

			$vi                      = new GP_Locale();
			$vi->english_name        = 'Vietnamese';
			$vi->native_name         = 'Tiếng Việt';
			$vi->lang_code_iso_639_1 = 'vi';
			$vi->lang_code_iso_639_2 = 'vie';
			$vi->country_code        = 'vn';
			$vi->wp_locale           = 'vi';
			$vi->slug                = 'vi';
			$vi->nplurals            = 1;
			$vi->plural_expression   = '0';
			$vi->google_code         = 'vi';
			$vi->facebook_locale     = 'vi_VN';

			$wa                      = new GP_Locale();
			$wa->english_name        = 'Walloon';
			$wa->native_name         = 'Walon';
			$wa->lang_code_iso_639_1 = 'wa';
			$wa->lang_code_iso_639_2 = 'wln';
			$wa->country_code        = 'be';
			$wa->slug                = 'wa';

			$wol                      = new GP_Locale();
			$wol->english_name        = 'Wolof';
			$wol->native_name         = 'Wolof';
			$wol->lang_code_iso_639_1 = 'wo';
			$wol->lang_code_iso_639_2 = 'wol';
			$wol->lang_code_iso_639_3 = 'wol';
			$wol->country_code        = 'sn';
			$wol->wp_locale           = 'wol';
			$wol->slug                = 'wol';
			$wol->nplurals            = 1;
			$wol->plural_expression   = '0';

			$xho                      = new GP_Locale();
			$xho->english_name        = 'Xhosa';
			$xho->native_name         = 'isiXhosa';
			$xho->lang_code_iso_639_1 = 'xh';
			$xho->lang_code_iso_639_2 = 'xho';
			$xho->lang_code_iso_639_3 = 'xho';
			$xho->country_code        = 'za';
			$xho->wp_locale           = 'xho';
			$xho->slug                = 'xho';
			$xho->google_code         = 'xh';
			$xho->facebook_locale     = 'xh_ZA';

			$xmf                      = new GP_Locale();
			$xmf->english_name        = 'Mingrelian';
			$xmf->native_name         = 'მარგალური ნინა';
			$xmf->lang_code_iso_639_3 = 'xmf';
			$xmf->country_code        = 'ge';
			$xmf->slug                = 'xmf';
			$xmf->alphabet            = 'georgian';

			$yi                      = new GP_Locale();
			$yi->english_name        = 'Yiddish';
			$yi->native_name         = 'ייִדיש';
			$yi->lang_code_iso_639_1 = 'yi';
			$yi->lang_code_iso_639_2 = 'yid';
			$yi->slug                = 'yi';
			$yi->text_direction      = 'rtl';
			$yi->google_code         = 'yi';
			$yi->alphabet            = 'hebrew';

			$yor                      = new GP_Locale();
			$yor->english_name        = 'Yoruba';
			$yor->native_name         = 'Yorùbá';
			$yor->lang_code_iso_639_1 = 'yo';
			$yor->lang_code_iso_639_2 = 'yor';
			$yor->lang_code_iso_639_3 = 'yor';
			$yor->country_code        = 'ng';
			$yor->wp_locale           = 'yor';
			$yor->slug                = 'yor';
			$yor->google_code         = 'yo';
			$yor->facebook_locale     = 'yo_NG';

			$zgh                      = new GP_Locale();
			$zgh->english_name        = 'Tamazight';
			$zgh->native_name         = 'ⵜⴰⵎⴰⵣⵉⵖⵜ';
			$zgh->lang_code_iso_639_2 = 'zgh';
			$zgh->lang_code_iso_639_3 = 'zgh';
			$zgh->country_code        = 'ma';
			$zgh->wp_locale           = 'zgh';
			$zgh->slug                = 'zgh';
			$zgh->nplurals            = 2;
			$zgh->plural_expression   = 'n >= 2 && (n < 11 || n > 99)';
			$zgh->alphabet            = 'tifinagh';

			$zh                      = new GP_Locale();
			$zh->english_name        = 'Chinese';
			$zh->native_name         = '中文';
			$zh->lang_code_iso_639_1 = 'zh';
			$zh->lang_code_iso_639_2 = 'zho';
			$zh->slug                = 'zh';
			$zh->nplurals            = 1;
			$zh->plural_expression   = '0';
			$zh->alphabet            = 'hanyu';

			$zh_cn                      = new GP_Locale();
			$zh_cn->english_name        = 'Chinese (China)';
			$zh_cn->native_name         = '简体中文';
			$zh_cn->lang_code_iso_639_1 = 'zh';
			$zh_cn->lang_code_iso_639_2 = 'zho';
			$zh_cn->country_code        = 'cn';
			$zh_cn->wp_locale           = 'zh_CN';
			$zh_cn->slug                = 'zh-cn';
			$zh_cn->nplurals            = 1;
			$zh_cn->plural_expression   = '0';
			$zh_cn->google_code         = 'zh-CN';
			$zh_cn->facebook_locale     = 'zh_CN';
			$zh_cn->alphabet            = 'simplified-chinese';
			$zh_cn->word_count_type     = 'characters_excluding_spaces';

			$zh_hk                      = new GP_Locale();
			$zh_hk->english_name        = 'Chinese (Hong Kong)';
			$zh_hk->native_name         = '香港中文';
			$zh_hk->lang_code_iso_639_1 = 'zh';
			$zh_hk->lang_code_iso_639_2 = 'zho';
			$zh_hk->country_code        = 'hk';
			$zh_hk->wp_locale           = 'zh_HK';
			$zh_hk->slug                = 'zh-hk';
			$zh_hk->nplurals            = 1;
			$zh_hk->plural_expression   = '0';
			$zh_hk->facebook_locale     = 'zh_HK';
			$zh_hk->alphabet            = 'simplified-chinese';
			$zh_hk->word_count_type     = 'characters_excluding_spaces';

			$zh_sg                      = new GP_Locale();
			$zh_sg->english_name        = 'Chinese (Singapore)';
			$zh_sg->native_name         = '中文';
			$zh_sg->lang_code_iso_639_1 = 'zh';
			$zh_sg->lang_code_iso_639_2 = 'zho';
			$zh_sg->country_code        = 'sg';
			$zh_sg->wp_locale           = 'zh_SG';
			$zh_sg->slug                = 'zh-sg';
			$zh_sg->nplurals            = 1;
			$zh_sg->plural_expression   = '0';
			$zh_sg->alphabet            = 'hanyu';
			$zh_sg->word_count_type     = 'characters_excluding_spaces';

			$zh_tw                      = new GP_Locale();
			$zh_tw->english_name        = 'Chinese (Taiwan)';
			$zh_tw->native_name         = '繁體中文';
			$zh_tw->lang_code_iso_639_1 = 'zh';
			$zh_tw->lang_code_iso_639_2 = 'zho';
			$zh_tw->country_code        = 'tw';
			$zh_tw->slug                = 'zh-tw';
			$zh_tw->wp_locale           = 'zh_TW';
			$zh_tw->nplurals            = 1;
			$zh_tw->plural_expression   = '0';
			$zh_tw->google_code         = 'zh-TW';
			$zh_tw->facebook_locale     = 'zh_TW';
			$zh_tw->alphabet            = 'hanyu';
			$zh_tw->word_count_type     = 'characters_excluding_spaces';

			$zul                      = new GP_Locale();
			$zul->english_name        = 'Zulu';
			$zul->native_name         = 'isiZulu';
			$zul->lang_code_iso_639_1 = 'zu';
			$zul->lang_code_iso_639_2 = 'zul';
			$zul->lang_code_iso_639_3 = 'zul';
			$zul->country_code        = 'za';
			$zul->wp_locale           = 'zul';
			$zul->slug                = 'zul';
			$zul->google_code         = 'zu';

			$def_vars = get_defined_vars();

			if ( function_exists( 'apply_filters' ) ) {
				/**
				 * Fires after the locales have been defined but before they have been assigned to the object property.
				 *
				 * @since 3.0.0
				 *
				 * @param array $def_vars The array of locale objects.
				 *
				 * @return array The updated array of locale objects.
				 */
				$def_vars = apply_filters( 'gp_locale_definitions_array', $def_vars );
			}

			foreach ( $def_vars as $locale ) {
				$this->locales[ $locale->slug ] = $locale;
			}
		}

		public static function &instance() {
			if ( ! isset( $GLOBALS['gp_locales'] ) )
				$GLOBALS['gp_locales'] = new GP_Locales;

			return $GLOBALS['gp_locales'];
		}

		public static function locales() {
			$instance = GP_Locales::instance();
			return $instance->locales;
		}

		public static function exists( $slug ) {
			$instance = GP_Locales::instance();
			return isset( $instance->locales[ $slug ] );
		}

		public static function by_slug( $slug ) {
			$instance = GP_Locales::instance();
			return isset( $instance->locales[ $slug ] ) ? $instance->locales[ $slug ] : null;
		}

		public static function by_field( $field_name, $field_value ) {
			$instance = GP_Locales::instance();
			$result   = false;

			foreach ( $instance->locales() as $locale ) {
				if ( isset( $locale->$field_name ) && $locale->$field_name == $field_value ) {
					$result = $locale;
					break;
				}
			}

			return $result;
		}
	}

endif;
