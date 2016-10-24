
## Jetpack React Admin UI

This UI is built on React, redux and the fetch API.

### Data fetching

The data is being made available to the UI by usage of the **Jetpack HTTP API**.
Jetpack extends the Core API adding some specific endpoints.

You may find additional reference for the Jetpack's HTTP API on the [rest-api.md](../../rest-api.md) file.

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
* modules.updateModuleOptions( name, { option1Key: option1Value, option2Key: option2Value } )

### Action types

Action types dispatched during the UI lifecycle are listed in `state/action-types.js`.

#### How to use selectors and actions creators from a component file

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
