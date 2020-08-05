# Making Authenticated async XML-RPC calls

The Connection package comes with the `XMLRPC_Async_Call` class which helps you to make authenticated requests to WordPress.com.

It's async because the calls are enqueued and dispatched all at once, in a multiCall request at `shutdown`.

## Usage

```PHP
XMLRPC_Async_Call::add_call( 'methodName', get_current_user_id(), $arg1, $arg2, etc... )
```

* First argument is the method name. Example: `jetpack.updateBlog`
* Second argument is the user ID of the connected user. Zero means it will use the blog token to authenticate
* This method accepts a variable number of parameters. Any additional parameters will be passed as arguments in the request call
