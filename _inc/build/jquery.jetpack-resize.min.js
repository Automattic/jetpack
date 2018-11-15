/* Do not modify this file directly. It is compiled from other files. */
/* global Jetpack, JSON */
/**
 * Resizeable Iframes.
 *
 * Start listening to resize postMessage events for selected iframes:
 * $( selector ).Jetpack( 'resizeable' );
 * - OR -
 * Jetpack.resizeable( 'on', context );
 *
 * Resize selected iframes:
 * $( selector ).Jetpack( 'resizeable', 'resize', { width: 100, height: 200 } );
 * - OR -
 * Jetpack.resizeable( 'resize', { width: 100, height: 200 }, context );
 *
 * Stop listening to resize postMessage events for selected iframes:
 * $( selector ).Jetpack( 'resizeable', 'off' );
 * - OR -
 * Jetpack.resizeable( 'off', context );
 *
 * Stop listening to all resize postMessage events:
 * Jetpack.resizeable( 'off' );
 */
!function(e){var t,a,i,r,n=!1,o=[],s=!1;if(void 0===window.Jetpack&&(window.Jetpack={getTarget:function(t){return this instanceof jQuery?t?this.filter(t):this:t?e(t):t}}),void 0===e.fn.Jetpack&&(e.fn.Jetpack=function(t){if("function"==typeof Jetpack[t])return Jetpack[t].apply(this,Array.prototype.slice.call(arguments,1));e.error('Namespace "'+t+'" does not exist on jQuery.Jetpack')}),"function"!=typeof window.postMessage)return void e.extend(window.Jetpack,{resizeable:function(){e.error("Browser does not support window.postMessage")}});t=function(e){return e.match(/^https?:\/\//)||(e=document.location.href),e.split("/").slice(0,3).join("/")},a=function(){n=!0,e(window).on("message.JetpackResizeableIframe",function(t){var a,i=t.originalEvent;if(-1!==e.inArray(i.origin,o)){if("object"==typeof i.data)a=i.data.data;else try{a=JSON.parse(i.data)}catch(e){a=!1}a.data&&(a=a.data,void 0!==a.action&&"resize"===a.action&&s.filter(function(){return void 0!==a.name?this.name===a.name:i.source===this.contentWindow}).first().Jetpack("resizeable","resize",a))}})},i=function(){n=!1,e(window).off("message.JetpackResizeableIframe"),o=[],e(".jetpack-resizeable").removeClass("jetpack-resizeable"),s=!1},r={on:function(i){var r=Jetpack.getTarget.call(this,i);return n||a(),r.each(function(){o.push(t(e(this).attr("src")))}).addClass("jetpack-resizeable"),s=e(".jetpack-resizeable"),r},off:function(a){var r=Jetpack.getTarget.call(this,a);return void 0===r?(i(),r):(r.each(function(){var a=t(e(this).attr("src")),i=e.inArray(a,o);-1!==i&&o.splice(i,1)}).removeClass("jetpack-resizeable"),s=e(".jetpack-resizeable"),r)},resize:function(t,a){var i=Jetpack.getTarget.call(this,a);return e.each(["width","height"],function(e,a){var r,n=0;void 0!==t[a]&&(n=parseInt(t[a],10)),0!==n&&(i[a](n),r=i.parent(),r.hasClass("slim-likes-widget")&&r[a](n))}),i}},e.extend(window.Jetpack,{resizeable:function(t){return r[t]?r[t].apply(this,Array.prototype.slice.call(arguments,1)):t?void e.error("Method "+t+" does not exist on Jetpack.resizeable"):r.on.apply(this)}})}(jQuery);