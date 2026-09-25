<?php
/**
 * Inline SVG icons for the Write editor.
 *
 * The editor renders its own icons rather than pulling in an icon font or a
 * JS icon library: the toolbar is server-rendered and the stylesheet is served
 * unbuilt, so there is no bundle to hang an icon package off.
 *
 * Every path draws with `currentColor`, so an icon takes the `color` of the
 * button containing it and inherits its hover, active and disabled states for
 * free. Do not reintroduce hardcoded fills here.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Print an inline SVG icon.
 *
 * @param string $name Icon name, one of the keys in the map below.
 * @return void
 */
function wpcom_write_icon( $name ) {
	static $icons = array(
		'undo'          => '<path d="m18.3 11.7c-.6-.6-1.4-.9-2.3-.9h-9.3l2.9-3.3-1.1-1-4.5 5 4.5 4.5 1-1-2.7-2.7h9.2c.5 0 .9.2 1.3.5 1 1 1 3.4 1 4.5v.3h1.5v-.2c0-1.5 0-4.3-1.5-5.7z" fill="currentColor"/>',
		'redo'          => '<path d="m15.3 6-1.1 1 2.9 3.3h-9.4c-.9 0-1.7.3-2.3.9-1.4 1.5-1.4 4.2-1.4 5.6v.2h1.5v-.3c0-1.1 0-3.5 1-4.5.3-.3.7-.5 1.3-.5h9.2l-2.8 2.8 1.1 1.1 4.6-4.6z" fill="currentColor"/>',
		'chevron-down'  => '<path d="m8 11 4 4 4-4" stroke="currentColor" stroke-width="1.25"/>',
		'bold'          => '<path d="m14.7 11.3004c1-.6 1.5-1.60001 1.5-3.00001 0-2.3-1.3-3.4-4-3.4h-5.2v14.00001h5.8c1.4 0 2.5-.3 3.3-1s1.2-1.7 1.2-2.9c.1-1.9-.8-3.1-2.6-3.7zm-5.1-4.00001h2.3c.6 0 1.1.1 1.4.4s.5.7.5 1.2-.2 1-.5 1.20001c-.3.3-.8.4-1.4.4h-2.3zm4.6 9.00001c-.4.3-1 .4-1.7.4h-2.9v-3.9h2.9c.7 0 1.3.2 1.7.5s.6.8.6 1.5-.2 1.2-.6 1.5z" fill="currentColor"/>',
		'italic'        => '<path d="m12.5 5-2.5 14h1.9l2.5-14z" fill="currentColor"/>',
		'underline'     => '<path d="m7 18v1h10v-1zm5-2c1.5 0 2.6-.4 3.4-1.2s1.1-2 1.1-3.5v-6.3h-1.5v5.8c0 1.2-.2 2.1-.6 2.8s-1.2 1-2.4 1-2-.3-2.4-1-.6-1.6-.6-2.8v-5.8h-1.5v6.2c0 1.5.4 2.7 1.1 3.5.8.9 1.9 1.3 3.4 1.3z" fill="currentColor"/>',
		'strikethrough' => '<path d="m9.1 9v-.5c0-.6.2-1.1.7-1.4s1.2-.5 2-.5c.7 0 1.4.1 2.1.3s1.4.5 2.1.9l.2-1.9c-.6-.3-1.2-.5-1.9-.7-.8-.1-1.6-.2-2.4-.2-1.5 0-2.7.3-3.6 1-.8.7-1.2 1.5-1.2 2.6v.4zm10.9 3h-16v1h8.3c.3.1.6.2.8.3.5.2.9.5 1.1.8.3.3.4.7.4 1.2 0 .7-.2 1.1-.8 1.5-.5.3-1.2.5-2.1.5-.8 0-1.6-.1-2.4-.3s-1.5-.5-2.2-.8l-.1 1.9c.5.2 1.2.4 2 .6s1.6.3 2.4.3c1.7 0 3-.3 3.9-1s1.3-1.6 1.3-2.8c0-.9-.2-1.7-.7-2.2h4.1z" fill="currentColor"/>',
		'text-color'    => '<path d="m17.2 10.9c-.5-1-1.2-2.1-2.1-3.2-.6-.9-1.3-1.7-2.1-2.6l-1-1.1-1 1.1c-.6.9-1.3 1.7-2 2.6-.8 1.2-1.5 2.3-2 3.2-.6 1.2-1 2.2-1 3 0 3.4 2.7 6.1 6.1 6.1s6.1-2.7 6.1-6.1c0-.8-.3-1.8-1-3zm-5.1 7.6c-2.5 0-4.6-2.1-4.6-4.6 0-.3.1-1 .8-2.3.5-.9 1.1-1.9 2-3.1.7-.9 1.3-1.7 1.8-2.3.7.8 1.3 1.6 1.8 2.3.8 1.1 1.5 2.2 2 3.1.7 1.3.8 2 .8 2.3 0 2.5-2.1 4.6-4.6 4.6z" fill="currentColor"/>',
		'align-left'    => '<path d="m13 5.5h-9v-1.5h9zm7 7h-16v-1.5h16zm-7 7h-9v-1.5h9z" fill="currentColor"/>',
		'align-center'  => '<path d="m7.5 5.5h9v-1.5h-9zm-3.5 7h16v-1.5h-16zm3.5 7h9v-1.5h-9z" fill="currentColor"/>',
		'align-right'   => '<path d="m11.111 5.5h8.889v-1.5h-8.889zm-7.111 7h16v-1.5h-16zm7.111 7h8.889v-1.5h-8.889z" fill="currentColor"/>',
		'align-justify' => '<path d="m4 12.8008h16v-1.5h-16zm0 7h12.4v-1.5h-12.4zm0-15.50002v1.5h16v-1.5z" fill="currentColor"/>',
		'list-bullets'  => '<path d="m11.1 15.8h8.9v-1.5h-8.9zm0-8.6v1.5h8.9v-1.5zm-5.1 5.8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-7c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill="currentColor"/>',
		'list-numbered' => '<path d="m11.1 15.8008h8.9v-1.5h-8.9zm0-8.60002v1.5h8.9v-1.5zm-6.1-.5v3.30002h1v-4.70002l-2.2.7.4 1zm-.4 5.70002c-.3.1-.5.2-.7.3l.1 1.1c.2-.2.5-.4.8-.5s.6 0 .7.1c.2.3 0 .8-.2 1.1-.5.8-.9 1.6-1.4 2.5h2.7v-1h-1c.3-.6.8-1.4.9-2.1.1-.3 0-.8-.2-1.1-.5-.6-1.3-.5-1.7-.4z" fill="currentColor"/>',
		'link'          => '<path d="m10 17.389h-1.556c-1.37767 0-2.69891-.5473-3.67307-1.5214-.97415-.9742-1.52143-2.2954-1.52143-3.6731s.54728-2.69891 1.52143-3.67307c.97416-.97415 2.2954-1.52143 3.67307-1.52143h1.556v1.5h-1.556c-.97984 0-1.91955.38924-2.61241 1.08209-.69285.69281-1.08209 1.63261-1.08209 2.61241s.38924 1.9196 1.08209 2.6124c.69286.6929 1.63257 1.0821 2.61241 1.0821h1.556zm4-10.389h1.556c1.3778 0 2.6992.54733 3.6734 1.52158.9743.97425 1.5216 2.29562 1.5216 3.67342s-.5473 2.6992-1.5216 3.6734c-.9742.9743-2.2956 1.5216-3.6734 1.5216h-1.556v-1.5h1.556c.98 0 1.9198-.3893 2.6128-1.0822.6929-.693 1.0822-1.6328 1.0822-2.6128s-.3893-1.9198-1.0822-2.61276c-.693-.69295-1.6328-1.08224-2.6128-1.08224h-1.556zm-4.5 6h5v-1.5h-5z" fill="currentColor"/>',
		'quote'         => '<path d="m13 6v6h5.2v4c0 .8-.2 1.4-.5 1.7-.6.6-1.6.6-2.5.5h-.3v1.5h.5c1 0 2.3-.1 3.3-1 .6-.6 1-1.6 1-2.8v-9.9zm-9 6h5.2v4c0 .8-.2 1.4-.5 1.7-.6.6-1.6.6-2.5.5h-.3v1.5h.5c1 0 2.3-.1 3.3-1 .6-.6 1-1.6 1-2.8v-9.9h-6.7z" fill="currentColor"/>',
		'image'         => '<path d="m19 3h-14c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-14c0-1.1-.9-2-2-2zm-14 1.5h14c.3 0 .5.2.5.5v8.4l-3-2.9c-.3-.3-.8-.3-1 0l-3.6 3.5-2.9-2c-.3-.2-.6-.2-.8 0l-3.6 2.6v-9.6c-.1-.3.1-.5.4-.5zm14 15h-14c-.3 0-.5-.2-.5-.5v-2.4l4.1-3 3 1.9c.3.2.7.2.9-.1l3.5-3.4 3.5 3.4v3.6c0 .3-.2.5-.5.5z" fill="currentColor"/>',
		'back'          => '<path d="m20 11.2h-13.19998l3.69998-3.7-.99998-1-5.6 5.5 5.6 5.5.99998-1-3.69998-3.7h13.19998z" fill="currentColor"/>',
		'kebab'         => '<path d="m13 19h-2v-2h2zm0-6h-2v-2h2zm0-6h-2v-2h2z" fill="currentColor"/>',
	);

	if ( ! isset( $icons[ $name ] ) ) {
		return;
	}

	printf(
		'<svg class="bw-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">%s</svg>',
		$icons[ $name ] // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Static, self-authored SVG markup from the map above.
	);
}
