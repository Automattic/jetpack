# Provisioning and Cancelling Jetpack Plans – Querying the API Directly

In [another document](plan-provisioning.md), we discussed how to provision and cancel plans by using the shell script that ships with Jetpack. But, for partners where running shell commands won't work, it is possible to communicate directly to the API on WordPress.com.

If you have any questions or issues, our contact information can be found on the [README.md document](README.md).

### Getting a Jetpack Partner access token

When you become a Jetpack partner, we will provide you with your partner ID and a secret key. Typically you just pass these values directly in to the `bin/partner-provision.sh` and `bin/partner_cancel.sh` scripts. But, when calling the WordPress.com API directly, you'll first need to get an access token with for your partner ID with a scope of `jetpack-partner`.

To do that, you'll make a `POST` request to the `https://public-api.wordpress.com/oauth2/token` endpoint passing with the request parameters mentioned below.

For more detailed information about oAuth on WordPress.com, visit the [documentation on oAuth2 authentication](https://developer.wordpress.com/docs/oauth2/).

#### Endpoint Information

- __Method__: POST
- __URL__:    https://public-api.wordpress.com/oauth2/token

#### Request Parameters

- __grant_type__:    Value should be `client_credentials`
- __scope__:         Value should be `jetpack-partner`
- __client_id__:     The partner ID that we provide you
- __client_secret__: The partner secret that we provide you

#### Response Parameters

- __access_token__: (string) This is the access token we'll need for the API calls below.
- __token_type__:   (string) This should be `bearer`.
- __blog_id__:      (int) This should be `0`.
- __blog_url__:     (int) This should be `0`.
- __scope__:        (string) This should be `jetpack-partner`.

Note: You only need to create the `access_token` once.

#### Examples

Here is an example using cURL in shell.

```shell
PARTNER_ID="your_partner_id_here"
PARTNER_SECRET="your_partner_secret_here"
curl --request POST \
    --url https://public-api.wordpress.com/oauth2/token \
    --header 'cache-control: no-cache' \
    --header 'content-type: multipart/form-data;' \
    --form client_id="$PARTNER_ID" \
    --form client_secret="$PARTNER_SECRET" \
    --form grant_type=client_credentials \
    --form scope=jetpack-partner
```

Here's an example using the request module in Node JS.

```javascript
var request = require( 'request' );
var clientId = 'your_partner_id_here';
var clientSecret = 'your_partner_secret_here';

var options = {
    method: 'POST',
    url: 'https://public-api.wordpress.com/oauth2/token',
    headers: {
        'cache-control': 'no-cache',
        'content-type': 'multipart/form-data;'
    },
    formData: {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
        scope: 'jetpack-partner'
    }
};

request( options, function ( error, response, body ) {
    if ( error ) {
        throw new Error( error );
    }

    console.log( body );
} );

```

### Provisioning a plan

TBD.

### Cancelling a plan

Plans can be cancelled by making a request using your partner token from the step above and the URL of the site being cancelled.

#### Endpoint Information

- __Method__: POST
- __URL__:    https://public-api.wordpress.com/rest/v1.3/jpphp/{$site}/partner-cancel

`$site` is the site's domain and path where `/` in the path is replaced with `::`. For example:

| Site URL              | $site Identifier        |
| --------------------- | -------------------     |
| `example.com`         | `example.com`           |
| `example.com/demo`    | `example.com::demo`     |
| `example.com/demo/wp` | `example.com::demo::wp` |

#### Query Parameters

- __http_envelope__: Default to `false`. Sending `true` will force the HTTP status code to always be `200`. The JSON response is wrapped in an envelope containing the "real" HTTP status code and headers.
- __pretty__:        Defaults to `false`. Setting to `true` will output pretty JSON.

#### Response Parameters

- __success__:       (bool) Was the operation successful?.
- __error_code__:    (string) Error code, if any.
- __error_message__: (string) Error message, if any.

#### Endpoint errors

| HTTP Code | Error Identifier      | Error Message                                                             |
| --------- | --------------------- | ------------------------------------------------------------------------- |
| 400       | invalid_input         | Unable to delete subscription                                             |
| 400       | not_jps_plan          | The plan for this site was not provisioned by Jetpack Start               |
| 403       | invalid_scope         | This token is not authorized to provision partner sites                   |
| 403       | invalid_blog          | The blog ID %s is invalid                                                 |
| 403       | incorrect_partner_key | Subscriptions can only be cancelled by the oAuth client that created them |

### Examples

Here's an example using cURL in shell.

```shell
ACCESS_TOKEN="access_token_here"
SITE_DOMAIN="example.com"
curl --request POST \
    --url https://public-api.wordpress.com/rest/v1.3/jpphp/"$SITE_DOMAIN"/partner-cancel \
    --header "authorization: Bearer $ACCESS_TOKEN" \
    --header 'cache-control: no-cache' \
```

Here's an example using the request module in Node JS.

```javascript
var request = require( 'request ');
var accessToken = 'access_token_here';
var siteDomain = 'example.com';

var options = {
    method: 'POST',
    url: 'https://public-api.wordpress.com/rest/v1.3/jpphp/' + siteDomain + '/partner-cancel',
    headers: {
        'cache-control': 'no-cache',
        authorization: 'Bearer ' + accessToken
    }
};

request( options, function ( error, response, body ) {
    if ( error ) {
        throw new Error( error );
    }

    console.log( body );
} );
```
