# Jetpack Token Error Header

Logs Jetpack token errors as response headers like "X-Jetpack-Signature-Error" by hooking `jetpack_verify_signature_error` to get the `WP_Error` object.

- `X-Jetpack-Signature-Error` - the error code
- `X-Jetpack-Signature-Error-Message` - the error message
- `X-Jetpack-Signature-Error-Details` - a base64-encoded JSON blob of request and signature details

See https://github.com/Automattic/jetpack/pull/12657 for more details on this hook.

