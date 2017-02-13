
## Jetpack React Admin UI

The **Jetpack Admin Page** is a Javascript app built on **React**, [redux](https://github.com/reactjs/redux) and the fetch API.

It's rendered on page load when visiting Jetpack's Admin Pages and fetches data from Jetpack via a REST API.

### Data approach on the Admin Page

The **Admin Page** uses **redux**, [redux-thunk](https://github.com/gaearon/redux-thunk), and [react-redux](https://github.com/reactjs/react-redux)  for state handling trying to ressemble [Calypso's data approach, third Era](https://github.com/Automattic/wp-calypso/blob/master/docs/our-approach-to-data.md#third-era-redux-global-state-tree-december-2015---present).

#### State related code

The `_inc/client/state` directory holds directories named after things we fetch from the API. These directories hold the **redux**-related code like **state selectors**, **action types**, **action creators thunks** and **reducers**.

#### Data fetching

The data is being made available to the **Admin Page** by means of the WordPress REST API infrastructure present in WordPress since [version 4.4](https://make.wordpress.org/core/2015/10/28/rest-api-welcome-the-infrastructure-to-core/).

Jetpack extends the Core API adding some specific methods for several jetpack-related actions exclusively, like activating or deactivating jetpack modules or updating any of the modules options.

You may find additional reference for the Jetpack's HTTP API on the [rest-api.md](../../docs/rest-api.md) file.

##### REST API Authentication

The API requests rely on [cookie-based authentication and a specific nonce](http://v2.wp-api.org/guide/authentication/#cookie-authentication)
for requests to be authorized.

The nonce is being served on the Jetpack admin page by usage of the [wp_localize_script](https://codex.wordpress.org/Function_Reference/wp_localize_script) mechanism for passing values from PHP code to the JS scope.

This nonce is created with the action `wp_rest`.

The nonce and the API root URL are made available on

```
window.Initial_State.WP_API_nonce;
window.Initial_State.WP_API_root;
```

##### Query Components

We rely extensively in [query components](https://github.com/Automattic/wp-calypso/blob/master/docs/our-approach-to-data.md#query-components) to declare the data needs from inside state-aware React components.

These components dispatch the API-fetching actions creators that eventually feed the redux state reducers with data.

#### State selectors

We kept [state selectors](https://github.com/Automattic/wp-calypso/blob/master/docs/our-approach-to-data.md#selectors) definition inside the same file that defines the reducers for each leaf of the state tree.

This was done this way to keep functions that are aware of the tree shape on the same file while we were building the **Admin Page** and learning this pattern altogether.

Below, under [Internal API](#internal-api) you'll find a brief listing about available state selectors you may need in the process of writing a new React component which will be connected to the Redux state tree.

#### Action creators

Every action creator defined in the **Admin Page** returns a Promise and is built as a thunk for handling [Asynchronous actions](https://github.com/reactjs/redux/blob/master/docs/advanced/AsyncActions.md#async-action-creators).

### Internationalization of the Admin Page

The **Admin Page** takes advantage of [i18n-calypso]() for internationalization purposes.

Internally we use the `translate` function exported by `i18n-calypso` by aliasing to `__()`:

```
import { translate as __ } from 'i18n-calypso';
...
<div> { __( 'String' ) } </div>
```

### Browser compatibility of the Admin Page


#### Suport for non-javascript environments

Some static HTML is generated from the JSX files and rendered on build time before a release to provide a non-javascript UI with basic functionality if the browser does not report javascript capabilities.

#### Things we do to maintain compatibility for older browser

* We include a **Babel** plugin in the building toolchain to translate incompatible object methods names which may be parsed as keywords in old javascript engines. (e.g. `.catch()`).
* **Fetch API polyfill**. We use the [whatwg-fetch](https://github.com/github/fetch) polyfill.
* **Promises Polyfill**. We use the [es6-promise](https://github.com/stefanpenner/es6-promise) polyfill.

## Internal API

### Action types

Action types dispatched during the UI lifecycle are listed in `state/action-types.js`.

### Available state selectors


* **getActiveStatsTab( state )**
* **getAdminEmailAddress( state )**
* **getAkismetData( state )**
* **getApiNonce( state )**
* **getApiRootUrl( state )**
* **getConnectUrl( state )**
* **getCurrentVersion( state )**
* **getHappinessGravatarIds( state )**
* **getInitialStateStatsData( state )**
* **getJetpackNotices( state )**
* **getJetpackStateNoticesErrorCode( state )**
* **getJetpackStateNoticesErrorDescription( state )**
* **getJetpackStateNoticesMessageCode( state )**
* **getJumpStartStatus( state )**
* **getLastDownTime( state )**
* **getModule( state, name )**
* **getModuleOption( state, module_slug, option_name )** {
* **getModuleOptionValidValues( state, module_slug, option_name )**
* **getModules( state )**
* **getModulesByFeature( state,**eature ) {
* **getModulesThatRequireConnection( state )**
* **getPluginUpdates( state )**
* **getProtectCount( state )**
* **getSearchTerm( state )**
* **getSettingName( state, name )**
* **getSettings( state )**
* **getSiteAdminUrl( state )**
* **getSiteConnectionStatus( state )**
* **getSiteDevMode( state )**
* **getSitePlan( state )**
* **getSiteRawUrl( state )**
* **getSiteRoles( state )**
* **getStatsData( state )**
* **getTracksUserData( state )**
* **getUserWpComAvatar( state )**
* **getUserWpComEmail( state )**
* **getUserWpComLogin( state )**
* **getUsername( state )**
* **getVaultPressData( state )**
* **getVaultPressScanThreatCount( state )**

### Available action creators (thunks)

* **activateModule( slug )**
* **deactivateModule( slug )**
* **disconnectSite()**
* **dismissJetpackActionNotice( notice )**
* **dismissJetpackNotice( notice )**
* **fetchAkismetData()**
* **fetchConnectUrl()**
* **fetchLastDownTime()**
* **fetchModule()**
* **fetchModules()**
* **fetchPluginUpdates()**
* **fetchPluginsData()**
* **fetchProtectCount()**
* **fetchSettings()**
* **fetchSiteConnectionStatus()**
* **fetchSiteData()**
* **fetchStatsData( range )**
* **fetchUserConnectionData()**
* **fetchVaultPressData()**
* **filterSearch( term )**
* **jumpStartActivate()**
* **jumpStartSkip()**
* **regeneratePostByEmailAddress()**
* **resetOptions( options )**
* **setInitialState()**
* **statsSwitchTab( tab )**
* **unlinkUser()**
* **updateModuleOptions( slug, newOptionValues )**
* **updateSetting( updatedOption )**

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
