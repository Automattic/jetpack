# Notice

Use this component to send information to the user.

## API

### sendSuccess( message, options )

Send a success message to the client.

### clean()

Clean all previous notices.

## Test in the client

Since Notice is Redux based approach, and leveraging that the wp global object is exposed in the client to create notices on the fly, considering it possible to create a notice defining the type as `snakebar`, and the context as `jetpack-post-list`:

```js
wp.data.dispatch('core/notices').createSuccessNotice( 'Say Hello!', {
  type: 'snackbar',
  context: 'jetpack-post-list'
} );
```

You should see the notice in the page footer.