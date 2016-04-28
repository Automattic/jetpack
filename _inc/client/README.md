
## Jetpack React Admin UI

This UI is built on React, redux and the fetch API.

### Data fetching

The data is being made available to the UI by usage of the WordPress REST API.
Jetpack extends the Core API adding some specific methods.

#### API Authentication

The API requests rely on [cookie-based authentication and a specific nonce](http://v2.wp-api.org/guide/authentication/#cookie-authentication)
for requests to be authorized.

The nonce is being served on the Jetpack admin page by usage of the [wp_localize_script](https://codex.wordpress.org/Function_Reference/wp_localize_script) mechanism for passing values from PHP code to the JS scope.

This nonce is created with the action `wp_rest`.

The nonce and the API root URL are made available on

```
window.Initial_State.WP_API_nonce;
window.Initial_State.WP_API_root;
```


## Internal API

### Available state selectors


* modules.isActivatingModule( state, name )
* modules.isDeactivatingModule( state, name )
* modules.isFetchingModulesList( state )
* modules.isUpdatingModuleOption( state, name )
* modules.isModuleActivated( state, name )
* modules.getModules( state )
* modules.getModulesByFeature( state, feature )


### Available action creators

* modules.fetchModules()
* modules.activateModule( name )
* modules.deactivateModule( name )
* modules.updateModuleOption( name, { optionKey: optionValue} )

### Action types

Action types dispatched during the UI lifecycle are listed in `state/action-types.js`.

####How to use selectors and actions creators from a component file

```javascript
import { getModules, isModuleActivated, activateModule } from 'state/modules';

export const YourComponent = ( props ) => (
	<div>
		<button onClick={ props.isModuleActivated ?
			props.activate.bind( null, props.module.name ) :
			props.deactivate.bind( null, props.module.name )
		}>Activate</button>
	</div>
)

// Connect selectors to the component's props
const mapStateToProps = ( state, ownProps ) => {
  return {
    modules: getModules( state ),
		isModuleActivated: isModuleActivated( state, 'protect' ),
		...ownProps
  }
}

// Connect action creators to the component's props
const mapDispatchToProps = ( dispatch ) => {
  return {
    activate: ( module_name ) => dispatch( activateModule( module_name ) )
    deactivate: ( module_name ) => dispatch( deactivateModule( module_name ) )
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)( YourComponent )
```
