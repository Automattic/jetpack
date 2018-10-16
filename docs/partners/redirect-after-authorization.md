# Controlling the Redirect After Users Authorize on WordPress.com

Provisioning a plan for a given site is usually a two-step process:

1) The partner host must call our API, by running a script or calling the API directly
2) The user must authorize a connection between WordPress.com and their site (**This step is not necessary when the site is already connected**)

After the user authorizes the connection, the default behavior is for the user to be redirected back to the `wp-admin` of their site via a Jetpack SSO login URL, which may not be ideal for all hosting partners. To address that potential issue, hosting partners are able to control where users are redirected after they finish authorizing on WordPress.com.

## Controlling the redirect

After provisioning a site via the Jetpack partners API, hosting partners will receive a response that contains `next_url` and `auth_required` values. When `auth_required` is `true`, the `next_url` value is either a URL that allows the user to authorize the connection between WordPress.com and the site. When `auth_required` is `false`, the `next_url` value is a link back to the user's site.

To change the default redirect behavior, hosts will want to append `&partner_redirect=http%3A%2F%2Fexample.com`, where `http%3A%2F%2Fexample.com` is a URL encoded URL, to the end of `next_url` when `auth_required` is `true`.

The `partner_redirect` value will be validated on WordPress.com against a whitelist, and assuming the redirect is valid, the user will be redirected to `partner_redirect` after authorization.

**Note:** Because redirects are validated against a whitelist, please be sure to get in touch with us about whitelisting your redirect if you'd like to change the default redirect behavior after authorization.

## Example

Here is an example in NodeJS, using the request module, which will print the `next_url` value after adding the `&partner_redirect=` value when `auth_required` is `true`.

```js
var request = require( 'request' );
var accessToken = 'access_token_here';
var plan = 'plan_here';
var siteurl = 'http://example.com';
var local_user = 'username_id_or_email_here';

var options = {
    method: 'POST',
    url: 'https://public-api.wordpress.com/rest/v1.3/jpphp/provision',
    headers: {
        'cache-control': 'no-cache',
        authorization: 'Bearer ' + accessToken,
    },
    formData: {
        plan: plan,
        siteurl: siteurl,
        local_user: local_user
    }
};

request( options, function ( error, response, body ) {
    if ( error ) {
        throw new Error( error );
    }

    body = JSON.parse( body );
    console.log(
        body.auth_required
            ? body.next_url + '&partner_redirect=' + encodeURIComponent( 'http://example.com' )
            : body.next_url
    );
} );
```
