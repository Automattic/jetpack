## Jetpack.Functions.SetCookie

Flag calls to [setcookie] that don't set `$httponly` to `true`.

### Messages

* `FoundNonHTTPOnlyFalse`: The %s function requires the httponly parameter to be set to true, unless intentionally disabled.

  If you want to allow explicitly passing `false` to indicate an intentional non-httponly cookie, you can exclude only this message.
* `MissingTrueHTTPOnly`: The %s function requires the httponly parameter to be set to true, unless intentionally disabled.

### Configuration

This sniff has no configuration options.

[setcookie]: https://www.php.net/setcookie
