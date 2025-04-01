## Jetpack.Functions.I18n

This sniff augments `WordPress.WP.I18n` by checking text domains passed to some additional functions.

* `wp_set_script_translations()`
* `Automattic\Jetpack\Assets::register_script()`

If a single value (as a string or a single-element array) is configured for `text_domain`, this sniff can auto-fix.

### Messages

* `DomainDefault`: Missing domain arg. If this text string is supposed to use a WP Core translation, use the "default" text domain.
* `DomainNotLiteral`: Domain is not a string literal.
* `InterpolatedVariable`: The domain must not contain interpolated variables. Found %s.
* `MissingDomain`: Missing domain arg.
* `TextDomainMismatch`: Mismatched text domain. Expected '%s' but got '%s'.

### Configuration

```xml
<rule ref="Jetpack.Functions.I18n">
	<properties>
		<property name="text_domain" value="the text domain" />
	</properties>
</rule>
```

* `text_domain`: `string|string[]`, required. This specifies the text domains that are allowed to be passed to the functions.
