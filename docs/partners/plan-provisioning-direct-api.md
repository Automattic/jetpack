# Provisioning and Cancelling Jetpack Plans – Querying the API Directly

In [another document](plan-provisioning.md), we discussed how to provision and cancel plans by using the shell script that ships with Jetpack. But, for partners where running shell commands won't work, it is possible to communicate directly to the API on WordPress.com.

### Provisioning a plan

TBD.

### Cancelling a plan

Cancelling a Jetpack for a given Jetpack site, as long as the partner making the cancellation request is also the partner that provisioned that plan, is fairly straightforward. To move forward, you'll need your partner secret as well as the URL of the site that you'd like to cancel the plan for.

#### Endpoint Information

__Method__: POST

__URL__:    https://public-api.wordpress.com/rest/v1.3/jpphp/{$site}/partner-cancel

`$site` is the site's domain and path where `/` in the path is replaced with `::`. For example:

| Site URL            | $site Identifier    |
| ------------------- | ------------------- |
| `example.com1`      | `example.com`       |
| `example.com/test1` | `example.com::test` |

#### Query Parameters

__http_envelope__: Default to `false`. Sending `true` will force the HTTP status code to always be `200`. The JSON response is wrapped in an envelope containing the "real" HTTP status code and headers.

__pretty__:        Defaults to `false`. Setting to `true` will output pretty JSON.

#### Response Parameters

__success__:       (bool) Was the operation successful?.
__error_code__:    (string) Error code, if any'.
__error_message__: (string) Error message, if any'.

#### Endpoint errors

| HTTP Code | Error Identifier      | Error Message                                                             |
| --------- | --------------------- | ------------------------------------------------------------------------- |
| 400       | invalid_input         | Unable to delete subscription                                             |
| 400       | not_jps_plan          | The plan for this site was not provisioned by Jetpack Start               |
| 403       | invalid_scope         | This token is not authorized to provision partner sites                   |
| 403       | invalid_blog          | The blog ID %s is invalid                                                 |
| 403       | incorrect_partner_key | Subscriptions can only be cancelled by the oAuth client that created them |
