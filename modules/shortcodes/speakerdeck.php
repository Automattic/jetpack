<?php

/**
 * Speakerdeck oEmbed
 *
 * @see https://speakerdeck.com/faq#oembed
 * To use, just paste a Speakerdeck URL in a post or page, on a line by itself.
 *
 * @module shortcodes
 *
 * @since 3.9.0
 */
wp_oembed_add_provider('#https?://(www\.)?speakerdeck.com/*#','http://speakerdeck.com/oembed.json?url=/',true);
