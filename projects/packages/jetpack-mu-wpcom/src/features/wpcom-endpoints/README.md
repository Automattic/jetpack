# WPCom Endpoints

These are endpoints designed to be shared across both WPCom platforms: Simple and Atomic.

These calls can be bridged from `public-api.wordpress.com` to an Atomic site seamlessly with a little extra work to ensure that the freshest data is always served. See PCYsg-liz-p2 for more.

For WPCom-only endpoints, this is intended to replace:
1. Atomic (via the classic Jetpack plugin): `_inc/lib/core-api/wpcom-endpoints/`
2. Simple                                 : `wp-content/rest-api-plugins/jetpack-endpoints`

If your endpoint still needs to work with non-Atomic Jetpack sites, continue to use the classic Jetpack plugin.

## Further Instructions

1. Use the `wpcom/v2` namespace for your endpoint.
2. Call `wpcom_rest_api_v2_load_plugin( 'Your_Endpoint_Class_Here' )` at the bottom of the file.
3. See PCYsg-liz-p2 for bridging the call from WPCom's `public-api` centralized service to the Atomic site directly.