Authorization Iframe
=========

This component renders a customizable iframe serving in-place authorization flow. Currently this iframe doesn't need to be explicitly rendered from any other component, as it is already included in `main`.
In order to display the authorization iframe, just dispatch the `authorizeUserInPlace` action.

## Props:

- *title* - (required) the iframe title.
- *width* - the iframe width. Defaults to `100%`
- *height* - the iframe height. Defaults to `220`
- *scrollTo* - whether after iframe rendering, window should scroll to it's current position. Defaults to `true`.
- *onAuthorized* - a function associated to the successful authorization.
- *location* - where the component is displayed, passed into WP.com for further use.

## General Usage:

```js
import AuthIframe from 'components/auth-iframe';

render() {
    return (
        <AuthIframe
            title="Link your account to WordPress.com"
            width="300"
            height="300"
            scrollTo = { true }
            onAuthorized={ someFunction }
			location="connect-user-bar"
        />
    );
}
```

## Trigger iframe to show, via dispatching the `authorizeUserInPlace` action.

```js
import authorizeUserInPlace from 'state/connection';

dispatch( authorizeUserInPlace() );
```
