<?php
class GP_Locale {
	public $english_name;
	public $native_name;
	public $text_direction = 'ltr';
	public $lang_code_iso_639_1 = null;
	public $lang_code_iso_639_2 = null;
	public $lang_code_iso_639_3 = null;
	public $country_code;
	public $wp_locale;
	public $slug;
	public $nplurals = 2;
	public $plural_expression = 'n != 1';
	public $google_code = null;
	public $preferred_sans_serif_font_family = null;
	public $facebook_locale = null;
	// TODO: days, months, decimals, quotes

	public function GP_Locale( $args = array() ) {
		foreach( $args as $key => $value ) {
			$this->$key = $value;
		}
	}

	public static function __set_state( $state ) {
		return new GP_Locale( $state );
	}

	public function combined_name() {
		/* translators: combined name for locales: 1: name in English, 2: native name */
		return sprintf( _x( '%1$s/%2$s', 'locales', 'jetpack' ), $this->english_name, $this->native_name );
	}

	public function numbers_for_index( $index, $how_many = 3, $test_up_to = 1000 ) {
		$numbers = array();
		for( $number = 0; $number < $test_up_to; ++$number ) {
			if ( $this->index_for_number( $number ) == $index ) {
				$numbers[] = $number;
				if ( count( $numbers ) >= $how_many ) break;
			}
		}
		return $numbers;
	}

	public function index_for_number( $number ) {
		if ( !isset( $this->_index_for_number ) ) {
			$expression = Gettext_Translations::parenthesize_plural_exression( $this->plural_expression );
			$this->_index_for_number = Gettext_Translations::make_plural_form_function( $this->nplurals, $expression );
		}
		$f = $this->_index_for_number;
		return $f( $number );
	}
}

class GP_Locales {

	public $locales = array();

