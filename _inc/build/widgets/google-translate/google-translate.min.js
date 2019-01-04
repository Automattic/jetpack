/* Do not modify this file directly. It is compiled from other files. */
/*global google:true*/
/*global _wp_google_translate_widget:true*/
/*exported googleTranslateElementInit*/
function googleTranslateElementInit(){var e,a="en",t=/[?&#]lang=([a-zA-Z\-_]+)/;"object"==typeof _wp_google_translate_widget&&"string"==typeof _wp_google_translate_widget.lang&&(a=_wp_google_translate_widget.lang),(e=window.location.href.match(t))&&(window.location.href=window.location.href.replace(t,"").replace(/#googtrans\([a-zA-Z\-_|]+\)/,"")+"#googtrans("+a+"|"+e[1]+")"),new google.translate.TranslateElement({pageLanguage:a,layout:_wp_google_translate_widget.layout,autoDisplay:!1},"google_translate_element")}