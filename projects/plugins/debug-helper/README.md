# Jetpack Debug tools

This is a plugin to help developers debug some Jetpack features. 

Once activated, you will see a new Menu item in your admin dashboard called `Jetpack Debug`. Visit this page to activate the modules you want.

## Available Modules

### Broken Token Utilities

This module let's you easily break your Jetpack connection by invalidating or erasing the tokens in many different ways.

It also allows you to inspect the XML-RPC error reporting and validation.

When activated, you'll see two new menu entries under the Jetpack menu:

* Broken Token - to break things
* XML-RPC Errors - to inspect errors

### REST API Tester

REST API tester lets you send custom requests to Jetpack REST API and review the response. JSON responses are validated and auto-formatted.

### Sync Debug Utilities

Adds some debugging to sync

**Note:** This module is not currently being maintained. 

### Data Mocker
The tool allows you to mock data in the database for performance testing.

There are two mockers implemented:
- Options to generate random options.
- Nonces, to create Jetpack Nonces with random timestamps.

#### Adding a Custom Mocker
1. Create a class implementing `Automattic\Jetpack\Debug_Helper\Mocker\Runner_Interface` that mocks the data.
2. Add it into the list in `Automattic\Jetpack\Debug_Helper\Mocker::$runners`.
