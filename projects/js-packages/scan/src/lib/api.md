# API Class

The Jetpack Scan API requires the site's WPCOM ID and an API key. Initialize the API with these values prior to using other API methods in your application:

```js
import API from '@automattic/jetpack-scan';

API.initialize({
    siteId: 'WPCOM_SITE_ID',
    authToken: 'WPCOM_AUTH_TOKEN',
})
```

Once the API class is initialized, you can use the API to fetch data from the Jetpack Scan API.

```js
import API from '@automattic/jetpack-scan';

const EnqueueScanButton = () => (
    <button onClick={() => API.enqueueScan()}>
        Scan Now
    </button>
);
```
