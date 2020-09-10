<?php

// Add Loom.com as an oEmbed provider.
wp_oembed_add_provider( '#https?://(www\.)?loom\.com/share/.*#i', 'https://www.loom.com/v1/oembed', true );
