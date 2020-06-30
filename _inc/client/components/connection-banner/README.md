# Connection Banner

This component renders a customizable connection banner. This banner uses the connect button component and passes certain properties to it.

## Props:

- *title* - (required) the banner title.
- *description* - the banner description.
- *className* - any additional CSS classes.
- *icon* - the component icon.
- *connectUser* - whether the connect button should be used in user connection context (by default it handles site connection). Defaults to `false`.
- *from* - an additional query param to be passed to the connect url by the connect button.
- *asLink* - whether the connect button should be displayed as link, instead of button. Defaults to `false`.
- *connectInPlace* - whether the connect button should attempt to connect a user in-place (using an iframe), instead of redirecting them upon account connection. Defaults to `true`.


## Usage:

```js
import ConnectionBanner from 'components/connection-banner';

render() {
    return (
        <ConnectionBanner
            title="Link your account to WordPress.com"
            description="Enjoy all Jetpack features by linking your account to WordPress.com"
            className="is-jetpack-info"
            icon="my-sites"
            connectUser={ true }
            from="unlinked-user-connect"
            asLink={ true }
            connectInPlace={ false }
        />
    );
}
```