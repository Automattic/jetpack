Connection Banner
=========

This component renders a customizable user connection banner with a button that initiates the user connection flow.

## Props:

- *title* - (required) the banner title.
- *description* - the banner description.
- *from* - an additional query param to be passed to the connect url by the connect button.


## Usage:

```js
import ConnectionBanner from 'components/connection-banner';

render() {
    return (
        <ConnectionBanner
            title="Link your account to WordPress.com"
            description="Enjoy all Jetpack features by linking your account to WordPress.com"
            from="unlinked-user-connect"
        />
    );
}
```
