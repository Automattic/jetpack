# Jetpack HTTP API

Jetpack's HTTP API is built as an [extension to the WP-API](http://v2.wp-api.org/extending/adding/). Thus, you may find additional information on approaching the API in the [WP API Docs](http://v2.wp-api.org/).

* [How to use](#how-to-use)
* [API Authentication and authorization](#api-request-authorization-via-nonces)
* [API Reference](#api-reference)

## How to use

All of the extensions that Jetpack adds to the core's REST API infrastructure demand authentication and, of course knowledge of the endpoints (you can find about them under [API Reference](#api-reference)).

### Requesting with jQuery from the browser's console.

If you go to the Jetpack wp-admin page (/wp-admin/admin.php?page=jetpack) on you WordPress site, you can open the console there and write an AJAX request using `jQuery.ajax`. This comes in handy when testing as every request demands a nonce generated for the REST API specifically. More details about this nonce in [API Authentication and authorization](#api-request-authorization-via-nonces).

**Example GET request**
```
jQuery.ajax( {
    url: '/wp-json/jetpack/v4/settings/',
    method: 'get',
    beforeSend: function ( xhr ) {
        xhr.setRequestHeader( 'X-WP-Nonce', Initial_State.WP_API_nonce );
    },
    contentType: "application/json",
    dataType: "json"
} ).done( function ( response ) {
    console.log( response );
} ).error( function ( error ) {
    console.log( error.responseText );
} );
```

### Requesting with the fetch API from the browser's console.

**Example GET request**
```
fetch( '/wp-json/jetpack/v4/settings', {
	credentials: 'same-origin',
	headers: {
		'X-WP-Nonce': Initial_State.WP_API_nonce,
		'Content-type': 'application/json' }
} )
	.then( response => response.json() )
	.then( response => console.log( response) )
	.catch( error => console.log( error.responseText ) );
```
## API Authentication and authorization

The API requests rely on [cookie-based authentication and a specific nonce](http://v2.wp-api.org/guide/authentication/#cookie-authentication)
for requests to be authorized.

### API Request Authorization via nonces

The WP REST API infrastructure requires a nonce for authorizing of the request itself.

Ensure to use the `X-WP-Nonce` header on your request.

```
X-WP-Nonce: e1cff122e1
```

The nonce is being served on the Jetpack admin page by usage of the [wp_localize_script](https://codex.wordpress.org/Function_Reference/wp_localize_script) mechanism for passing values from PHP code to the JS scope. It's created for the action `wp_rest` and made available in the Jetpack Admin Page as:

```
window.Initial_State.WP_API_nonce;
```

The root URL for the the API is found on the same page as:

```
window.Initial_State.WP_API_root;
```

## API Reference

All endpoints return and accept JSON. Make sure you add the proper `content-type` header to your PUT/POST requests sending JSON objects.

```
'Content-type': 'application/json'
```

### Discovery endpoint

WP-API-compatible [capabilities document](http://v2.wp-api.org/guide/discovery/) for the endpoints registered by Jetpack.

`GET /wp-json/jetpack/v4`

### Jetpack settings

We call settings to any option that a module provides.
This endpoint returns a JSON object with multiple key and current values for them.
When POSTing to this endpoint, you need to send a JSON object in the body with the new values for each key.

As an extra, you can enable or disable modules with this endpoint too. You can pass a module slug as key and set it to `true` or `false` for updating its activation state.

### GET /wp-json/jetpack/v4/settings

Fetch a list of Jetpack settings.

**Example response**

```
{
	"onpublish":false,
	"onupdate":false,
	"Bias Language":false,
	"Cliches":false,
	"Complex Expression":false,
	"Diacritical Marks":false,
	"Double Negative":false,
	"Hidden Verbs":true,
	"Jargon Language":false,
	"Passive voice":false,
	"Phrases to Avoid":false,
	"Redundant Expression":true,
	"guess_lang":false,
	"ignored_phrases":"billy,asdf,lola,y,l,asd,jsd",
	"after-the-deadline":true,
	"carousel_background_color":"white",
	"carousel_display_exif":true
}
```

### POST /wp-json/jetpack/v4/settings

Update multiple settings at once.

**Body parameters**

* Accepts a simple object with the key/values of the settings to update.
If one of the keys you send matches a module slug and the value for it is `true`, the module we be activated. Setting it to `false` will deactivate the module.

This endpoint is quite permissive, so you will be able to try to update settings for a module that is not yet active.
You can also try to activate a module an set any of its options on the same request.

Accepts a JSON object in the body like:
```
{
	"carousel_display_exif": false,
	"carousel": true
}
```
### Jetpack connection

Operations related to Jetpack's connection to WordPress.com

#### GET /wp-json/jetpack/v4/connection

Fetch Jetpack's current connection status.

#### GET /wp-json/jetpack/v4/connection/url

Fetch a fresh WordPress.com URL for connecting the Jetpack installation.

**Note:** The response is not a JSON object, but a string enclosed in double quotes.

**Example response**

```
"https:\/\/jetpack.wordpress.com\/jetpack.authorize\/1\/?response_type=code&client_id=107314117&redirect_uri=https%3A%2F%2Fmysite.mydomain.com%2Fwp-admin%2Fadmin.php%3Fpage%3Djetpack%26action%3Dauthorize%26_wpnonce%63Db10f339f8%26redirect%3Dhttps%253A%252F%252Fmysite.mydomain.com%252Fwp-admin%252Fadmin.php%253Fpage%253Djetpack&state=1&scope=administrator%3A6493e88f3b4130d138e051a48f3b417c5cf503a&user_email=siteowner%40company.com&user_login=mysite&is_active=1&jp_version=5.3&auth_type=calypso&secret=2ejv2bbhwE44GedSjwud7233TN2lGXkxh&locale=en&blogname=mysite+Sandbox&site_url=https%3A%2F%2Fmysite.mydomain.com&home_url=https%3A%2F%2Fmysite.mydomain.com&site_icon=https%3A%2F%2Fi2.wp.com%2Fmysite.mydomain.com%2Fwp-content%2Fuploads%2F2016%2F04%2Fcropped-jetpack-logo.png%3Ffit%3D512%252C512%26ssl%3D1&site_lang=en_US&_ui=7178474&_ut=wpcom%3Auser_id"
```

#### GET /wp-json/jetpack/v4/connection/data

Fetch the data of the current's user WordPress.com account.

#### POST /wp-json/jetpack/v4/connection

Disconnect the Jetpack installation from WordPress.com servers.

Accepts a JSON object in the body like:

```
{
	"isActive": false
}
```

#### POST /wp-json/jetpack/v4/connection/user

Unlink current user from the related WordPress.com account.

Accepts a JSON object in the body like:

```
{
	"linked": false
}
```

### Jetpack modules

#### GET /wp-json/jetpack/v4/module

Get a list of all Jetpacks modules, its description, other properties and the module's options

#### GET /wp-json/jetpack/v4/module/:module-slug

Get a single module description and properties by its slug.

**URL parameters**

* `module-slug`: {String} The identifier of the module to get info about.

#### POST /wp-json/jetpack/v4/module/:module-slug/active

Activate or deactivate a module by its slug

Accepts a JSON object in the body like:
```
{
	"active": true
}
```

**URL parameters**

* `module-slug`: {String} The identifier of the module on which to act.

**Body parameters**

* `active`: {Boolean} Send false to deactivate the module.

#### POST /wp-json/jetpack/v4/module/activate

Activate several modules at a time by their slug

**Note**: Try to not rely hard on this endpoint. Activation and deactivation of modules is also possible via the settings endpoint. And it may come in handy to use the settings endpoint instead as you can turn on a module and update settings related to that module at the same time in a single request.

**Body parameters**

* `modules`: {Array} An array of strings of identifiers of the modules to activate

```
{
	"modules": [ "protect", "monitor", "likes" ]
}
```

#### POST /wp-json/jetpack/v4/module/:module-slug

Update an option's value for a module

**Note**: Try to not rely hard on this endpoint. We started giving the name **settings** to the modules options and you can update them via the settings endpoint now.

**URL parameters**

* `module-slug`: {String} The identifier of the module on which to act.

**Body parameters**

* Accepts a simple object with the key of the option to update and the new value.

Accepts a JSON object in the body like:
```
{
	"option-key": "new-option-value"
}
```

#### POST /wp-json/jetpack/v4/jumpstart/activate

Activate Jumpstart turning on some options and settings to a recommended state.

**This endpoint does not take Body parameters**

#### POST /wp-json/jetpack/v4/jumpstart/deactivate

Deactivate Jumpstart reverting options to their default state.

**This endpoint does not take Body parameters**

#### POST /wp-json/jetpack/v4/reset/:options_or_modules

Reset  Jetpack module options or Jetpack modules activation state to default values.

**URL parameters**

* `options_or_modules`: {String} Available values:
	* `"options"`: all the modules' options will be re-set to their default values.
	* `"modules"`: the modules activation state will be reset to their defaults.

	**This endpoint does not take Body parameters**

### Site information

Operations related to information about the site.

### Jetpack notices

#### POST /wp-json/jetpack/v4/notice/:notice/dismiss

Dismiss a Jetpack notice by Id.

**URL parameters**

* `notice`: {String} The identifier of the notice to dismiss. Possible values:
	* `"feedback_dash_request"`
	* `"welcome"`.

** HTTP Status codes**

* `404` - When `:notice` is not valid or absent

#### GET /wp-json/jetpack/v4/site

Get current site data

### Protect module related operations

##### GET /wp-json/jetpack/v4/module/protect/count/get

Get count of blocked attacks by Protect.

### Monitor module related operations

#### GET /wp-json/jetpack/v4/module/monitor/downtime/last

Get from the Monitor module, the last time the site was down.

### Verification Tools module related operations

#### GET /wp-json/jetpack/v4/module/verification-tools/services

Get services that this site is verified with.

### Site's plugins related operations

#### GET /wp-json/jetpack/v4/plugins

Get a list of the currently installed plugins on the site.

**Example response**

```
{
    "hello.php": {
        "Name": "Hello Dolly",
        "PluginURI": "http://wordpress.org/plugins/hello-dolly/",
        "Version": "1.6",
        "Description": "This is not just a plugin, it symbolizes the hope and enthusiasm of an entire generation summed up in two words sung most famously by Louis Armstrong: Hello, Dolly. When activated you will randomly see a lyric from <cite>Hello, Dolly</cite> in the upper right of your admin screen on every page.",
        "Author": "Matt Mullenweg",
        "AuthorURI": "http://ma.tt/",
        "TextDomain": "",
        "DomainPath": "",
        "Network": false,
        "Title": "Hello Dolly",
        "AuthorName": "Matt Mullenweg",
        "active": false
    },
    "jetpack/jetpack.php": {
        "Name": "Jetpack by WordPress.com",
        "PluginURI": "https://jetpack.com",
        "Version": "5.3",
        "Description": "Get everything you need to <strong>design, secure, and grow your WordPress site</strong>. Jetpack gives you free themes, image tools, related content, and site security, all in one convenient bundle.",
        "Author": "Automattic",
        "AuthorURI": "https://jetpack.com",
        "TextDomain": "jetpack",
        "DomainPath": "/languages/",
        "Network": false,
        "Title": "Jetpack by WordPress.com",
        "AuthorName": "Automattic",
        "active": true
    }
}
```

#### GET /wp-json/jetpack/v4/updates/plugins

Get number of updated available for currently installed WordPress plugins.

### Akismet related operations

#### GET /wp-json/jetpack/v4/akismet/stats/get

Get stats from Akismet filtered spam.

### VaultPress options

#### GET /wp-json/jetpack/v4/module/vaultpress/data

get date of last backup or status and information about actions for user to take.
