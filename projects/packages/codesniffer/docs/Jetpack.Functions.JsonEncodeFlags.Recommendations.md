# Recommended flags for `json_encode`

The default flags for [json_encode] escape slashes in an attempt to avoid injection of a `</script>` tag when the JSON blob is being output within `<script>...</script>`.
This is inadequate, as it doesn't protect against other problematic sequences such as `<!--<script>`.
It's also not sufficient when combined with WordPress's `esc_attr()` for use in attribute data.

`json_encode` has several other flags controlling escaping.
The correct set of flags depends on the context where the JSON blob will be output.

> [!TIP]
> **TL;DR:** In most cases, `JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP` will be safe, although possibly not optimal.

## Escaping flags

* [`JSON_UNESCAPED_SLASHES`](https://www.php.net/manual/en/json.constants.php#constant.json-unescaped-slashes): Turns off escaping of `/`.
* [`JSON_HEX_TAG`](https://www.php.net/manual/en/json.constants.php#constant.json-hex-tag): Escapes `<` and `>` as `\u003C` and `\u003E`.
* [`JSON_HEX_AMP`](https://www.php.net/manual/en/json.constants.php#constant.json-hex-amp): Escapes `&` as `\u0026`.
* [`JSON_HEX_QUOT`](https://www.php.net/manual/en/json.constants.php#constant.json-hex-quot): Escapes `"` as `\u0022`.
* [`JSON_HEX_APOS`](https://www.php.net/manual/en/json.constants.php#constant.json-hex-apos): Escapes `'` as `\u0027`.
* [`JSON_UNESCAPED_UNICODE`](https://www.php.net/manual/en/json.constants.php#constant.json-unescaped-unicode): Turns off escaping of most multibyte UTF-8 characters.
* [`JSON_UNESCAPED_LINE_TERMINATORS`](https://www.php.net/manual/en/json.constants.php#constant.json-unescaped-line-terminators): With `JSON_UNESCAPED_UNICODE`, turns off escaping of U+2028 LINE SEPARATOR and U+2029 PARAGRAPH SEPARATOR.

`json_encode` has many other flags, but they don't control escaping and so aren't considered here.

## General recommendations

* `JSON_UNESCAPED_SLASHES` should almost always be used, in combination with `JSON_HEX_TAG` and/or `JSON_HEX_AMP` as needed. The `/` character is seldom problematic on its own, only in sequences like `</` which are just as well handled by `JSON_HEX_TAG`.
* `JSON_HEX_TAG` and `JSON_HEX_AMP` should be used whenever the context is likely to get confused by `<`, `>`, or `&` characters.
* `JSON_HEX_APOS` should be used whenever the context is likely to get confused by `'` characters. Note this is fairly rare, as higher-level context-specific escaping should normally handle these.
* `JSON_HEX_QUOT` is seldom useful, as JSON output will always contain `"` to quote the strings.
* `JSON_UNESCAPED_UNICODE` should be used whenever you know the consumer will interpret the document as UTF-8. Do not use it if you aren't sure about this.
  * In a WordPress environment, this likely means checking for `get_option( 'blog_charset' ) === 'UTF-8'` or the like.
* `JSON_UNESCAPED_LINE_TERMINATORS` should in theory be ok along with `JSON_UNESCAPED_UNICODE` as long as you're not needing to support pre-ES2019 browsers. On the other hand, the affected characters are so rare that allowing them to appear as `\u2028` and `\u2029` may be worth not worrying about this flag.

## Recommendations for specific contexts

### In `<script>` tags

**TL;DR:** `JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP`

Script tags will be confused by some sequences involving `<` and `>`, so `JSON_HEX_TAG` must always be used. Once those are escaped, `/` is unproblematic so `JSON_UNESCAPED_SLASHES` should always be used as well.

`JSON_HEX_AMP` is only needed if there's a possibility that the document will be interpreted as XHTML[^1] and that `//<![CDATA[` and `//]]>` won't be used to wrap the contents of the `<script>` tag. If you're sure that the document will always be interpreted as HTML rather than XHTML, or that `<script>` tags in an XHTML context will always have `//<![CDATA[` and `//]]>` wrapping the contents, you can omit it.

`JSON_UNESCAPED_UNICODE` may be used if you're sure the document will be interpreted as UTF-8, e.g. via `<meta charset="utf-8">` or an appropriate `Content-Type` header.

### In tag attributes

Examples:
```html
<span data-settings='{"this-is-json":true}'>
<a onclick='someFunction( {"this-is-json":true} )'>
```

**TL;DR:** `JSON_UNESCAPED_SLASHES | JSON_HEX_AMP` with `esc_attr()`, `JSON_UNESCAPED_SLASHES` with `htmlspecialchars()`.

When outputting JSON into a tag attribute, you should always wrap the `json_encode()` in an HTML escaping function such as `htmlspecialchars()` or WordPress's `esc_attr()`.
Slashes are not problematic, so `JSON_UNESCAPED_SLASHES` should always be used. The escaping function will handle any `<`, `>`, `"`, and `'` characters, so `JSON_HEX_TAG`, `JSON_HEX_QUOT`, and `JSON_HEX_APOS` are not necessary either.

As for `JSON_HEX_AMP`, it depends on your escaping function. A proper function such as `htmlspecialchars()` or `filter_var( ..., FILTER_SANITIZE_SPECIAL_CHARS )` will encode `&` as `&amp;`. WordPress's `esc_attr()`, on the other hand, tries to be smart and won't double-encode entities, which is liable to break the JSON data if it contains any, so `JSON_HEX_AMP` should be used in this context.

If you'd rather rely on `json_encode()` without any HTML escaping function, you should be ok using `JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS` and making sure to use single-quotes rather than double-quotes to quote the attribute (i.e. `<span data-settings='...'>` rather than `<span data-settings="...">`). This combination of flags will avoid the JSON output containing any `<`, `>`, `&`, or `'` characters, and use of single-quotes for quoting the attribute will make `"` unproblematic.

`JSON_UNESCAPED_UNICODE` may be used if you're sure the document will be interpreted as UTF-8, e.g. via `<meta charset="utf-8">` or an appropriate `Content-Type` header.

### Writing to files or database fields

**TL;DR:** `JSON_UNESCAPED_SLASHES`

When writing JSON to files, you should generally be ok to use `JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE`. But if there's a chance that a client might incorrectly interpret the file in a non-UTF-8 encoding, `JSON_UNESCAPED_SLASHES` (without unescaped Unicode) may be safer.

When writing to MariaDB or MySQL database fields, `JSON_UNESCAPED_SLASHES` is the safe choice. You may add `JSON_UNESCAPED_UNICODE` if you're sure that the database connection is using UTF-8, the database field is utf8mb4 (not just utf8!) or binary, and anything else reading the field is also going to be interpreting it as UTF-8. Note that `JSON_HEX_APOS` is never necessary for inserting JSON data into MariaDB or MySQL! If you think it is, that probably means that you're not correctly escaping the data you're sending to the database when building your queries and you should resolve that ASAP.

### APIs accepting JSON post data

**TL;DR:** `JSON_UNESCAPED_SLASHES`

An API accepting JSON data should not need any special escaping. In general it *should* be safe to also use `JSON_UNESCAPED_UNICODE`, as content type `application/json` is supposed to always be a Unicode encoding such as UTF-8, but as servers may be misconfigured it may be best to avoid the flag if you're not sure.

### APIs returning JSON data

**TL;DR:** `JSON_UNESCAPED_SLASHES` in a good framework, `JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP` if you're not being careful to set the correct HTTP Content-Type header.

An API client shouldn't need any special escaping either. In general it *should* be safe to also use `JSON_UNESCAPED_UNICODE`, as content type `application/json` is supposed to always be a Unicode encoding such as UTF-8, but as clients may be misconfigured it may be best to avoid the flag if you can't mandate they do it correctly.

This also applies to mocked responses in unit tests: `JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE` should be safe.

Note that, if your API framework might not set the correct Content-Type header with the HTTP response, you may want to use `JSON_HEX_TAG | JSON_HEX_AMP` in case the response might be interpreted as `text/html`.

### Cloning

**TL;DR:** `$cloned_data = json_decode( json_encode( $data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) );`

If you're using `json_decode( json_encode() )` to deep-clone a data structure and/or clean up objects-versus-associative-arrays, you may as well turn off as much escaping as possible to save a few nanoseconds.

[json_encode]: https://www.php.net/json_encode
[^1]: Developers working in a WordPress environment might check the progress on https://core.trac.wordpress.org/ticket/59883.
