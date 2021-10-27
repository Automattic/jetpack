# Jetpack Redirects

A helper function to build URLs using the `jetpack.com/redirect` service.

If you are an automattician, refer to PCYsg-pY7-p2 for all related information and links to our internal tools.

## Usage

```jsx
import { getRedirectUrl } from '@automattic/jetpack-components';
getRedirectUrl( source, args );
```

### source (required)

Source can be either a “source handler” or an URL.

A “source handler” must be registered in the Jetpack Redirects service, on the server side. It’s a slug that points to an URL that may or may not have dynamic parts in it.

An “URL” is a string that must start with “https://" and doesn’t need to be registered on the server. However, if it is registered, it will point to the URL set as target there rather than to the source. (Note: It will only work for whitelisted domains, unless the URL is explicitly registered on the server)

### args (optional)

This is optional and allows you to pass an object with more parameters to build the URL.

This is not a complete list as any argument passed here will be sent to as a query parameter to the Redirect server. These parameters will not necessarily be passed over to the final destination URL. If you want to add a parameter to the final destination URL, use the `query` argument.

* **site**: Optional (but recommended). This is used to identify the site and also to fill in the `[site]` placeholder in the target. Will default to the value of `jetpack_redirects.currentSiteRawUrl`, if available.

* **path**: Optional. Used to fill in the `[path]` placeholder in the target.

* **query**: Optional. A string with additional variables to be added in the query string. Must be passed as a string in `key=value&foo=bar` format.

* **anchor**: Optional. An anchor to be added to the final URL. Must be a single string. Example: `section1`

## Examples

### Example 1

`getRedirectUrl( 'jetpack', { query: 'foo=bar', anchor: 'section' } );`

This will return the following URL: `https://jetpack.com/redirect?source=jetpack&anchor=section&query=foo%3Dbar`

When accessing this URL, the user will be redirected to: `https://jetpack.com/?foo=bar#section`

### Example 2 (placeholders):

```	
getRedirectUrl( 
	'calypso-edit-post',
	{
		path: '1234',
		site: 'example.org'
	}
)
```
This will return the following URL: `https://jetpack.com/redirect?site=example.org&source=calypso-edit-post&path=1234`

The `calypso-edit-post` source is registered on the server and points to `https://wordpress.com/post/[site]/[path]`, so the final URL that the user will be redirected to is:

`https://wordpress.com/post/example.org/1234`
