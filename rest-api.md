# Jetpack HTTP API

Jetpack's HTTP API is built as an [extension to the WP-API](http://v2.wp-api.org/extending/adding/). Thus, you may find additional information on approaching the API in the [WP API Docs](http://v2.wp-api.org/).

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

## Discovery

WP-API-compatible [capabilities document](http://v2.wp-api.org/guide/discovery/) for the endpoints registered by Jetpack.

`GET /wp-json/jetpack/v4`

## API Reference

All endpoints return and accept JSON. Make sure you add the proper `content-type` header to your PUT/POST requests sending JSON objects.

```
'Content-type': 'application/json'
```

### Jetpack connection

Operations related to Jetpack's connection to WordPress.com

#### GET /wp-json/jetpack/v4/connection-status

Fetch Jetpack's current connection status.

#### GET /wp-json/jetpack/v4/connect-url

Fetch a fresh WordPress.com URL for connecting the Jetpack installation.

#### GET /wp-json/jetpack/v4/user-connection-data

Fetch the data of the current's user WordPress.com account.

#### POST /wp-json/jetpack/v4/disconnect/site

Disconnect the Jetpack installation from WordPress.com servers.

**This endpoint does not take Body parameters**

#### POST /wp-json/jetpack/v4/recheck-ssl

Check if the site has SSL enabled.

**This endpoint does not take Body parameters**

### Jetpack modules

#### GET /wp-json/jetpack/v4/module/all

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

**Body parameters**

* `modules`: {Array} An array of strings of identifiers of the modules to activate

```
{
	"modules": [ "protect", "monitor", "likes" ]
}
```

#### POST /wp-json/jetpack/v4/module/:module-slug

Update an option's value for a module

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

### Jetpack miscellaneous settings

### GET /wp-json/jetpack/v4/settings

Fetch a list of Jetpack settings not related to a particular module.

### POST /wp-json/jetpack/v4/settings/update

Update a setting value

**Body parameters**

* Accepts a simple object with the key of the setting to update and the new value.

Accepts a JSON object in the body like:
```
{
	"setting-key": "new-setting-value"
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


### Users

Operations related to the site's users linked to WordPress.com accounts.

#### POST /wp-json/jetpack/v4/unlink

Unlink current user from the related WordPress.com account.

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

#### GET /wp-json/jetpack/v4/updates/plugins

Get number of updated available for currently installed WordPress plugins.

### Akismet related operations

#### GET /wp-json/jetpack/v4/akismet/stats/get

Get stats from Akismet filtered spam.

### VaultPress options

#### GET /wp-json/jetpack/v4/module/vaultpress/data

get date of last backup or status and information about actions for user to take.