	public function GP_Locales() {
		$aa = new GP_Locale();
		$aa->english_name = 'Afar';
		$aa->native_name = 'Afaraf';
		$aa->lang_code_iso_639_1 = 'aa';
		$aa->lang_code_iso_639_2 = 'aar';
		$aa->slug = 'aa';

		$ae = new GP_Locale();
		$ae->english_name = 'Avestan';
		$ae->native_name = 'Avesta';
		$ae->lang_code_iso_639_1 = 'ae';
		$ae->lang_code_iso_639_2 = 'ave';
		$ae->slug = 'ae';

		$af = new GP_Locale();
		$af->english_name = 'Afrikaans';
		$af->native_name = 'Afrikaans';
		$af->lang_code_iso_639_1 = 'af';
		$af->lang_code_iso_639_2 = 'afr';
		$af->country_code = 'za';
		$af->wp_locale = 'af';
		$af->slug = 'af';
		$af->google_code = 'af';
		$af->facebook_locale = 'af_ZA';

		$ak = new GP_Locale();
		$ak->english_name = 'Akan';
		$ak->native_name = 'Akan';
		$ak->lang_code_iso_639_1 = 'ak';
		$ak->lang_code_iso_639_2 = 'aka';
		$ak->wp_locale = 'ak';
		$ak->slug = 'ak';

		$am = new GP_Locale();
		$am->english_name = 'Amharic';
		$am->native_name = 'አማርኛ';
		$am->lang_code_iso_639_1 = 'am';
		$am->lang_code_iso_639_2 = 'amh';
		$am->country_code = 'et';
		$am->wp_locale = 'am';
		$am->slug = 'am';
		$am->google_code = 'am';

		$an = new GP_Locale();
		$an->english_name = 'Aragonese';
		$an->native_name = 'Aragonés';
		$an->lang_code_iso_639_1 = 'an';
		$an->lang_code_iso_639_2 = 'arg';
		$an->country_code = 'es';
		$an->slug = 'an';

		$ar = new GP_Locale();
		$ar->english_name = 'Arabic';
		$ar->native_name = 'العربية';
		$ar->lang_code_iso_639_1 = 'ar';
		$ar->lang_code_iso_639_2 = 'ara';
		$ar->wp_locale = 'ar';
		$ar->slug = 'ar';
		$ar->google_code = 'ar';
		$ar->facebook_locale = 'ar_AR';
		$ar->nplurals = 6;
		$ar->plural_expression = 'n==0 ? 0 : n==1 ? 1 : n==2 ? 2 : n%100>=3 && n%100<=10 ? 3 : n%100>=11 && n%100<=99 ? 4 : 5';
		$ar->rtl = true;
		$ar->preferred_sans_serif_font_family = 'Tahoma';

		$as = new GP_Locale();
		$as->english_name = 'Assamese';
		$as->native_name = 'অসমীয়া';
		$as->lang_code_iso_639_1 = 'asm';
		$as->lang_code_iso_639_2 = 'as';
		$as->country_code = 'in';
		$as->wp_locale = 'as';
		$as->slug = 'as';
		$as->nplurals = 2;
		$as->plural_expression = '(n != 1)';

		$ast = new GP_Locale();
		$ast->english_name = 'Asturian';
		$ast->native_name = 'Asturianu';
		$ast->lang_code_iso_639_2 = 'ast';
		$ast->country_code = 'es';
		$ast->slug = 'ast';

		$av = new GP_Locale();
		$av->english_name = 'Avaric';
		$av->native_name = 'авар мацӀ';
		$av->lang_code_iso_639_1 = 'av';
		$av->lang_code_iso_639_2 = 'ava';
		$av->slug = 'av';

		$ay = new GP_Locale();
		$ay->english_name = 'Aymara';
		$ay->native_name = 'aymar aru';
		$ay->lang_code_iso_639_1 = 'ay';
		$ay->lang_code_iso_639_2 = 'aym';
		$ay->slug = 'ay';
		$ay->nplurals = 1;
		$ay->plural_expression = '0';

		$az = new GP_Locale();
		$az->english_name = 'Azerbaijani';
		$az->native_name = 'Azərbaycan dili';
		$az->lang_code_iso_639_1 = 'az';
		$az->lang_code_iso_639_2 = 'aze';
		$az->country_code = 'az';
		$az->wp_locale = 'az';
		$az->slug = 'az';
		$az->google_code = 'az';
		$az->facebook_locale = 'az_AZ';

		$azb = new GP_Locale();
		$azb->english_name = 'South Azerbaijani';
		$azb->native_name = 'گؤنئی آذربایجان';
		$azb->lang_code_iso_639_1 = 'az';
		$azb->lang_code_iso_639_2 = 'azb';
		$azb->country_code = 'az';
		$azb->wp_locale = 'azb';
		$azb->slug = 'azb';
		$azb->rtl = true;

		$az_tr = new GP_Locale();
		$az_tr->english_name = 'Azerbaijani (Turkey)';
		$az_tr->native_name = 'Azərbaycan Türkcəsi';
		$az_tr->lang_code_iso_639_1 = 'az';
		$az_tr->lang_code_iso_639_2 = 'aze';
		$az_tr->country_code = 'tr';
		$az_tr->wp_locale = 'az_TR';
		$az_tr->slug = 'az-tr';
		$az_tr->rtl = true;

		$ba = new GP_Locale();
		$ba->english_name = 'Bashkir';
		$ba->native_name = 'башҡорт теле';
		$ba->lang_code_iso_639_1 = 'ba';
		$ba->lang_code_iso_639_2 = 'bak';
		$ba->wp_locale = 'ba';
		$ba->slug = 'ba';

		$bal = new GP_Locale();
		$bal->english_name = 'Catalan (Balear)';
		$bal->native_name = 'Català (Balear)';
		$bal->lang_code_iso_639_2 = 'bal';
		$bal->country_code = 'es';
		$bal->wp_locale = 'bal';
		$bal->slug = 'bal';

		$be = new GP_Locale();
		$be->english_name = 'Belarusian';
		$be->native_name = 'Беларуская мова';
		$be->lang_code_iso_639_1 = 'be';
		$be->lang_code_iso_639_2 = 'bel';
		$be->country_code = 'by';
		$be->wp_locale = 'bel';
		$be->slug = 'bel';
		$be->google_code = 'be';
		$be->facebook_locale = 'be_BY';
		$be->nplurals = 3;
		$be->plural_expression = '(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2)';

		$bg = new GP_Locale();
		$bg->english_name = 'Bulgarian';
		$bg->native_name = 'Български';
		$bg->lang_code_iso_639_1 = 'bg';
		$bg->lang_code_iso_639_2 = 'bul';
		$bg->country_code = 'bg';
		$bg->wp_locale = 'bg_BG';
		$bg->slug = 'bg';
		$bg->google_code = 'bg';
		$bg->facebook_locale = 'bg_BG';

		$bh = new GP_Locale();
		$bh->english_name = 'Bihari';
		$bh->native_name = 'भोजपुरी';
		$bh->lang_code_iso_639_1 = 'bh';
		$bh->lang_code_iso_639_2 = 'bih';
		$bh->slug = 'bh';

		$bi = new GP_Locale();
		$bi->english_name = 'Bislama';
		$bi->native_name = 'Bislama';
		$bi->lang_code_iso_639_1 = 'bi';
		$bi->lang_code_iso_639_2 = 'bis';
		$bi->country_code = 'vu';
		$bi->slug = 'bi';

		$bm = new GP_Locale();
		$bm->english_name = 'Bambara';
		$bm->native_name = 'Bamanankan';
		$bm->lang_code_iso_639_1 = 'bm';
		$bm->lang_code_iso_639_2 = 'bam';
		$bm->slug = 'bm';

		$bn_bd = new GP_Locale();
		$bn_bd->english_name = 'Bengali';
		$bn_bd->native_name = 'বাংলা';
		$bn_bd->lang_code_iso_639_1 = 'bn';
		$bn_bd->country_code = 'bn';
		$bn_bd->wp_locale = 'bn_BD';
		$bn_bd->slug = 'bn';
		$bn_bd->google_code = 'bn';
		$bn_bd->facebook_locale = 'bn_IN';

		$bo = new GP_Locale();
		$bo->english_name = 'Tibetan';
		$bo->native_name = 'བོད་སྐད';
		$bo->lang_code_iso_639_1 = 'bo';
		$bo->lang_code_iso_639_2 = 'tib';
		$bo->wp_locale = 'bo';
		$bo->slug = 'bo';
		$bo->google_code = 'bo';
		$bo->nplurals = 1;
		$bo->plural_expression = '0';

		$br = new GP_Locale();
		$br->english_name = 'Breton';
		$br->native_name = 'Brezhoneg';
		$br->lang_code_iso_639_1 = 'br';
		$br->lang_code_iso_639_2 = 'bre';
		$br->country_code = 'fr';
		$br->slug = 'br';
		$br->nplurals = 2;
		$br->plural_expression = '(n > 1)';

		$bs = new GP_Locale();
		$bs->english_name = 'Bosnian';
		$bs->native_name = 'Bosanski';
		$bs->lang_code_iso_639_1 = 'bs';
		$bs->lang_code_iso_639_2 = 'bos';
		$bs->country_code = 'ba';
		$bs->wp_locale = 'bs_BA';
		$bs->slug = 'bs';
		$bs->google_code = 'bs';
		$bs->facebook_locale = 'bs_BA';
		$bs->nplurals = 3;
		$bs->plural_expression = '(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2)';

		$ca = new GP_Locale();
		$ca->english_name = 'Catalan';
		$ca->native_name = 'Català';
		$ca->lang_code_iso_639_1 = 'ca';
		$ca->lang_code_iso_639_2 = 'cat';
		$ca->wp_locale = 'ca';
		$ca->slug = 'ca';
		$ca->google_code = 'ca';
		$ca->facebook_locale = 'ca_ES';

		$ce = new GP_Locale();
		$ce->english_name = 'Chechen';
		$ce->native_name = 'Нохчийн мотт';
		$ce->lang_code_iso_639_1 = 'ce';
		$ce->lang_code_iso_639_2 = 'che';
		$ce->slug = 'ce';

		$ch = new GP_Locale();
		$ch->english_name = 'Chamorro';
		$ch->native_name = 'Chamoru';
		$ch->lang_code_iso_639_1 = 'ch';
		$ch->lang_code_iso_639_2 = 'cha';
		$ch->slug = 'ch';

		$ckb = new GP_Locale();
		$ckb->english_name = 'Kurdish (Sorani)';
		$ckb->native_name = 'كوردی‎';
		$ckb->lang_code_iso_639_1 = 'ku';
		$ckb->lang_code_iso_639_2 = 'ckb';
		$ckb->country_code = 'ku';
		$ckb->wp_locale = 'ckb';
		$ckb->slug = 'ckb';

		$co = new GP_Locale();
		$co->english_name = 'Corsican';
		$co->native_name = 'Corsu';
		$co->lang_code_iso_639_1 = 'co';
		$co->lang_code_iso_639_2 = 'cos';
		$co->country_code = 'it';
		$co->wp_locale = 'co';
		$co->slug = 'co';

		$cr = new GP_Locale();
		$cr->english_name = 'Cree';
		$cr->native_name = 'ᓀᐦᐃᔭᐍᐏᐣ';
		$cr->lang_code_iso_639_1 = 'cr';
		$cr->lang_code_iso_639_2 = 'cre';
		$cr->country_code = 'ca';
		$cr->slug = 'cr';

		$cs = new GP_Locale();
		$cs->english_name = 'Czech';
		$cs->native_name = 'Čeština‎';
		$cs->lang_code_iso_639_1 = 'cs';
		$cs->lang_code_iso_639_2 = 'ces';
		$cs->country_code = 'cz';
		$cs->wp_locale = 'cs_CZ';
		$cs->slug = 'cs';
		$cs->google_code = 'cs';
		$cs->facebook_locale = 'cs_CZ';
		$cs->nplurals = 3;
		$cs->plural_expression = '(n==1) ? 0 : (n>=2 && n<=4) ? 1 : 2';

		$csb = new GP_Locale();
		$csb->english_name = 'Kashubian';
		$csb->native_name = 'Kaszëbsczi';
		$csb->lang_code_iso_639_2 = 'csb';
		$csb->slug = 'csb';
		$csb->nplurals = 3;
		$csb->plural_expression = 'n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2';

		$cu = new GP_Locale();
		$cu->english_name = 'Church Slavic';
		$cu->native_name = 'ѩзыкъ словѣньскъ';
		$cu->lang_code_iso_639_1 = 'cu';
		$cu->lang_code_iso_639_2 = 'chu';
		$cu->slug = 'cu';

		$cv = new GP_Locale();
		$cv->english_name = 'Chuvash';
		$cv->native_name = 'чӑваш чӗлхи';
		$cv->lang_code_iso_639_1 = 'cv';
		$cv->lang_code_iso_639_2 = 'chv';
		$cv->country_code = 'ru';
		$cv->slug = 'cv';

		$cy = new GP_Locale();
		$cy->english_name = 'Welsh';
		$cy->native_name = 'Cymraeg';
		$cy->lang_code_iso_639_1 = 'cy';
		$cy->lang_code_iso_639_2 = 'cym';
		$cy->country_code = 'uk';
		$cy->wp_locale = 'cy';
		$cy->slug = 'cy';
		$cy->google_code = 'cy';
		$cy->facebook_locale = 'cy_GB';
		$cy->nplurals = 4;
		$cy->plural_expression = '(n==1) ? 0 : (n==2) ? 1 : (n != 8 && n != 11) ? 2 : 3';

		$da = new GP_Locale();
		$da->english_name = 'Danish';
		$da->native_name = 'Dansk';
		$da->lang_code_iso_639_1 = 'da';
		$da->lang_code_iso_639_2 = 'dan';
		$da->country_code = 'dk';
		$da->wp_locale = 'da_DK';
		$da->slug = 'da';
		$da->google_code = 'da';
		$da->facebook_locale = 'da_DK';

		$de = new GP_Locale();
		$de->english_name = 'German';
		$de->native_name = 'Deutsch';
		$de->lang_code_iso_639_1 = 'de';
		$de->country_code = 'de';
		$de->wp_locale = 'de_DE';
		$de->slug = 'de';
		$de->google_code = 'de';
		$de->facebook_locale = 'de_DE';

		$de_ch = new GP_Locale();
		$de_ch->english_name = 'German (Switzerland)';
		$de_ch->native_name = 'Schweizer Hochdeutsch';
		$de_ch->lang_code_iso_639_1 = 'de';
		$de_ch->country_code = 'ch';
		$de_ch->wp_locale = 'de_CH';
		$de_ch->slug = 'de-ch';
		$de->google_code = 'de';

		$dv = new GP_Locale();
		$dv->english_name = 'Dhivehi';
		$dv->native_name = 'ދިވެހި';
		$dv->lang_code_iso_639_1 = 'dv';
		$dv->lang_code_iso_639_2 = 'div';
		$dv->country_code = 'mv';
		$dv->wp_locale = 'dv';
		$dv->slug = 'dv';
		$dv->google_code = 'dv';
		$dv->rtl = true;

		$dz = new GP_Locale();
		$dz->english_name = 'Dzongkha';
		$dz->native_name = 'རྫོང་ཁ';
		$dz->lang_code_iso_639_1 = 'dz';
		$dz->lang_code_iso_639_2 = 'dzo';
		$dz->country_code = 'bt';
		$dz->slug = 'dz';
		$dz->nplurals = 1;
		$dz->plural_expression = '0';

		$ee = new GP_Locale();
		$ee->english_name = 'Ewe';
		$ee->native_name = 'Eʋegbe';
		$ee->lang_code_iso_639_1 = 'ee';
		$ee->lang_code_iso_639_2 = 'ewe';
		$ee->slug = 'ee';

		$el_po = new GP_Locale();
		$el_po->english_name = 'Greek (Polytonic)';
		$el_po->native_name = 'Greek (Polytonic)'; // TODO
		$el_po->country_code = 'gr';
		$el_po->slug = 'el-po';

		$el = new GP_Locale();
		$el->english_name = 'Greek';
		$el->native_name = 'Ελληνικά';
		$el->lang_code_iso_639_1 = 'el';
		$el->lang_code_iso_639_2 = 'ell';
		$el->country_code = 'gr';
		$el->wp_locale = 'el';
		$el->slug = 'el';
		$el->google_code = 'el';
		$el->facebook_locale = 'el_GR';

		$en = new GP_Locale();
		$en->english_name = 'English';
		$en->native_name = 'English';
		$en->lang_code_iso_639_1 = 'en';
		$en->country_code = 'us';
		$en->wp_locale = 'en_US';
		$en->slug = 'en';
		$en->google_code = 'en';
		$en->facebook_locale = 'en_US';

		$en_au = new GP_Locale();
		$en_au->english_name = 'English (Australia)';
		$en_au->native_name = 'English (Australia)';
		$en_au->lang_code_iso_639_1 = 'en';
		$en_au->lang_code_iso_639_2 = 'eng';
		$en_au->lang_code_iso_639_3 = 'eng';
		$en_au->country_code = 'au';
		$en_au->wp_locale = 'en_AU';
		$en_au->slug = 'en-au';
		$en_au->google_code = 'en';

		$en_ca = new GP_Locale();
		$en_ca->english_name = 'English (Canada)';
		$en_ca->native_name = 'English (Canada)';
		$en_ca->lang_code_iso_639_1 = 'en';
		$en_ca->lang_code_iso_639_2 = 'eng';
		$en_ca->lang_code_iso_639_3 = 'eng';
		$en_ca->country_code = 'ca';
		$en_ca->wp_locale = 'en_CA';
		$en_ca->slug = 'en-ca';
		$en_ca->google_code = 'en';

		$en_gb = new GP_Locale();
		$en_gb->english_name = 'English (UK)';
		$en_gb->native_name = 'English (UK)';
		$en_gb->lang_code_iso_639_1 = 'en';
		$en_gb->lang_code_iso_639_2 = 'eng';
		$en_gb->lang_code_iso_639_3 = 'eng';
		$en_gb->country_code = 'gb';
		$en_gb->wp_locale = 'en_GB';
		$en_gb->slug = 'en-gb';
		$en_gb->google_code = 'en';
		$en_gb->facebook_locale = 'en_GB';

		$eo = new GP_Locale();
		$eo->english_name = 'Esperanto';
		$eo->native_name = 'Esperanto';
		$eo->lang_code_iso_639_1 = 'eo';
		$eo->lang_code_iso_639_2 = 'epo';
		$eo->wp_locale = 'eo';
		$eo->slug = 'eo';
		$eo->google_code = 'eo';
		$eo->facebook_locale = 'eo_EO';

		$es_ar = new GP_Locale();
		$es_ar->english_name = 'Spanish (Argentina)';
		$es_ar->native_name = 'Español de Argentina';
		$es_ar->lang_code_iso_639_1 = 'es';
		$es_ar->lang_code_iso_639_2 = 'spa';
		$es_ar->country_code = 'ar';
		$es_ar->wp_locale = 'es_AR';
		$es_ar->slug = 'es-ar';
		$es_ar->google_code = 'es';
		$es_ar->facebook_locale = 'es_AR';

		$es_cl = new GP_Locale();
		$es_cl->english_name = 'Spanish (Chile)';
		$es_cl->native_name = 'Español de Chile';
		$es_cl->lang_code_iso_639_1 = 'es';
		$es_cl->lang_code_iso_639_2 = 'spa';
		$es_cl->country_code = 'cl';
		$es_cl->wp_locale = 'es_CL';
		$es_cl->slug = 'es-cl';
		$es_cl->google_code = 'es';
		$es_cl->facebook_locale = 'es_LA';

		$es_mx = new GP_Locale();
		$es_mx->english_name = 'Spanish (Mexico)';
		$es_mx->native_name = 'Español de México';
		$es_mx->lang_code_iso_639_1 = 'es';
		$es_mx->lang_code_iso_639_2 = 'spa';
		$es_mx->country_code = 'mx';
		$es_mx->wp_locale = 'es_MX';
		$es_mx->slug = 'es-mx';
		$es_mx->google_code = 'es';
		$es_mx->facebook_locale = 'es_LA';

		$es_pe = new GP_Locale();
		$es_pe->english_name = 'Spanish (Peru)';
		$es_pe->native_name = 'Español de Perú';
		$es_pe->lang_code_iso_639_1 = 'es';
		$es_pe->lang_code_iso_639_2 = 'spa';
		$es_pe->country_code = 'pe';
		$es_pe->wp_locale = 'es_PE';
		$es_pe->slug = 'es-pe';
		$es_pe->google_code = 'es';
		$es_pe->facebook_locale = 'es_LA';

		$es_pr = new GP_Locale();
		$es_pr->english_name = 'Spanish (Puerto Rico)';
		$es_pr->native_name = 'Español de Puerto Rico';
		$es_pr->lang_code_iso_639_1 = 'es';
		$es_pr->lang_code_iso_639_2 = 'spa';
		$es_pr->country_code = 'pr';
		$es_pr->wp_locale = 'es_PR';
		$es_pr->slug = 'es-pr';
		$es_pr->google_code = 'es';
		$es_pr->facebook_locale = 'es_LA';

		$es_ve = new GP_Locale();
		$es_ve->english_name = 'Spanish (Venezuela)';
		$es_ve->native_name = 'Español de Venezuela';
		$es_ve->lang_code_iso_639_1 = 'es';
		$es_ve->lang_code_iso_639_2 = 'spa';
		$es_ve->country_code = 've';
		$es_ve->wp_locale = 'es_VE';
		$es_ve->slug = 'es-ve';
		$es_ve->google_code = 'es';
		$es_ve->facebook_locale = 'es_LA';

		$es_co = new GP_Locale();
		$es_co->english_name = 'Spanish (Colombia)';
		$es_co->native_name = 'Español de Colombia';
		$es_co->lang_code_iso_639_1 = 'es';
		$es_co->lang_code_iso_639_2 = 'spa';
		$es_co->country_code = 'co';
		$es_co->wp_locale = 'es_CO';
		$es_co->slug = 'es-co';
		$es_co->google_code = 'es';
		$es_co->facebook_locale = 'es_LA';

		$es = new GP_Locale();
		$es->english_name = 'Spanish (Spain)';
		$es->native_name = 'Español';
		$es->lang_code_iso_639_1 = 'es';
		$es->country_code = 'es';
		$es->wp_locale = 'es_ES';
		$es->slug = 'es';
		$es->google_code = 'es';
		$es->facebook_locale = 'es_ES';

		$et = new GP_Locale();
		$et->english_name = 'Estonian';
		$et->native_name = 'Eesti';
		$et->lang_code_iso_639_1 = 'et';
		$et->lang_code_iso_639_2 = 'est';
		$et->country_code = 'ee';
		$et->wp_locale = 'et';
		$et->slug = 'et';
		$et->google_code = 'et';
		$et->facebook_locale = 'et_EE';

		$eu = new GP_Locale();
		$eu->english_name = 'Basque';
		$eu->native_name = 'Euskara';
		$eu->lang_code_iso_639_1 = 'eu';
		$eu->lang_code_iso_639_2 = 'eus';
		$eu->country_code = 'es';
		$eu->wp_locale = 'eu';
		$eu->slug = 'eu';
		$eu->google_code = 'eu';
		$eu->facebook_locale = 'eu_ES';

		$fa = new GP_Locale();
		$fa->english_name = 'Persian';
		$fa->native_name = 'فارسی';
		$fa->lang_code_iso_639_1 = 'fa';
		$fa->lang_code_iso_639_2 = 'fas';
		$fa->wp_locale = 'fa_IR';
		$fa->slug = 'fa';
		$fa->google_code = 'fa';
		$fa->facebook_locale = 'fa_IR';
		$fa->nplurals = 1;
		$fa->plural_expression = '0';
		$fa->rtl = true;

		$fa_af = new GP_Locale();
		$fa_af->english_name = 'Persian (Afghanistan)';
		$fa_af->native_name = '(فارسی (افغانستان';
		$fa_af->lang_code_iso_639_1 = 'fa';
		$fa_af->lang_code_iso_639_2 = 'fas';
		$fa_af->wp_locale = 'fa_AF';
		$fa_af->slug = 'fa-af';
		$fa_af->google_code = 'fa';
		$fa_af->nplurals = 1;
		$fa_af->plural_expression = '0';
		$fa_af->rtl = true;

		$ff_sn = new GP_Locale();
		$ff_sn->english_name = 'Fulah';
		$ff_sn->native_name = 'Pulaar';
		$ff_sn->lang_code_iso_639_1 = 'ff';
		$ff_sn->lang_code_iso_639_2 = 'fuc';
		$ff_sn->country_code = 'sn';
		$ff_sn->wp_locale = 'fuc';
		$ff_sn->slug = 'fuc';
		$ff_sn->plural_expression = 'n!=1';

		$fi = new GP_Locale();
		$fi->english_name = 'Finnish';
		$fi->native_name = 'Suomi';
		$fi->lang_code_iso_639_1 = 'fi';
		$fi->lang_code_iso_639_2 = 'fin';
		$fi->country_code = 'fi';
		$fi->wp_locale = 'fi';
		$fi->slug = 'fi';
		$fi->google_code = 'fi';
		$fi->facebook_locale = 'fi_FI';

		$fj = new GP_Locale();
		$fj->english_name = 'Fijian';
		$fj->native_name = 'Vosa Vakaviti';
		$fj->lang_code_iso_639_1 = 'fj';
		$fj->lang_code_iso_639_2 = 'fij';
		$fj->country_code = 'fj';
		$fj->slug = 'fj';

		$fo = new GP_Locale();
		$fo->english_name = 'Faroese';
		$fo->native_name = 'Føroyskt';
		$fo->lang_code_iso_639_1 = 'fo';
		$fo->lang_code_iso_639_2 = 'fao';
		$fo->country_code = 'fo';
		$fo->wp_locale = 'fo';
		$fo->slug = 'fo';
		$fo->facebook_locale = 'fo_FO';

		$fr = new GP_Locale();
		$fr->english_name = 'French (France)';
		$fr->native_name = 'Français';
		$fr->lang_code_iso_639_1 = 'fr';
		$fr->country_code = 'fr';
		$fr->wp_locale = 'fr_FR';
		$fr->slug = 'fr';
		$fr->google_code = 'fr';
		$fr->facebook_locale = 'fr_FR';
		$fr->nplurals = 2;
		$fr->plural_expression = 'n > 1';

		$fr_be = new GP_Locale();
		$fr_be->english_name = 'French (Belgium)';
		$fr_be->native_name = 'Français de Belgique';
		$fr_be->lang_code_iso_639_1 = 'fr';
		$fr_be->lang_code_iso_639_2 = 'fra';
		$fr_be->country_code = 'be';
		$fr_be->wp_locale = 'fr_BE';
		$fr_be->slug = 'fr-be';

		$fr_ca = new GP_Locale();
		$fr_ca->english_name = 'French (Canada)';
		$fr_ca->native_name = 'Français du Canada';
		$fr_ca->lang_code_iso_639_1 = 'fr';
		$fr_ca->lang_code_iso_639_2 = 'fra';
		$fr_ca->country_code = 'ca';
		$fr_ca->facebook_locale = 'fr_CA';
		$fr_ca->wp_locale = 'fr_CA';
		$fr_ca->slug = 'fr-ca';

		$fr_ch = new GP_Locale();
		$fr_ch->english_name = 'French (Switzerland)';
		$fr_ch->native_name = 'Français de Suisse';
		$fr_ch->lang_code_iso_639_1 = 'fr';
		$fr_ch->lang_code_iso_639_2 = 'fra';
		$fr_ch->country_code = 'ch';
		$fr_ch->slug = 'fr-ch';

		$fy = new GP_Locale();
		$fy->english_name = 'Frisian';
		$fy->native_name = 'Frysk';
		$fy->lang_code_iso_639_1 = 'fy';
		$fy->lang_code_iso_639_2 = 'fry';
		$fy->country_code = 'fy';
		$fy->facebook_locale = 'fy_NL';
		$fy->slug = 'fy';
		$fy->wp_locale = 'fy';

		$ga = new GP_Locale();
		$ga->english_name = 'Irish';
		$ga->native_name = 'Gaelige';
		$ga->lang_code_iso_639_1 = 'ga';
		$ga->lang_code_iso_639_2 = 'gle';
		$ga->country_code = 'ie';
		$ga->slug = 'ga';
		$ga->wp_locale = 'ga';
		$ga->google_code = 'ga';
		$ga->facebook_locale = 'ga_IE';
		$ga->nplurals = 5;
		$ga->plural_expression = 'n==1 ? 0 : n==2 ? 1 : n<7 ? 2 : n<11 ? 3 : 4';

		$gd = new GP_Locale();
		$gd->english_name = 'Scottish Gaelic';
		$gd->native_name = 'Gàidhlig';
		$gd->lang_code_iso_639_1 = 'gd';
		$gd->lang_code_iso_639_2 = 'gla';
		$gd->lang_code_iso_639_3 = 'gla';
		$gd->country_code = 'uk';
		$gd->wp_locale = 'gd';
		$gd->slug = 'gd';
		$gd->google_code = 'gd';
		$gd->nplurals = 4;
		$gd->plural_expression = '(n==1 || n==11) ? 0 : (n==2 || n==12) ? 1 : (n > 2 && n < 20) ? 2 : 3';

		$gl = new GP_Locale();
		$gl->english_name = 'Galician';
		$gl->native_name = 'Galego';
		$gl->lang_code_iso_639_1 = 'gl';
		$gl->lang_code_iso_639_2 = 'glg';
		$gl->country_code = 'es';
		$gl->wp_locale = 'gl_ES';
		$gl->slug = 'gl';
		$gl->google_code = 'gl';
		$gl->facebook_locale = 'gl_ES';

		$gn = new GP_Locale();
		$gn->english_name = 'Guaraní';
		$gn->native_name = 'Avañe\'ẽ';
		$gn->lang_code_iso_639_1 = 'gn';
		$gn->lang_code_iso_639_2 = 'grn';
		$gn->wp_locale = 'gn';
		$gn->slug = 'gn';
		$gn->google_code = 'gn';

		$gsw = new GP_Locale();
		$gsw->english_name = 'Swiss German';
		$gsw->native_name = 'Schwyzerdütsch';
		$gsw->lang_code_iso_639_2 = 'gsw';
		$gsw->lang_code_iso_639_3 = 'gsw';
		$gsw->country_code = 'ch';
		$gsw->wp_locale = 'gsw';
		$gsw->slug = 'gsw';

		$gu = new GP_Locale();
		$gu->english_name = 'Gujarati';
		$gu->native_name = 'ગુજરાતી';
		$gu->lang_code_iso_639_1 = 'gu';
		$gu->lang_code_iso_639_2 = 'guj';
		$gu->wp_locale = 'gu';
		$gu->slug = 'gu';
		$gu->google_code = 'gu';

		$ha = new GP_Locale();
		$ha->english_name = 'Hausa';
		$ha->native_name = 'هَوُسَ';
		$ha->lang_code_iso_639_1 = 'he';
		$ha->lang_code_iso_639_2 = 'hau';
		$ha->slug = 'ha';
		$ha->rtl = true;

		$haw = new GP_Locale();
		$haw->english_name = 'Hawaiian';
		$haw->native_name = 'Ōlelo Hawaiʻi';
		$haw->lang_code_iso_639_2 = 'haw';
		$haw->country_code = 'us';
		$haw->wp_locale = 'haw_US';
		$haw->slug = 'haw';

		$haz = new GP_Locale();
		$haz->english_name = 'Hazaragi';
		$haz->native_name = 'هزاره گی';
		$haz->lang_code_iso_639_2 = 'haz';
		$haz->country_code = 'af';
		$haz->wp_locale = 'haz';
		$haz->slug = 'haz';
		$haz->rtl = true;

		$he = new GP_Locale();
		$he->english_name = 'Hebrew';
		$he->native_name = 'עִבְרִית';
		$he->lang_code_iso_639_1 = 'he';
		$he->country_code = 'il';
		$he->wp_locale = 'he_IL';
		$he->slug = 'he';
		$he->google_code = 'iw';
		$he->facebook_locale = 'he_IL';
		$he->rtl = true;

		$hi = new GP_Locale();
		$hi->english_name = 'Hindi';
		$hi->native_name = 'हिन्दी';
		$hi->lang_code_iso_639_1 = 'hi';
		$hi->lang_code_iso_639_2 = 'hin';
		$hi->country_code = 'in';
		$hi->wp_locale = 'hi_IN';
		$hi->slug = 'hi';
		$hi->google_code = 'hi';
		$hi->facebook_locale = 'hi_IN';

		$hr = new GP_Locale();
		$hr->english_name = 'Croatian';
		$hr->native_name = 'Hrvatski';
		$hr->lang_code_iso_639_1 = 'hr';
		$hr->lang_code_iso_639_2 = 'hrv';
		$hr->country_code = 'hr';
		$hr->wp_locale = 'hr';
		$hr->slug = 'hr';
		$hr->google_code = 'hr';
		$hr->facebook_locale = 'hr_HR';
		$hr->nplurals = 3;
		$hr->plural_expression = '(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2)';

		$hu = new GP_Locale();
		$hu->english_name = 'Hungarian';
		$hu->native_name = 'Magyar';
		$hu->lang_code_iso_639_1 = 'hu';
		$hu->lang_code_iso_639_2 = 'hun';
		$hu->country_code = 'hu';
		$hu->wp_locale = 'hu_HU';
		$hu->slug = 'hu';
		$hu->google_code = 'hu';
		$hu->facebook_locale = 'hu_HU';

		$hy = new GP_Locale();
		$hy->english_name = 'Armenian';
		$hy->native_name = 'Հայերեն';
		$hy->lang_code_iso_639_1 = 'hy';
		$hy->lang_code_iso_639_2 = 'hye';
		$hy->country_code = 'am';
		$hy->wp_locale = 'hy';
		$hy->slug = 'hy';
		$hy->google_code = 'hy';
		$hy->facebook_locale = 'hy_AM';
		$hy->nplurals = 2;

		$ia = new GP_Locale();
		$ia->english_name = 'Interlingua';
		$ia->native_name = 'Interlingua';
		$ia->lang_code_iso_639_1 = 'ia';
		$ia->lang_code_iso_639_2 = 'ina';
		$ia->slug = 'ia';

		$id = new GP_Locale();
		$id->english_name = 'Indonesian';
		$id->native_name = 'Bahasa Indonesia';
		$id->lang_code_iso_639_1 = 'id';
		$id->lang_code_iso_639_2 = 'ind';
		$id->country_code = 'id';
		$id->wp_locale = 'id_ID';
		$id->slug = 'id';
		$id->google_code = 'id';
		$id->facebook_locale = 'id_ID';
		$id->nplurals = 2;
		$id->plural_expression = 'n > 1';

		$ido = new GP_Locale();
		$ido->english_name = 'Ido';
		$ido->native_name = 'Ido';
		$ido->lang_code_iso_639_1 = 'id';
		$ido->lang_code_iso_639_2 = 'ido';
		$ido->lang_code_iso_639_3 = 'ido';
		$ido->wp_locale = 'ido';
		$ido->slug = 'ido';

		$ike = new GP_Locale();
		$ike->english_name = 'Inuktitut';
		$ike->native_name = 'ᐃᓄᒃᑎᑐᑦ';
		$ike->lang_code_iso_639_1 = 'iu';
		$ike->lang_code_iso_639_2 = 'iku';
		$ike->country_code = 'ca';
		$ike->slug = 'ike';

		$ilo = new GP_Locale();
		$ilo->english_name = 'Iloko';
		$ilo->native_name = 'Pagsasao nga Iloko';
		$ilo->lang_code_iso_639_2 = 'ilo';
		$ilo->country_code = 'ph';
		$ilo->slug = 'ilo';

		$is = new GP_Locale();
		$is->english_name = 'Icelandic';
		$is->native_name = 'Íslenska';
		$is->lang_code_iso_639_1 = 'is';
		$is->lang_code_iso_639_2 = 'isl';
		$is->country_code = 'is';
		$is->slug = 'is';
		$is->google_code = 'is';
		$is->facebook_locale = 'is_IS';
		$is->wp_locale = 'is_IS';
		$is->nplurals = 2;
		$is->plural_expression = '(n % 100 != 1 && n % 100 != 21 && n % 100 != 31 && n % 100 != 41 && n % 100 != 51 && n % 100 != 61 && n % 100 != 71 && n % 100 != 81 && n % 100 != 91)';

		$it = new GP_Locale();
		$it->english_name = 'Italian';
		$it->native_name = 'Italiano';
		$it->lang_code_iso_639_1 = 'it';
		$it->lang_code_iso_639_2 = 'ita';
		$it->country_code = 'it';
		$it->wp_locale = 'it_IT';
		$it->slug = 'it';
		$it->google_code = 'it';
		$it->facebook_locale = 'it_IT';

		$ja = new GP_Locale();
		$ja->english_name = 'Japanese';
		$ja->native_name = '日本語';
		$ja->lang_code_iso_639_1 = 'ja';
		$ja->country_code = 'jp';
		$ja->wp_locale = 'ja';
		$ja->slug = 'ja';
		$ja->google_code = 'ja';
		$ja->facebook_locale = 'ja_JP';
		$ja->nplurals = 1;
		$ja->plural_expression = '0';

		$jv = new GP_Locale();
		$jv->english_name = 'Javanese';
		$jv->native_name = 'Basa Jawa';
		$jv->lang_code_iso_639_1 = 'jv';
		$jv->lang_code_iso_639_2 = 'jav';
		$jv->country_code = 'id';
		$jv->wp_locale = 'jv_ID';
		$jv->slug = 'jv';
		$jv->google_code = 'jw';

		$ka = new GP_Locale();
		$ka->english_name = 'Georgian';
		$ka->native_name = 'ქართული';
		$ka->lang_code_iso_639_1 = 'ka';
		$ka->lang_code_iso_639_2 = 'kat';
		$ka->country_code = 'ge';
		$ka->wp_locale = 'ka_GE';
		$ka->slug = 'ka';
		$ka->google_code = 'ka';
		$ka->facebook_locale = 'ka_GE';
		$ka->nplurals = 1;
		$ka->plural_expression = '0';

		$kin = new GP_Locale();
		$kin->english_name = 'Kinyarwanda';
		$kin->native_name = 'Ikinyarwanda';
		$kin->lang_code_iso_639_1 = 'rw';
		$kin->lang_code_iso_639_2 = 'kin';
		$kin->lang_code_iso_639_3 = 'kin';
		$kin->wp_locale = 'kin';
		$kin->country_code = 'rw';
		$kin->slug = 'kin';

		$kk = new GP_Locale();
		$kk->english_name = 'Kazakh';
		$kk->native_name = 'Қазақ тілі';
		$kk->lang_code_iso_639_1 = 'kk';
		$kk->lang_code_iso_639_2 = 'kaz';
		$kk->country_code = 'kz';
		$kk->wp_locale = 'kk';
		$kk->slug = 'kk';
		$kk->google_code = 'kk';

		$km = new GP_Locale();
		$km->english_name = 'Khmer';
		$km->native_name = 'ភាសាខ្មែរ';
		$km->lang_code_iso_639_1 = 'km';
		$km->lang_code_iso_639_2 = 'khm';
		$km->country_code = 'kh';
		$km->wp_locale = 'km';
		$km->slug = 'km';
		$km->google_code = 'km';
		$km->facebook_locale = 'km_KH';
		$km->nplurals = 1;
		$km->plural_expression = '0';

		$kn = new GP_Locale();
		$kn->english_name = 'Kannada';
		$kn->native_name = 'ಕನ್ನಡ';
		$kn->lang_code_iso_639_1 = 'kn';
		$kn->lang_code_iso_639_2 = 'kan';
		$kn->country_code = 'in';
		$kn->wp_locale = 'kn';
		$kn->slug = 'kn';
		$kn->google_code = 'kn';

		$ko = new GP_Locale();
		$ko->english_name = 'Korean';
		$ko->native_name = '한국어';
		$ko->lang_code_iso_639_1 = 'ko';
		$ko->lang_code_iso_639_2 = 'kor';
		$ko->country_code = 'kr';
		$ko->wp_locale = 'ko_KR';
		$ko->slug = 'ko';
		$ko->google_code = 'ko';
		$ko->facebook_locale = 'ko_KR';
		$ko->nplurals = 1;
		$ko->plural_expression = '0';

		$ks = new GP_Locale();
		$ks->english_name = 'Kashmiri';
		$ks->native_name = 'कश्मीरी';
		$ks->lang_code_iso_639_1 = 'ks';
		$ks->lang_code_iso_639_2 = 'kas';
		$ks->slug = 'ks';

		$ku = new GP_Locale();
		$ku->english_name = 'Kurdish (Kurmanji)';
		$ku->native_name = 'Kurdî';
		$ku->lang_code_iso_639_1 = 'ku';
		$ku->lang_code_iso_639_2 = 'kur';
		$ku->country_code = 'ku';
		$ku->slug = 'ku';
		$ku->google_code = 'ku';
		$ku->facebook_locale = 'ku_TR';

		$ky = new GP_Locale();
		$ky->english_name = 'Kirghiz';
		$ky->native_name = 'кыргыз тили';
		$ky->lang_code_iso_639_1 = 'ky';
		$ky->lang_code_iso_639_2 = 'kir';
		$ky->country_code = 'kg';
		$ky->wp_locale = 'ky_KY';
		$ky->slug = 'ky';
		$ky->nplurals = 1;
		$ky->plural_expression = '0';

		$la = new GP_Locale();
		$la->english_name = 'Latin';
		$la->native_name = 'Latine';
		$la->lang_code_iso_639_1 = 'la';
		$la->lang_code_iso_639_2 = 'lat';
		$la->slug = 'la';
		$la->facebook_locale = 'la_VA';

		$lb = new GP_Locale();
		$lb->english_name = 'Luxembourgish';
		$lb->native_name = 'Lëtzebuergesch';
		$lb->lang_code_iso_639_1 = 'lb';
		$lb->country_code = 'lu';
		$lb->wp_locale = 'lb_LU';
		$lb->slug = 'lb';

		$li = new GP_Locale();
		$li->english_name = 'Limburgish';
		$li->native_name = 'Limburgs';
		$li->lang_code_iso_639_1 = 'li';
		$li->lang_code_iso_639_2 = 'lim';
		$li->lang_code_iso_639_3 = 'lim';
		$li->country_code = 'nl';
		$li->wp_locale = 'li';
		$li->slug = 'li';
		$li->google_code = 'li';

		$lin = new GP_Locale();
		$lin->english_name = 'Lingala';
		$lin->native_name = 'Ngala';
		$lin->lang_code_iso_639_1 = 'ln';
		$lin->lang_code_iso_639_2 = 'lin';
		$lin->wp_locale = 'lin';
		$lin->slug = 'lin';
		$lin->nplurals = 2;
		$lin->plural_expression = 'n>1';

		$lo = new GP_Locale();
		$lo->english_name = 'Lao';
		$lo->native_name = 'ພາສາລາວ';
		$lo->lang_code_iso_639_1 = 'lo';
		$lo->lang_code_iso_639_2 = 'lao';
		$lo->wp_locale = 'lo';
		$lo->slug = 'lo';
		$lo->google_code = 'lo';
		$lo->nplurals = 1;
		$lo->plural_expression = '0';

		$lt = new GP_Locale();
		$lt->english_name = 'Lithuanian';
		$lt->native_name = 'Lietuvių kalba';
		$lt->lang_code_iso_639_1 = 'lt';
		$lt->lang_code_iso_639_2 = 'lit';
		$lt->country_code = 'lt';
		$lt->wp_locale = 'lt_LT';
		$lt->slug = 'lt';
		$lt->google_code = 'lt';
		$lt->facebook_locale = 'lt_LT';
		$lt->nplurals = 3;
		$lt->plural_expression = '(n%10==1 && n%100!=11 ? 0 : n%10>=2 && (n%100<10 || n%100>=20) ? 1 : 2)';

		$lv = new GP_Locale();
		$lv->english_name = 'Latvian';
		$lv->native_name = 'Latviešu valoda';
		$lv->lang_code_iso_639_1 = 'lv';
		$lv->lang_code_iso_639_2 = 'lav';
		$lv->country_code = 'lv';
		$lv->wp_locale = 'lv';
		$lv->slug = 'lv';
		$lv->google_code = 'lv';
		$lv->facebook_locale = 'lv_LV';
		$lv->nplurals = 3;
		$lv->plural_expression = '(n%10==1 && n%100!=11 ? 0 : n != 0 ? 1 : 2)';

		$me = new GP_Locale();
		$me->english_name = 'Montenegrin';
		$me->native_name = 'Crnogorski jezik';
		$me->lang_code_iso_639_1 = 'me';
		$me->country_code = 'me';
		$me->wp_locale = 'me_ME';
		$me->google_code = 'srp';
		$me->slug = 'me';
		$me->nplurals = 3;
		$me->plural_expression = '(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2)';

		$mg = new GP_Locale();
		$mg->english_name = 'Malagasy';
		$mg->native_name = 'Malagasy';
		$mg->lang_code_iso_639_1 = 'mg';
		$mg->lang_code_iso_639_2 = 'mlg';
		$mg->country_code = 'mg';
		$mg->wp_locale = 'mg_MG';
		$mg->slug = 'mg';

		$mhr = new GP_Locale();
		$mhr->english_name = 'Mari (Meadow)';
		$mhr->native_name = 'Олык марий';
		$mhr->lang_code_iso_639_3 = 'mhr';
		$mhr->country_code = 'ru';
		$mhr->slug = 'mhr';
		$mhr->google_code = 'chm';

		$mk = new GP_Locale();
		$mk->english_name = 'Macedonian';
		$mk->native_name = 'Македонски јазик';
		$mk->lang_code_iso_639_1 = 'mk';
		$mk->lang_code_iso_639_2 = 'mkd';
		$mk->country_code = 'mk';
		$mk->wp_locale = 'mk_MK';
		$mk->slug = 'mk';
		$mk->google_code = 'mk';
		$mk->facebook_locale = 'mk_MK';
		$mk->nplurals = 2;
		$mk->plural_expression = 'n==1 || n%10==1 ? 0 : 1';

		$ml = new GP_Locale();
		$ml->english_name = 'Malayalam';
		$ml->native_name = 'മലയാളം';
		$ml->lang_code_iso_639_1 = 'ml';
		$ml->lang_code_iso_639_2 = 'mal';
		$ml->country_code = 'in';
		$ml->wp_locale = 'ml_IN';
		$ml->slug = 'ml';
		$ml->google_code = 'ml';
		$ml->facebook_locale = 'ml_IN';

		$mn = new GP_Locale();
		$mn->english_name = 'Mongolian';
		$mn->native_name = 'Монгол';
		$mn->lang_code_iso_639_1 = 'mn';
		$mn->lang_code_iso_639_2 = 'mon';
		$mn->country_code = 'mn';
		$mn->wp_locale = 'mn';
		$mn->slug = 'mn';
		$mn->google_code = 'mn';

		$mr = new GP_Locale();
		$mr->english_name = 'Marathi';
		$mr->native_name = 'मराठी';
		$mr->lang_code_iso_639_1 = 'mr';
		$mr->lang_code_iso_639_2 = 'mar';
		$mr->wp_locale = 'mr';
		$mr->slug = 'mr';
		$mr->google_code = 'mr';

		$mri = new GP_Locale();
		$mri->english_name = 'Maori';
		$mri->native_name = 'Te Reo Māori';
		$mri->lang_code_iso_639_3 = 'mri';
		$mri->country_code = 'nz';
		$mri->slug = 'mri';
		$mri->nplurals = 2;
		$mri->plural_expression = '(n > 1)';

		$mrj = new GP_Locale();
		$mrj->english_name = 'Mari (Hill)';
		$mrj->native_name = 'Кырык мары';
		$mrj->lang_code_iso_639_3 = 'mrj';
		$mrj->country_code = 'ru';
		$mrj->slug = 'mrj';
		$mrj->google_code = 'chm';

		$ms = new GP_Locale();
		$ms->english_name = 'Malay';
		$ms->native_name = 'Bahasa Melayu';
		$ms->lang_code_iso_639_1 = 'ms';
		$ms->lang_code_iso_639_2 = 'msa';
		$ms->wp_locale = 'ms_MY';
		$ms->slug = 'ms';
		$ms->google_code = 'ms';
		$ms->facebook_locale = 'ms_MY';
		$ms->nplurals = 1;
		$ms->plural_expression = '0';

		$mwl = new GP_Locale();
		$mwl->english_name = 'Mirandese';
		$mwl->native_name = 'Mirandés';
		$mwl->lang_code_iso_639_2 = 'mwl';
		$mwl->slug = 'mwl';

		$my = new GP_Locale();
		$my->english_name = 'Burmese';
		$my->native_name = 'ဗမာစာ';
		$my->lang_code_iso_639_1 = 'my';
		$my->lang_code_iso_639_2 = 'mya';
		$my->country_code = 'mm';
		$my->wp_locale = 'my_MM';
		$my->slug = 'mya';
		$my->google_code = 'my';

		$ne = new GP_Locale();
		$ne->english_name = 'Nepali';
		$ne->native_name = 'नेपाली';
		$ne->lang_code_iso_639_1 = 'ne';
		$ne->lang_code_iso_639_2 = 'nep';
		$ne->country_code = 'np';
		$ne->wp_locale = 'ne_NP';
		$ne->slug = 'ne';
		$ne->facebook_locale = 'ne_NP';

		$nb = new GP_Locale();
		$nb->english_name = 'Norwegian (Bokmål)';
		$nb->native_name = 'Norsk bokmål';
		$nb->lang_code_iso_639_1 = 'nb';
		$nb->lang_code_iso_639_2 = 'nob';
		$nb->country_code = 'no';
		$nb->wp_locale = 'nb_NO';
		$nb->slug = 'nb';
		$nb->google_code = 'no';
		$nb->facebook_locale = 'nb_NO';

		$nl = new GP_Locale();
		$nl->english_name = 'Dutch';
		$nl->native_name = 'Nederlands';
		$nl->lang_code_iso_639_1 = 'nl';
		$nl->lang_code_iso_639_2 = 'nld';
		$nl->country_code = 'nl';
		$nl->wp_locale = 'nl_NL';
		$nl->slug = 'nl';
		$nl->google_code = 'nl';
		$nl->facebook_locale = 'nl_NL';

		$nl_be = new GP_Locale();
		$nl_be->english_name = 'Dutch (Belgium)';
		$nl_be->native_name = 'Nederlands (België)';
		$nl_be->lang_code_iso_639_1 = 'nl';
		$nl_be->lang_code_iso_639_2 = 'nld';
		$nl_be->country_code = 'be';
		$nl_be->wp_locale = 'nl_BE';
		$nl_be->slug = 'nl-be';
		$nl_be->google_code = 'nl';

		$nn = new GP_Locale();
		$nn->english_name = 'Norwegian (Nynorsk)';
		$nn->native_name = 'Norsk nynorsk';
		$nn->lang_code_iso_639_1 = 'nn';
		$nn->lang_code_iso_639_2 = 'nno';
		$nn->country_code = 'no';
		$nn->wp_locale = 'nn_NO';
		$nn->slug = 'nn';
		$nn->facebook_locale = 'nn_NO';

		$no = new GP_Locale();
		$no->english_name = 'Norwegian';
		$no->native_name = 'Norsk';
		$no->lang_code_iso_639_1 = 'no';
		$no->lang_code_iso_639_2 = 'nor';
		$no->country_code = 'no';
		$no->slug = 'no';
		$no->google_code = 'no';

		$oc = new GP_Locale();
		$oc->english_name = 'Occitan';
		$oc->native_name = 'Occitan';
		$oc->lang_code_iso_639_1 = 'oc';
		$oc->lang_code_iso_639_2 = 'oci';
		$oc->slug = 'oc';

		$ory = new GP_Locale();
		$ory->english_name = 'Oriya';
		$ory->native_name = 'ଓଡ଼ିଆ';
		$ory->lang_code_iso_639_1 = 'or';
		$ory->lang_code_iso_639_2 = 'ory';
		$ory->country_code = 'in';
		$ory->wp_locale = 'ory';
		$ory->google_code = 'or';
		$ory->slug = 'ory';

		$os = new GP_Locale();
		$os->english_name = 'Ossetic';
		$os->native_name = 'Ирон';
		$os->lang_code_iso_639_1 = 'os';
		$os->lang_code_iso_639_2 = 'oss';
		$os->wp_locale = 'os';
		$os->slug = 'os';

		$pa = new GP_Locale();
		$pa->english_name = 'Punjabi';
		$pa->native_name = 'ਪੰਜਾਬੀ';
		$pa->lang_code_iso_639_1 = 'pa';
		$pa->lang_code_iso_639_2 = 'pan';
		$pa->country_code = 'in';
		$pa->wp_locale = 'pa_IN';
		$pa->slug = 'pa';
		$pa->facebook_locale = 'pa_IN';

		$pl = new GP_Locale();
		$pl->english_name = 'Polish';
		$pl->native_name = 'Polski';
		$pl->lang_code_iso_639_1 = 'pl';
		$pl->lang_code_iso_639_2 = 'pol';
		$pl->country_code = 'pl';
		$pl->wp_locale = 'pl_PL';
		$pl->slug = 'pl';
		$pl->google_code = 'pl';
		$pl->facebook_locale = 'pl_PL';
		$pl->nplurals = 3;
		$pl->plural_expression = '(n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2)';


		$pt_br = new GP_Locale();
		$pt_br->english_name = 'Portuguese (Brazil)';
		$pt_br->native_name = 'Português do Brasil';
		$pt_br->lang_code_iso_639_1 = 'pt';
		$pt_br->lang_code_iso_639_2 = 'por';
		$pt_br->country_code = 'br';
		$pt_br->wp_locale = 'pt_BR';
		$pt_br->slug = 'pt-br';
		$pt_br->google_code = 'pt-PT';
		$pt_br->facebook_locale = 'pt_BR';
		$pt_br->nplurals = 2;
		$pt_br->plural_expression = '(n > 1)';

		$pt = new GP_Locale();
		$pt->english_name = 'Portuguese (Portugal)';
		$pt->native_name = 'Português';
		$pt->lang_code_iso_639_1 = 'pt';
		$pt->country_code = 'pt';
		$pt->wp_locale = 'pt_PT';
		$pt->slug = 'pt';
		$pt->google_code = 'pt-PT';
		$pt->facebook_locale = 'pt_PT';

		$ps = new GP_Locale();
		$ps->english_name = 'Pashto';
		$ps->native_name = 'پښتو';
		$ps->lang_code_iso_639_1 = 'ps';
		$ps->wp_locale = 'ps';
		$ps->slug = 'ps';
		$ps->google_code = 'ps';
		$ps->facebook_locale = 'ps_AF';
		$ps->rtl = true;

		$rhg = new GP_Locale();
		$rhg->english_name = 'Rohingya';
		$rhg->native_name = 'Ruáinga';
		$rhg->lang_code_iso_639_2 = 'rhg';
		$rhg->country_code = 'mm';
		$rhg->wp_locale = 'rhg';
		$rhg->slug = 'rhg';
		$rhg->nplurals = 1;
		$rhg->plural_expression = '0';

		$ro = new GP_Locale();
		$ro->english_name = 'Romanian';
		$ro->native_name = 'Română';
		$ro->lang_code_iso_639_1 = 'ro';
		$ro->lang_code_iso_639_2 = 'ron';
		$ro->country_code = 'ro';
		$ro->wp_locale = 'ro_RO';
		$ro->slug = 'ro';
		$ro->google_code = 'ro';
		$ro->facebook_locale = 'ro_RO';
		$ro->nplurals = 3;
		$ro->plural_expression = '(n==1 ? 0 : (n==0 || (n%100 > 0 && n%100 < 20)) ? 1 : 2)';

		$ru = new GP_Locale();
		$ru->english_name = 'Russian';
		$ru->native_name = 'Русский';
		$ru->lang_code_iso_639_1 = 'ru';
		$ru->lang_code_iso_639_2 = 'rus';
		$ru->country_code = 'ru';
		$ru->wp_locale = 'ru_RU';
		$ru->slug = 'ru';
		$ru->google_code = 'ru';
		$ru->facebook_locale = 'ru_RU';
		$ru->nplurals = 3;
		$ru->plural_expression = '(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2)';

		$ru_ua = new GP_Locale();
		$ru_ua->english_name = 'Russian (Ukraine)';
		$ru_ua->native_name = 'украї́нська мо́ва';
		$ru_ua->lang_code_iso_639_1 = 'ru';
		$ru_ua->lang_code_iso_639_2 = 'rus';
		$ru_ua->country_code = 'ua';
		$ru_ua->wp_locale = 'ru_UA';
		$ru_ua->slug = 'ru-ua';
		$ru_ua->google_code = 'ru';
		$ru_ua->nplurals = 3;
		$ru_ua->plural_expression = '(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2)';

		$rue = new GP_Locale();
		$rue->english_name = 'Rusyn';
		$rue->native_name = 'Русиньскый';
		$rue->lang_code_iso_639_3 = 'rue';
		$rue->wp_locale = 'rue';
		$rue->slug = 'rue';
		$rue->nplurals = 3;
		$rue->plural_expression = '(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2)';

		$rup = new GP_Locale();
		$rup->english_name = 'Aromanian';
		$rup->native_name = 'Armãneashce';
		$rup->lang_code_iso_639_2 = 'rup';
		$rup->lang_code_iso_639_3 = 'rup';
		$rup->country_code = 'mk';
		$rup->wp_locale = 'rup_MK';
		$rup->slug = 'rup';

		$sah = new GP_Locale();
		$sah->english_name = 'Sakha';
		$sah->native_name = 'Сахалыы';
		$sah->lang_code_iso_639_2 = 'sah';
		$sah->lang_code_iso_639_3 = 'sah';
		$sah->country_code = 'ru';
		$sah->wp_locale = 'sah';
		$sah->slug = 'sah';

		$sa_in = new GP_Locale();
		$sa_in->english_name = 'Sanskrit';
		$sa_in->native_name = 'भारतम्';
		$sa_in->lang_code_iso_639_2 = 'san';
		$sa_in->lang_code_iso_639_3 = 'san';
		$sa_in->country_code = 'in';
		$sa_in->wp_locale = 'sa_IN';
		$sa_in->slug = 'sa-in';

		$sd = new GP_Locale();
		$sd->english_name = 'Sindhi';
		$sd->native_name = 'سندھ';
		$sd->lang_code_iso_639_1 = 'sd';
		$sd->lang_code_iso_639_2 = 'snd';
		$sd->country_code = 'pk';
		$sd->wp_locale = 'sd_PK';
		$sd->slug = 'sd';
		$sd->google_code = 'sd';

		$si = new GP_Locale();
		$si->english_name = 'Sinhala';
		$si->native_name = 'සිංහල';
		$si->lang_code_iso_639_1 = 'si';
		$si->lang_code_iso_639_2 = 'sin';
		$si->country_code = 'lk';
		$si->wp_locale = 'si_LK';
		$si->slug = 'si';
		$si->google_code = 'si';

		$sk = new GP_Locale();
		$sk->english_name = 'Slovak';
		$sk->native_name = 'Slovenčina';
		$sk->lang_code_iso_639_1 = 'sk';
		$sk->lang_code_iso_639_2 = 'slk';
		$sk->country_code = 'sk';
		$sk->slug = 'sk';
		$sk->wp_locale = 'sk_SK';
		$sk->google_code = 'sk';
		$sk->facebook_locale = 'sk_SK';
		$sk->nplurals = 3;
		$sk->plural_expression = '(n==1) ? 0 : (n>=2 && n<=4) ? 1 : 2';

		$sl = new GP_Locale();
		$sl->english_name = 'Slovenian';
		$sl->native_name = 'Slovenščina';
		$sl->lang_code_iso_639_1 = 'sl';
		$sl->lang_code_iso_639_2 = 'slv';
		$sl->country_code = 'si';
		$sl->wp_locale = 'sl_SI';
		$sl->slug = 'sl';
		$sl->google_code = 'sl';
		$sl->facebook_locale = 'sl_SI';
		$sl->nplurals = 4;
		$sl->plural_expression = '(n%100==1 ? 0 : n%100==2 ? 1 : n%100==3 || n%100==4 ? 2 : 3)';

		$so = new GP_Locale();
		$so->english_name = 'Somali';
		$so->native_name = 'Afsoomaali';
		$so->lang_code_iso_639_1 = 'so';
		$so->lang_code_iso_639_2 = 'som';
		$so->lang_code_iso_639_3 = 'som';
		$so->country_code = 'so';
		$so->wp_locale = 'so_SO';
		$so->slug = 'so';
		$so->google_code = 'so';

		$sq = new GP_Locale();
		$sq->english_name = 'Albanian';
		$sq->native_name = 'Shqip';
		$sq->lang_code_iso_639_1 = 'sq';
		$sq->lang_code_iso_639_2 = 'sqi';
		$sq->wp_locale = 'sq';
		$sq->country_code = 'al';
		$sq->slug = 'sq';
		$sq->google_code = 'sq';
		$sq->facebook_locale = 'sq_AL';

		$sr = new GP_Locale();
		$sr->english_name = 'Serbian';
		$sr->native_name = 'Српски језик';
		$sr->lang_code_iso_639_1 = 'sr';
		$sr->lang_code_iso_639_2 = 'srp';
		$sr->country_code = 'rs';
		$sr->wp_locale = 'sr_RS';
		$sr->slug = 'sr';
		$sr->google_code = 'sr';
		$sr->facebook_locale = 'sr_RS';
		$sr->nplurals = 3;
		$sr->plural_expression = '(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2)';

		$srd = new GP_Locale();
		$srd->english_name = 'Sardinian';
		$srd->native_name = 'Sardu';
		$srd->lang_code_iso_639_1 = 'sc';
		$srd->lang_code_iso_639_2 = 'srd';
		$srd->country_code = 'srd';
		$srd->wp_locale = 'srd';
		$srd->slug = 'srd';

		$su = new GP_Locale();
		$su->english_name = 'Sundanese';
		$su->native_name = 'Basa Sunda';
		$su->lang_code_iso_639_1 = 'su';
		$su->lang_code_iso_639_2 = 'sun';
		$su->country_code = 'id';
		$su->wp_locale = 'su_ID';
		$su->slug = 'su';
		$su->nplurals = 1;
		$su->plural_expression = '0';

		$sv = new GP_Locale();
		$sv->english_name = 'Swedish';
		$sv->native_name = 'Svenska';
		$sv->lang_code_iso_639_1 = 'sv';
		$sv->lang_code_iso_639_2 = 'swe';
		$sv->country_code = 'se';
		$sv->wp_locale = 'sv_SE';
		$sv->slug = 'sv';
		$sv->google_code = 'sv';
		$sv->facebook_locale = 'sv_SE';

		$sw = new GP_Locale();
		$sw->english_name = 'Swahili';
		$sw->native_name = 'Kiswahili';
		$sw->lang_code_iso_639_1 = 'sw';
		$sw->lang_code_iso_639_2 = 'swa';
		$sw->wp_locale = 'sw';
		$sw->slug = 'sw';
		$sw->google_code = 'sw';
		$sw->facebook_locale = 'sw_KE';

		$ta = new GP_Locale();
		$ta->english_name = 'Tamil';
		$ta->native_name = 'தமிழ்';
		$ta->lang_code_iso_639_1 = 'ta';
		$ta->lang_code_iso_639_2 = 'tam';
		$ta->country_code = 'IN';
		$ta->wp_locale = 'ta_IN';
		$ta->slug = 'ta';
		$ta->google_code = 'ta';
		$ta->facebook_locale = 'ta_IN';

		$ta_lk = new GP_Locale();
		$ta_lk->english_name = 'Tamil (Sri Lanka)';
		$ta_lk->native_name = 'தமிழ்';
		$ta_lk->lang_code_iso_639_1 = 'ta';
		$ta_lk->lang_code_iso_639_2 = 'tam';
		$ta_lk->country_code = 'LK';
		$ta_lk->wp_locale = 'ta_LK';
		$ta_lk->slug = 'ta-lk';
		$ta_lk->google_code = 'ta';

		$te = new GP_Locale();
		$te->english_name = 'Telugu';
		$te->native_name = 'తెలుగు';
		$te->lang_code_iso_639_1 = 'te';
		$te->lang_code_iso_639_2 = 'tel';
		$te->wp_locale = 'te';
		$te->slug = 'te';
		$te->google_code = 'te';
		$te->facebook_locale = 'te_IN';

		$tg = new GP_Locale();
		$tg->english_name = 'Tajik';
		$tg->native_name = 'Тоҷикӣ';
		$tg->lang_code_iso_639_1 = 'tg';
		$tg->lang_code_iso_639_2 = 'tgk';
		$tg->wp_locale = 'tg';
		$tg->slug = 'tg';
		$tg->google_code = 'tg';
		$tg->nplurals = 2;
		$tg->plural_expression = 'n != 1;';

		$th = new GP_Locale();
		$th->english_name = 'Thai';
		$th->native_name = 'ไทย';
		$th->lang_code_iso_639_1 = 'th';
		$th->lang_code_iso_639_2 = 'tha';
		$th->wp_locale = 'th';
		$th->slug = 'th';
		$th->google_code = 'th';
		$th->facebook_locale = 'th_TH';
		$th->nplurals = 1;
		$th->plural_expression = '0';

		$tir = new GP_Locale();
		$tir->english_name = 'Tigrinya';
		$tir->native_name = 'ትግርኛ';
		$tir->lang_code_iso_639_1 = 'ti';
		$tir->lang_code_iso_639_2 = 'tir';
		$tir->country_code = 'er';
		$tir->wp_locale = 'tir';
		$tir->slug = 'tir';
		$tir->nplurals = 1;
		$tir->plural_expression = '0';

		$tlh = new GP_Locale();
		$tlh->english_name = 'Klingon';
		$tlh->native_name = 'TlhIngan';
		$tlh->lang_code_iso_639_2 = 'tlh';
		$tlh->slug = 'tlh';
		$tlh->nplurals = 1;
		$tlh->plural_expression = '0';

		$tl = new GP_Locale();
		$tl->english_name = 'Tagalog';
		$tl->native_name = 'Tagalog';
		$tl->lang_code_iso_639_1 = 'tl';
		$tl->lang_code_iso_639_2 = 'tgl';
		$tl->country_code = 'ph';
		$tl->wp_locale = 'tl';
		$tl->slug = 'tl';
		$tl->google_code = 'tl';
		$tl->facebook_locale = 'tl_PH';

		$tr = new GP_Locale();
		$tr->english_name = 'Turkish';
		$tr->native_name = 'Türkçe';
		$tr->lang_code_iso_639_1 = 'tr';
		$tr->lang_code_iso_639_2 = 'tur';
		$tr->country_code = 'tr';
		$tr->wp_locale = 'tr_TR';
		$tr->slug = 'tr';
		$tr->google_code = 'tr';
		$tr->facebook_locale = 'tr_TR';
		$tr->nplurals = 2;
		$tr->plural_expression = '(n > 1)';

		$tt_ru = new GP_Locale();
		$tt_ru->english_name = 'Tatar';
		$tt_ru->native_name = 'Татар теле';
		$tt_ru->lang_code_iso_639_1 = 'tt';
		$tt_ru->lang_code_iso_639_2 = 'tat';
		$tt_ru->country_code = 'tt';
		$tt_ru->wp_locale = 'tt_RU';
		$tt_ru->slug = 'tt';
		$tt_ru->google_code = 'tt';
		$tt_ru->nplurals = 3;
		$tt_ru->plural_expression = '(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2)';

		$tuk = new GP_Locale();
		$tuk->english_name = 'Turkmen';
		$tuk->native_name = 'Türkmençe';
		$tuk->lang_code_iso_639_1 = 'tk';
		$tuk->lang_code_iso_639_2 = 'tuk';
		$tuk->country_code = 'tm';
		$tuk->wp_locale = 'tuk';
		$tuk->slug = 'tuk';
		$tuk->nplurals = 2;
		$tuk->plural_expression = '(n > 1)';

		$tzm = new GP_Locale();
		$tzm->english_name = 'Tamazight (Central Atlas)';
		$tzm->native_name = 'ⵜⴰⵎⴰⵣⵉⵖⵜ';
		$tzm->lang_code_iso_639_2 = 'tzm';
		$tzm->country_code = 'ma';
		$tzm->wp_locale = 'tzm';
		$tzm->slug = 'tzm';
		$tzm->nplurals = 2;
		$tzm->plural_expression = '(n > 1)';

		$udm = new GP_Locale();
		$udm->english_name = 'Udmurt';
		$udm->native_name = 'Удмурт кыл';
		$udm->lang_code_iso_639_2 = 'udm';
		$udm->slug = 'udm';

		$ug = new GP_Locale();
		$ug->english_name = 'Uighur';
		$ug->native_name = 'Uyƣurqə';
		$ug->lang_code_iso_639_1 = 'ug';
		$ug->lang_code_iso_639_2 = 'uig';
		$ug->country_code = 'cn';
		$ug->wp_locale = 'ug_CN';
		$ug->slug = 'ug';
		$ug->google_code = 'ug';

		$uk = new GP_Locale();
		$uk->english_name = 'Ukrainian';
		$uk->native_name = 'Українська';
		$uk->lang_code_iso_639_1 = 'uk';
		$uk->lang_code_iso_639_2 = 'ukr';
		$uk->country_code = 'ua';
		$uk->wp_locale = 'uk';
		$uk->slug = 'uk';
		$uk->google_code = 'uk';
		$uk->facebook_locale = 'uk_UA';
		$uk->nplurals = 3;
		$uk->plural_expression = '(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2)';

		$ur = new GP_Locale();
		$ur->english_name = 'Urdu';
		$ur->native_name = 'اردو';
		$ur->lang_code_iso_639_1 = 'ur';
		$ur->lang_code_iso_639_2 = 'urd';
		$ur->wp_locale = 'ur';
		$ur->slug = 'ur';
		$ur->google_code = 'ur';

		$uz = new GP_Locale();
		$uz->english_name = 'Uzbek';
		$uz->native_name = 'O‘zbekcha';
		$uz->lang_code_iso_639_1 = 'uz';
		$uz->lang_code_iso_639_2 = 'uzb';
		$uz->country_code = 'uz';
		$uz->wp_locale = 'uz_UZ';
		$uz->slug = 'uz';
		$uz->google_code = 'uz';
		$uz->nplurals = 1;
		$uz->plural_expression = '0';

		$vec = new GP_Locale();
		$vec->english_name = 'Venetian';
		$vec->native_name = 'Vèneta';
		$vec->lang_code_iso_639_2 = 'roa';
		$vec->country_code = 'uz';
		$vec->slug = 'vec';

		$vi = new GP_Locale();
		$vi->english_name = 'Vietnamese';
		$vi->native_name = 'Tiếng Việt';
		$vi->lang_code_iso_639_1 = 'vi';
		$vi->lang_code_iso_639_2 = 'vie';
		$vi->country_code = 'vn';
		$vi->wp_locale = 'vi';
		$vi->slug = 'vi';
		$vi->google_code = 'vi';
		$vi->facebook_locale = 'vi_VN';
		$vi->nplurals = 1;
		$vi->plural_expression = '0';

		$wa = new GP_Locale();
		$wa->english_name = 'Walloon';
		$wa->native_name = 'Walon';
		$wa->lang_code_iso_639_1 = 'wa';
		$wa->lang_code_iso_639_2 = 'wln';
		$wa->country_code = 'be';
		$wa->wp_locale = 'wa';
		$wa->slug = 'wa';

		$xmf = new GP_Locale();
		$xmf->english_name = 'Mingrelian';
		$xmf->native_name = 'მარგალური ნინა';
		$xmf->lang_code_iso_639_3 = 'xmf';
		$xmf->country_code = 'ge';
		$xmf->wp_locale = 'xmf';
		$xmf->slug = 'xmf';

		$yi = new GP_Locale();
		$yi->english_name = 'Yiddish';
		$yi->native_name = 'ייִדיש';
		$yi->lang_code_iso_639_1 = 'yi';
		$yi->lang_code_iso_639_2 = 'yid';
		$yi->slug = 'yi';
		$yi->google_code = 'yi';
		$yi->rtl = true;

		$yo = new GP_Locale();
		$yo->english_name = 'Yorùbá';
		$yo->native_name = 'Èdè Yorùbá';
		$yo->lang_code_iso_639_1 = 'yo';
		$yo->lang_code_iso_639_2 = 'yor';
		$yo->slug = 'yo';

		$zh_cn = new GP_Locale();
		$zh_cn->english_name = 'Chinese (China)';
		$zh_cn->native_name = '简体中文';
		$zh_cn->lang_code_iso_639_1 = 'zh';
		$zh_cn->lang_code_iso_639_2 = 'zho';
		$zh_cn->country_code = 'cn';
		$zh_cn->wp_locale = 'zh_CN';
		$zh_cn->slug = 'zh-cn';
		$zh_cn->google_code = 'zh-CN';
		$zh_cn->facebook_locale = 'zh_CN';
		$zh_cn->nplurals = 1;
		$zh_cn->plural_expression = '0';

		$zh_hk = new GP_Locale();
		$zh_hk->english_name = 'Chinese (Hong Kong)';
		$zh_hk->native_name = '香港中文版	';
		$zh_hk->lang_code_iso_639_1 = 'zh';
		$zh_hk->lang_code_iso_639_2 = 'zho';
		$zh_hk->country_code = 'hk';
		$zh_hk->wp_locale = 'zh_HK';
		$zh_hk->slug = 'zh-hk';
		$zh_hk->facebook_locale = 'zh_HK';
		$zh_hk->nplurals = 1;
		$zh_hk->plural_expression = '0';

		$zh_sg = new GP_Locale();
		$zh_sg->english_name = 'Chinese (Singapore)';
		$zh_sg->native_name = '中文';
		$zh_sg->lang_code_iso_639_1 = 'zh';
		$zh_sg->lang_code_iso_639_2 = 'zho';
		$zh_sg->country_code = 'sg';
		$zh_sg->slug = 'zh-sg';
		$zh_sg->nplurals = 1;
		$zh_sg->plural_expression = '0';

		$zh_tw = new GP_Locale();
		$zh_tw->english_name = 'Chinese (Taiwan)';
		$zh_tw->native_name = '繁體中文';
		$zh_tw->lang_code_iso_639_1 = 'zh';
		$zh_tw->lang_code_iso_639_2 = 'zho';
		$zh_tw->country_code = 'tw';
		$zh_tw->slug = 'zh-tw';
		$zh_tw->wp_locale= 'zh_TW';
		$zh_tw->google_code = 'zh-TW';
		$zh_tw->facebook_locale = 'zh_TW';
		$zh_tw->nplurals = 1;
		$zh_tw->plural_expression = '0';

		$zh = new GP_Locale();
		$zh->english_name = 'Chinese';
		$zh->native_name = '中文';
		$zh->lang_code_iso_639_1 = 'zh';
		$zh->lang_code_iso_639_2 = 'zho';
		$zh->slug = 'zh';
		$zh->nplurals = 1;
		$zh->plural_expression = '0';

		foreach( get_defined_vars() as $locale ) {
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
		return isset( $instance->locales[ $slug ] )? $instance->locales[ $slug ] : null;
	}

	public static function by_field( $field_name, $field_value ) {
		$instance = GP_Locales::instance();
		$result   = false;

		foreach( $instance->locales() as $locale ) {
			if ( isset( $locale->$field_name ) && $locale->$field_name == $field_value ) {
				$result = $locale;
				break;
			}
		}

		return $result;
	}
}
