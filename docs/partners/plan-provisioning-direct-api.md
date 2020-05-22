# Provisioning and Cancelling Jetpack Plans – Querying the API Directly

In [another document](plan-provisioning.md), we discussed how to provision and cancel plans by using the shell script that ships with Jetpack. But, for partners where running shell commands won't work, it is possible to communicate directly to the API on WordPress.com.

If you have any questions or issues, our contact information can be found on the [README.md document](README.md).

## Getting a Jetpack Partner access token

When you become a Jetpack partner, we will provide you with your partner ID and a secret key. Typically you just pass these values directly in to the `bin/partner-provision.sh` and `bin/partner_cancel.sh` scripts. But, when calling the WordPress.com API directly, you'll first need to get an access token with for your partner ID with a scope of `jetpack-partner`.

To do that, you'll make a `POST` request to the `https://public-api.wordpress.com/oauth2/token` endpoint passing with the request parameters mentioned below.

A successful response will include a JSON object with several keys. We are specifically interested in the `access_token` key, so be sure to grab that.

For more detailed information about oAuth on WordPress.com, visit the [documentation on oAuth2 authentication](https://developer.wordpress.com/docs/oauth2/).

### Endpoint Information (/oauth2/token)

- __Method__: POST
- __URL__:    `https://public-api.wordpress.com/oauth2/token`

### Request Parameters (/oauth2/token)

- __grant_type__:    Value should be `client_credentials`
- __scope__:         Value should be `jetpack-partner`
- __client_id__:     The partner ID that we provide you
- __client_secret__: The partner secret that we provide you

### Response Parameters (/oauth2/token)

- __access_token__: (string) This is the access token we'll need for the API calls below.
- __token_type__:   (string) This should be `bearer`.
- __blog_id__:      (int) This should be `0`.
- __blog_url__:     (int) This should be `0`.
- __scope__:        (string) This should be `jetpack-partner`.

Note: You only need to create the `access_token` once.

### Examples (/oauth2/token)

Here is an example using cURL in shell.

```shell
# Note: This example uses jq to parse JSON from the API.
PARTNER_ID="your_partner_id_here"
PARTNER_SECRET="your_partner_secret_here"
RESULT=$( curl --request POST \
    --url https://public-api.wordpress.com/oauth2/token \
    --header 'cache-control: no-cache' \
    --header 'content-type: multipart/form-data;' \
    --form client_id="$PARTNER_ID" \
    --form client_secret="$PARTNER_SECRET" \
    --form grant_type=client_credentials \
    --form scope=jetpack-partner )

ACCESS_TOKEN=$( echo "$RESULT" | jq -r '.access_token' )
echo "Access token is: $ACCESS_TOKEN"
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

    console.log( 'The access token is ' + JSON.parse( body ).access_token );
} );

```

## Provisioning a plan

Plans can be provisioned by making a request using your partner token from the step above along with local_user, siteurl, and plan parameters.

### Endpoint information (/provision)

- __Method__: POST
- __URL__:    `https://public-api.wordpress.com/rest/v1.3/jpphp/provision`

### Request Parameters (/provision)

- __local_user__:     The username, ID or email on the local website (not the WordPress.com username) that should own the plan. The corresponding user _must_ already exist.
- __siteurl__:        The URL where the WordPress core files reside.
- __plan__:           A slug representing which plan to provision. One of `free`, `personal`, `premium`, or `professional`.
- __force_register__: (optional) A true/false value indicating whether to re-register a site even if we already have tokens for it. Useful for sites that have gotten into a bad state.
- __force_connect__:  (optional) A true/false value indicating whether to re-connect a user even if we already have tokens for them. Useful for sites that have gotten into a bad state.
- __onboarding__:     (optional) If true, put the user through our onboarding wizard for new sites.
- __wpcom_user_id__:  (optional) For certain keys, enables auto-connecting a WordPress.com user to the site non-interactively.
- __wpcom_user_email__: (optional) For certain keys, enables auto-connecting a WordPress.com user to the site non-interactively, and if necessary creating a WordPress.com account.

### Response Parameters (/provision)

- __success__:       (bool) Was the operation successful?.
- __error_code__:    (string) Error code, if any.
- __error_message__: (string) Error message, if any.
- __auth_required__: (bool) Does the user need to authorize the connection on WordPress.com to finish provisioning?

### Endpoint Errors (/provision)

The following is non-exhaustive list of errors that could be returned.

| HTTP Code | Error Identifier          | Error Message                                                             |
| --------- | ------------------------- | ------------------------------------------------------------------------- |
| 400       | invalid_siteurl           | The required "siteurl" argument is missing.                               |
| 400       | invalid_local_user        | The required "local_user" argument is missing.                            |
| 400       | plan_downgrade_disallowed | Can not automatically downgrade plans. Contact support.                   |
| 400       | invalid_plan              | %s is not a valid plan                                                    |
| 403       | invalid_scope             | This token is not authorized to provision partner sites                   |

### Examples (/provision)

Here's an example using cURL in shell.

```shell
curl --request POST \
  --url https://public-api.wordpress.com/rest/v1.3/jpphp/provision \
  --header "authorization: Bearer $ACCESS_TOKEN" \
  --header 'cache-control: no-cache' \
 --form plan=plan_here \
 --form siteurl=siteurl_here \
 --form local_username=local_username_here
```

Here's an example using the request module in NodeJS.

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

    console.log( body );
} );
```

### Considerations for domain names that do not resolve

During the typical provisioning process, several calls are made between WordPress.com and the site that will receive a plan. For calls from WordPress.com to the site to succeed, we must be able to resolve the host of the URL provided to this endpoint.

That typical provisioning process presents an issue in the case of provisioning a plan to a site with a new domain name. As of early August 2018, we are able to gracefully degrade in this case.

When WordPress.com cannot communicate to the remote site due to not being able to resolve the host, cURL error 6, WordPress.com will flag the URL for future provisioning of a plan. After doing this, the API will return a response that looks like this:

```
{
  "success": true,
  "next_url": "",
  "auth_required": true
}
```

This response is the same as the standard `/provision` response, with the exception of `next_url` being blank. Since WordPress.com is not able to communicate to the remote site, the API is not able to set secrets that are needed in the `next_url` that allows users to finish the authorization process. Authorization is still required by the user to receive the plan, which the user can do by visiting `/wp-admin` of their WordPress site and clicking the "Set Up Jetpack" button.

## Cancelling a plan

Plans can be cancelled by making a request using your partner token from the step above and the URL of the site being cancelled.

### Endpoint Information (/partner-cancel)

- __Method__: POST
- __URL__:    `https://public-api.wordpress.com/rest/v1.3/jpphp/{$site}/partner-cancel`

