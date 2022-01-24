# Jetpack Sync Data Settings

## How to customize sync data settings

To customize the data synced to WPCOM, the plugin must provide an array consisting of Sync filters keys associated with an array of desired data.

The value for the `jetpack_sync_modules` key must be a non-empty array. The entire settings array will be ignored and default values will be used for all Sync data filters if the value of the `jetpack_sync_modules` key is not a non-empty array.


### Using the Config package


### Directly using the Sync package


## Sync Modules

The following Sync modules may be enabled using the `jetpack_sync_modules` key:


If you enable a module and do not provide settings for the associated data filter keys (see the Sync filters section), the default values will be used.


## Sync Filters 

Each data filter is associated with a Sync module. The plugin must enable the module associated with a filter in order to customize the data for that filter. If the plugin does not enable the associated module, the filter setting will be ignored.

The table below provides the list of filters that can be customized along with the module associated with each filter.



## Using the Sync filters directly

The Sync filters described described above maybe used directly to add non-default settings. However, they should not be used to disable data settings. Doing so may disable data settings that other plugins on the site need enabled.