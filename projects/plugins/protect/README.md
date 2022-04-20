# Jetpack Protect

Jetpack Protect plugin


**If you are not planning on developing with Jetpack Boost, you should install Jetpack Boost from pre-built sources.** Details on that may be found [on this page](https://github.com/Automattic/jetpack-protect-production).

## Developing

Jetpack Protect is currently under development and we have 2 constants that let us work in the plugin while we are still building the service in WPCOM.

`JETPACK_PROTECT_DEV__BYPASS_CACHE` - will ignore the cached results and will always request fresh data from WPCOM servers.

`JETPACK_PROTECT_DEV__API_RESPONSE_TYPE` - will let you ask WPCOM servers to send a specific response to your requests:

Since the service is still under development, WPCOM is still responding with sample, hardcoded, data. You can choose which response type you want to get by passing one of the following parameters:

* complete_green: Response will include all plugins and zero vulnerabitlies
* incomplete_green: Response will miss one plugin and have zero vulnerabilities
* complete: Response will include all plugins and 2 of them will have vulnerabilities
* incomplete: Response will miss one plugin and 2 of them will have vulnerabilities
* empty: Response as if the first check was not performed yet

Example:

```
define( 'JETPACK_PROTECT_DEV__BYPASS_CACHE', true );
define( 'JETPACK_PROTECT_DEV__API_RESPONSE_TYPE', 'complete' );
```

## Contribute

Please refer to the [Contribute](https://github.com/Automattic/jetpack/blob/master/readme.md#contribute) section in the README.md file at the root of the repository.

## Security

Please refer to the [Security](https://github.com/Automattic/jetpack/blob/master/readme.md#security) section in the README.md file at the root of the repository.

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

Jetpack Protect is licensed under [GNU General Public License v2 (or later)](../../../LICENSE.txt)
