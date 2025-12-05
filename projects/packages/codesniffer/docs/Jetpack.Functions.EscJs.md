## Jetpack.Functions.EscJs

Flag calls to WordPress's `esc_js` function. This is a legacy of time before PHP 5.2 added `json_encode`.

The intended use of `esc_js` was in tag attributes, for example
```html
<span onclick="doSomething( '<?php echo esc_js( $string ); ?>' )">
```
Compared to `esc_attr()`, it does `stripslashes()`, replaces any `&#39;` or `&#x27;` in the input with `'`, strips carriage returns (`\r`), does `addslashes()`, and then encodes newlines as `\n`. Therefore, it will tend to unexpectedly remove backslashes and may get entities wrong.

A less surprising replacement in modern PHP would be
```html
<span onclick="doSomething( <?php echo esc_attr( wp_json_encode( $string, JSON_UNESCAPED_SLASHES | JSON_HEX_AMP ) ); ?> )">
```
or
```html
<span onclick="doSomething( <?php echo htmlspecialchars( wp_json_encode( $string, JSON_UNESCAPED_SLASHES ) ); ?> )">
```

Uses in other contexts, such as within `<script>` tags, are even less likely to be correct as they'll apply HTML entity encoding where it won't be interpreted by HTML parsing.

### Messages

* `Found`: `esc_js()` should not be used, it is obsolete and somewhat misleading. Prefer `esc_attr()` and/or `wp_json_encode()` instead.

### Configuration

This sniff has no configuration options.