`$site` is the site's domain and path where `/` in the path is replaced with `::`. For example:

| Site URL              | $site Identifier        |
| --------------------- | -------------------     |
| `example.com`         | `example.com`           |
| `example.com/demo`    | `example.com::demo`     |
| `example.com/demo/wp` | `example.com::demo::wp` |

### Query Parameters (/partner-cancel)

- __http_envelope__: Default to `false`. Sending `true` will force the HTTP status code to always be `200`. The JSON response is wrapped in an envelope containing the "real" HTTP status code and headers.
- __pretty__:        Defaults to `false`. Setting to `true` will output pretty JSON.

### Response Parameters (/partner-cancel)

- __success__:       (bool) Was the operation successful?.
- __error_code__:    (string) Error code, if any.
- __error_message__: (string) Error message, if any.

### Endpoint errors (/partner-cancel)

| HTTP Code | Error Identifier      | Error Message                                                             |
| --------- | --------------------- | ------------------------------------------------------------------------- |
| 400       | invalid_input         | Unable to delete subscription                                             |
| 400       | not_jps_plan          | The plan for this site was not provisioned by Jetpack Start               |
| 403       | invalid_scope         | This token is not authorized to provision partner sites                   |
| 403       | invalid_blog          | The blog ID %s is invalid                                                 |
| 403       | incorrect_partner_key | Subscriptions can only be cancelled by the oAuth client that created them |

### Examples (/partner-cancel)

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
