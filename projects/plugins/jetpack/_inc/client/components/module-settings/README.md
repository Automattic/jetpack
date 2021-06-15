## connectModuleOptions

A High Order Component that connects to Jetpack modules'options
redux state selectors and action creators.

**Arguments**

* {React.Component} Component - The component to be connected to the state
* Return: {React.Component} -	The component with some props connected to the state

This HOC provides the wrapped component with the following property methods

* validValues( option_name )
* getOptionCurrentValue( module_name, option_name)
* getSiteRoles()
* isUpdating ( option_name )
* adminEmailAddress()
* currentIp()
* siteAdminUrl()
* isCurrentUserLinked()
* updateOptions( newOptions )
* regeneratePostByEmailAddress()
* setUnsavedOptionFlag()
* clearUnsavedOptionFlag()

## with-module-settings-form-helps

A High Order Component that provides helpers (as props)  &lt;form&gt; with functionality to handle input values on the forms own React component state.

_Basically useful for using in composition with the connectModuleOptions HOC._

** Props **

* getOptionCurrentValue()
* props.module
* props.updateOptions

