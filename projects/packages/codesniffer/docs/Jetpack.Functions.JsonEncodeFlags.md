## Jetpack.Functions.JsonEncodeFlags

Flag calls to [json_encode] that don't pass a `$flags` parameter or that set it
to 0.

Functions checked by default are:
* `json_encode`
* `wp_json_encode`
* `wp_send_json`
* `wp_send_json_success`
* `wp_send_json_error`

### Messages

* `Missing`: Passing the `$flags` parameter to `%s()` is strongly recommended, as the default value is often insecure. See %s for recommendations.
* `ZeroFound`: Passing 0 for the `$flags` parameter to `%s()` is strongly discouraged, as the default value is often insecure. See %s for recommendations.

### Configuration

```xml
<rule ref="Jetpack.Functions.JsonEncodeFlags">
	<properties>
		<property name="help_link" value="some-path-or-url" />
		<property name="json_encode_functions" type="array">
			<element key="my_json_encode" value="2" />
			<element key="wp_send_json_success" value="0" />
		</property>
	</properties>
</rule>
```

* `help_link`: `string`, optional. If you'd rather the rule reference documentation of your own for recommendations instead of [the included document](./Jetpack.Functions.JsonEncodeFlags.Recommendations.md), set the appropriate path or URL here.
* `json_encode_functions`: `array<string,int>`, optional. Override the fuctions to check. Key is the function name, value is the one-based index of the `$flags` parameter. Value 0 disables checking a function.

[json_encode]: https://www.php.net/json_encode
