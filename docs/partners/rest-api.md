# REST API Endpoint Documentation

An alternative to using the `bin/partner-provision.sh` and `bin/partner_cancel.sh` scripts is to use our REST API directly. This file will document all applicable endpoints.

# Getting a Jetpack Partner access token

When you become a Jetpack partner, we will provide you with your partner ID and a secret key. Typically you just pass these values directly in to the `bin` scripts. But, when calling the WordPress.com API directly, you'll first need to get an access token with for your partner ID with a scope of `jetpack-partner`.

To do that, you'll make a `POST` request to the `https://public-api.wordpress.com/oauth2/token` endpoint passing with the request parameters mentioned below.

A successful response will include a JSON object with several keys. We are specifically interested in the `access_token` key, so be sure to grab that.

For more detailed information about oAuth on WordPress.com, visit the [documentation on oAuth2 authentication](https://developer.wordpress.com/docs/oauth2/).

### Endpoint Information (`/oauth2/token`)

- __Method__: `POST`
- __URL__:    `https://public-api.wordpress.com/oauth2/token`

### Request Parameters (`/oauth2/token`)

- __grant_type__:    Value should be `client_credentials`
- __scope__:         Value should be `jetpack-partner`
- __client_id__:     The partner ID that we provide you
- __client_secret__: The partner secret that we provide you

### Response Parameters (`/oauth2/token`)

- __access_token__: (string) This is the access token we'll need for the API calls below.
- __token_type__:   (string) This should be `bearer`.
- __blog_id__:      (int) This should be `0`.
- __blog_url__:     (int) This should be `0`.
- __scope__:        (string) This should be `jetpack-partner`.

Note: You only need to create the `access_token` once.

### Examples (`/oauth2/token`)

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