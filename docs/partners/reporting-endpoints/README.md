# Partners REST API Endpoint Documentation

An alternative to manually using the [Jetpack Partner Portal](#) is to query the REST API endpoints that it uses.

## Authentication

Open your browser's developer console and paste in the following to get your Bearer token:

```javascript
localStorage.getItem( 'wp_oauth' );
```

The resulting value should be passed as an HTTP header during the REST API request:

```
Authorization: Bearer XXXXXXXXXXXXXXXXXXXXXXXXX
```