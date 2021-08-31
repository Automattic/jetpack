# jetpack-sandbox

This package allows Automattic developers to configure the connection to talk to a sandbox WordPress.com server instead of production servers.

## Usage

Initialize the `Automattic\Jetpack\Server_Sandbox` class using the `init` method to set up the `Server_Sandbox's` action hooks. The `JETPACK__SANDBOX_DOMAIN` constant
is used by the `Server_Sandbox` to determine the destination of sandboxed requests, so it's useful to check that the constant is defined before initializing:

```
if ( defined( 'JETPACK__SANDBOX_DOMAIN' ) && JETPACK__SANDBOX_DOMAIN ) {
	( new Server_Sandbox() )->init();
}
```

The `Server_Sandbox` will direct requests to the sandbox WordPress.com server. It will also display a notice in the top admin bar to indicate that the requests are being
sent to the sandbox server.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

jetpack-sandbox is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

