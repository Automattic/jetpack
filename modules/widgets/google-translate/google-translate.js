/*global google:true*/
/*global _wp_google_translate_widget:true*/
/*exported googleTranslateElementInit*/
function googleTranslateElementInit() {
	var lang = 'en';
	var langParam;
	var langRegex = /[?&#]lang=([a-z]+)/;
	if ( typeof _wp_google_translate_widget === 'object' && typeof _wp_google_translate_widget.lang === 'string' ) {
		lang = _wp_google_translate_widget.lang;
	}
	langParam = window.location.href.match( langRegex );
	if ( langParam ) {
		window.location.href = window.location.href.replace( langRegex, '' ).replace( /#googtrans\([a-zA-Z|]+\)/, '' ) + '#googtrans(' + lang + '|' + langParam[ 1 ] + ')';
	}
	new google.translate.TranslateElement( {
		pageLanguage: lang,
		layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
		autoDisplay: false
	}, 'google_translate_element' );
}
