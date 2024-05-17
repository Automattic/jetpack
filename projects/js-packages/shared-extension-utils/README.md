# Shared Extension Utilities

Utility functions used by the block editor extensions.

This package is the new home for the code in [the `extensions/shared`
directory](https://github.com/Automattic/jetpack/tree/trunk/projects/plugins/jetpack/extensions/shared)
of the Jetpack plugin, so that plugins can share it. To begin with, we moving
the code used by the Publicize editor extension, but the goal is to bring over
all the shared code.

## Fetching modules data from the store
The package relies on [controls](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-data/#controls)
and [resolvers](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-data/#resolvers)
to pull modules data from the API, and put it into the package's Redux store.

### Basic Usage

In order to have all modules related data synced within different packages, let's use this Redux store as a source of truth, for both, getting and updating the data.


Use [`withSelect`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-data/#withselect), `withDispatch` higher-order component to pull the data or [`useSelect`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-data/#useselect) hook to pull the data from the store to pull directly in component. Example:


```jsx
// Imports.
import { withSelect, withDispatch } from '@wordpress/data';
import { JETPACK_MODULES_STORE_ID } from '@automattic/jetpack-shared-extension-utils';

const SampleComponent = props => {
	const { isModuleActive, isLoadingModules, isChangingStatus, updateJetpackModuleStatus } = props;

    if ( isModuleActive ) {
        return <div>Module is active</div>;
    }

    if ( isLoadingModules ) {
        return <div>Loading modules...</div>;
    }
    
    if ( !isModuleActive ) {
        return <button onClick={ () => updateJetpackModuleStatus( 'contact-form', true ) }>
            Activate module
        </button>;
    }

	return <div>Active contact form module</div>;
}

// We wrap `SampleComponent` into the composition of `withSelect` and `withDispatch` HOCs,
// which will pull the data from the store and pass as a parameter into the component.
// Jetpack modules will be pulled after first selection `isModuleActive`.
export default compose( [
	withSelect( ( select, props ) => {
		const { isModuleActive, areModulesLoading, isModuleUpdating } = select( 'jetpack-modules' );
		return {
			isModuleActive: isModuleActive( 'contact-form' ),
			isLoadingModules: areModulesLoading(),
			isChangingStatus: isModuleUpdating( 'contact-form' ),
		};
	} ),
	withDispatch( dispatch => {
		const { updateJetpackModuleStatus } = dispatch( 'jetpack-modules' );
		return { updateJetpackModuleStatus };
	} ),
] )( ( SampleComponent ) );
```


## How to install shared-extension-utils

### Installation From Git Repo

## Contribute

## Get Help

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

shared-extension-utils is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

