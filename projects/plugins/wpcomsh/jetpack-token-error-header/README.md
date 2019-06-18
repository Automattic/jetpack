# Jetpack Token Error Header

Logs Jetpack token errors as response headers like "X-Jetpack-Signature-Error" by hooking `jetpack_verify_signature_error` to get the `WP_Error` object.

- `X-Jetpack-Signature-Error` - the error code
- `X-Jetpack-Signature-Error-Message` - the error message
- `X-Jetpack-Signature-Error-Details` - a base64-encoded JSON blob of request and signature details

See https://github.com/Automattic/jetpack/pull/12657 for more details on this hook.

# Securing the headers

**This plugin requires that $_SERVER['UNSAFELY_REPORT_JETPACK_TOKEN_STATUS'] is set to a truthy value before it does anything**

It is recommended to only set this value for inbound requests coming from a WordPress.com IP range.

This will ensure that the X-Forwarded-For header is respected for trusted local proxies. Therefore, the plugin will only set the header if the request is truly coming from WordPress.com.
