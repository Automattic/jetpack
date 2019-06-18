# Jetpack Token Error Header

Logs Jetpack token errors as response headers like "X-Jetpack-Signature-Error".

- `X-Jetpack-Signature-Error` - the error code
- `X-Jetpack-Signature-Error-Message` - the error message
- `X-Jetpack-Signature-Error-Details` - a base64-encoded JSON blob of request and signature details

It does this by hooking `jetpack_verify_signature_error` to get the `WP_Error` object.

See https://github.com/Automattic/jetpack/pull/12657 for more details on this hook. Until that PR is merged, this plugin depends on using that Jetpack branch in order to work.

**WARNING**: Do not deploy on sites which return this header willy-nilly. It could be used by malicious folks to reduce the problem space required to craft an attack on a Jetpack site.

# Securing the headers

**This plugin requires that $_SERVER['UNSAFELY_REPORT_JETPACK_TOKEN_STATUS'] is set to a truthy value before it does anything**

It is recommended that you configure your web server to only set this value for inbound requests coming from a WordPress.com IP range.

For nginx, this might look like adding the following before your `server {}` directive for the site:

```
geo $wpcom_ips {
        default 0;
        proxy   192.168.50.1; # my VVV box has this IP for the nginx reverse proxy
        192.0.78.17     1; # a WPCOM IP
        192.0.78.9      1; # another WPCOM IP
        192.0.92.162    1; # goldsounds sandbox
}

server {
	# ... stuff ...
}
```

... and adding the following line to /etc/nginx/fastcgi_params:

```nginx
fastcgi_param   UNSAFELY_REPORT_JETPACK_TOKEN_STATUS    $wpcom_ips;
```

This will ensure that the X-Forwarded-For header is respected for trusted local proxies. Therefore, the plugin will only set the header if the request is truly coming from WordPress.com.

# Dependencies

Depends on a Jetpack build which includes https://github.com/Automattic/jetpack/pull/12657

Also, try D29550-code on the server to log this information to logstash

Sample logstash dashboard is here: https://logstash.a8c.com/kibana6/goto/5707fb86ef08d6ac21d19e46e18e554b
