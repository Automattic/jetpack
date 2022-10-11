# Changelog

### This is a list detailing changes for the Jetpack RNA Connection Component releases.

## 0.22.0 - 2022-10-05
### Added
- Trigger restore connection flow. [#26489]

### Changed
- Updated package dependencies. [#26457]

## 0.21.0 - 2022-09-27
### Added
- Added connection hook useConnectionErrorNotice to more-easily integrate the ConnectionErrorNotice component with minimal processing logic at the point of integration. [#26400]

### Changed
- Updated package dependencies.
- Updated the ConnectionErrorNotice react component to use a required message property. [#26305]

### Removed
- Removed connection-ui package dependency [#26381]

### Fixed
- Disconnect Dialog: Fixed the prop types to avoid warnings from React [#26340]

## 0.20.0 - 2022-09-20
### Added
- Added the ConnectionErrorNotice React component. [#26259]
- Add Restore Connection functionality extracted from Jetpack. [#26034]

### Changed
- Updated package dependencies. [#26081]

## 0.19.0 - 2022-09-08
### Added
- Add React variables as part of the project to have consistent connection errors across monorepo projects. [#25934]

### Changed
- Updated package dependencies.

## 0.18.12 - 2022-08-25
### Changed
- Updated package dependencies. [#25814]

## 0.18.11 - 2022-08-23
### Changed
- Updated package dependencies. [#25338, #25339, #25377, #25762, #25764]

## 0.18.10 - 2022-07-26
### Changed
- Updated package dependencies. [#25147]

## 0.18.9 - 2022-07-12
### Changed
- Updated package dependencies. [#25048, #25055]

## 0.18.8 - 2022-07-06
### Changed
- Updated package dependencies. [#24923]

## 0.18.7 - 2022-06-28
### Fixed
- Fix include loop between state/store and state/controls + state/resolvers. [#24777]

## 0.18.6 - 2022-06-21
### Added
- JS Connection: return a Promise when registering site [#24238]

## 0.18.5 - 2022-06-14
### Changed
- Updated package dependencies. [#24722]

## 0.18.4 - 2022-06-08
### Changed
- Reorder JS imports for `import/order` eslint rule. [#24601]
- Updated package dependencies. [#24510]

## 0.18.3 - 2022-05-30
### Added
- Add option to use the checkout workflow from the ConnectionScreenRequirePlan component

### Changed
- Updated package dependencies

## 0.18.2 - 2022-05-24
### Changed
- Updated package dependencies. [#24449]

## 0.18.1 - 2022-05-18
### Changed
- Updated package dependencies. [#23795]

## 0.18.0 - 2022-05-10
### Changed
- Do not hard disconnect Jetpack on deactivation [#24272]
- Updated package dependencies. [#24204]
- Updated references to old licensing activation UI to licensing activation UI in My Jetpack [#24189]
- Update tests for updated `@testing-library/user-event`. [#24276]

## 0.17.12 - 2022-05-04
### Added
- Add missing JavaScript dependencies. [#24096]
- JS Connection: introduce useProductCheckoutWorkflow() custom hook [#24122]

### Changed
- JS Connection: use connection global state as a fallback to be used by the useProductCheckoutWorkflow() custom hook [#24137]
- Remove use of `pnpx` in preparation for pnpm 7.0. [#24210]
- Updated package dependencies [#24198]

### Fixed
- JS Connection: fix builinfg the product checkout URL in useProductCheckoutWorkflow() custom hook [#24191]

## 0.17.11 - 2022-05-03
### Removed
- Connection: Allowing hard disconnection on deactivation.

## 0.17.10 - 2022-04-26
### Changed
- JS Connection: add default connection arguments for the useConnection() hook
- Updated package dependencies.

### Fixed
- Disconnect Modal: Fix react warning

## 0.17.9 - 2022-04-19
### Added
- Add connected plugins list to the initial state and add action to update it when needed
- Allow secondary users to connect from My Jetpack

### Changed
- Do not hard disconnect Jetpack on deactivation

### Fixed
- Avoid Warning in React PropTypes
- do not display warning for secondary users if connection has an owner

## 0.17.8 - 2022-04-12
### Changed
- Updated package dependencies.

## 0.17.7 - 2022-04-05
### Added
- Add skipUserConnection option to connectScreen component

### Changed
- Updated package dependencies.

## 0.17.6 - 2022-03-31
### Changed
- My Jetpack: tweak connection card styles and wording

## 0.17.5 - 2022-03-29
### Added
- Connection: Use heading components to render status card cmp

### Changed
- Updated package dependencies.

### Fixed
- Fixed minor react warnings

## 0.17.4 - 2022-03-23
### Changed
- Updated package dependencies

## 0.17.3 - 2022-03-15

## 0.17.2 - 2022-03-09
### Changed
- Updated package dependencies.

## 0.17.1 - 2022-03-08
### Added
- Connection: Add footer prop for ConnectScreen

### Changed
- Components: update attributes used within the Button component to match recent deprecations and changes.

### Fixed
- Updated link-button label from "Log In" to "Log In to get started"

## 0.17.0 - 2022-03-02
### Added
- Connection: Adds requiresUserConnection prop and makes error message show only when hasConnectedOwner and requiresUserConnection are both true.

### Changed
- Moved site benefits request out of PHP to React, and guard against no connected plugins.
- Updated package dependencies.

## 0.16.1 - 2022-02-25
### Fixed
- Fix broken Jetpack Partner Coupon redeem flow for sites without a user connection

## 0.16.0 - 2022-02-22
### Changed
- Bump package version.
- Connection: Update ConnectionStatusCard to match figma
- Disconnect dialog changes to cope with asynchronous data loading
- Updated package dependencies.

### Fixed
- Connection: Fix ConnectionStatusCard prop

## 0.15.1 - 2022-02-09
### Added
- Connection: Expose hasConnectedOwner in useConnection hook
- Re organize components stories by project/name

### Changed
- Updated package dependencies

## 0.15.0 - 2022-02-02
### Added
- Added user click tracking to disconnect dialog modal.

### Changed
- Updated package dependencies.

### Fixed
- Fix access to display_name property in connection status card.

## 0.14.0 - 2022-01-25
### Changed
- Enforces the usage of initial state
- Update h3 style for connection status card

### Fixed
- Fix Wrong spelling of propTypes in ConnectedPlugins
- Make redirectUri property not be required in ConnectionStatusCard

## 0.13.2 - 2022-01-18
### Changed
- General: update required node version to v16.13.2

### Fixed
- fixed babel/preset-react dependency

## 0.13.1 - 2022-01-17
### Changed
- Updated package dependencies.

### Fixed
- Fixed styling on Required Plan button and Login link.

## 0.13.0 - 2022-01-13
### Changed
- Added user data to initial state

## 0.12.1 - 2022-01-11
### Removed
- Remove use of deprecated `~` in sass-loader imports.

## 0.12.0 - 2022-01-04
### Changed
- Changed min-width of log in link
- Connection: Extract connection logic for custom hook
- Drop isRegistered and isUserConnected params from ConnectionStatusCard component
- Updated package dependencies.

## 0.11.3 - 2021-12-14
### Fixed
- Fix JavaScript i18n strings.

## 0.11.2 - 2021-12-07
### Changed
- Updated package dependencies.

## 0.11.1 - 2021-12-06
### Fixed
- Style updates to improve disconnect flow appearance when Gutenberg plugin is active

## 0.11.0 - 2021-11-30
### Added
- Added a ContextualizedConnection component to display a connection screen that can be used to give context to the user why Jetpack would benefit them.
- Fetches the initial state from the global variable provided by the connection package

### Changed
- Extend functionality of the disconnect modal to allow it to be used in more contexts
- moved the registerSite logic into the store
- Updated package dependencies.

### Fixed
- ConnectScreen: Fix custom grid and background color.
- ConnectScreen: make button full width on small viewports

## 0.10.2 - 2021-11-23
### Changed
- Import RNA styles from base styles package.
- Updated package dependencies

### Fixed
- revert button width change in favor of the fix in the visual element

## 0.10.1 - 2021-11-17
### Changed
- Updated package dependencies.

## 0.10.0 - 2021-11-16
### Added
- Remove the withConnectionStatus HOC, export the store.

### Changed
- Updated package dependencies

### Fixed
- Button styles: ensure the button can accomodate longer text.

## 0.9.1 - 2021-11-09
### Changed
- Updated package dependencies.

## 0.9.0 - 2021-11-02
### Added
- Add ConnectScreenRequiredPlan component.

### Changed
- Updated package dependencies.

## 0.8.0 - 2021-10-26
### Changed
- ConnectButton now uses ActionButton component
- Package version bump.
- Updated package dependencies

## 0.7.2 - 2021-10-19
### Changed
- Bump the RNA API version.

## 0.7.1 - 2021-10-13
### Changed
- Updated package dependencies.

## 0.7.0 - 2021-10-12
### Changed
- Bump the RNA API version.

### Removed
- Connection Screen component no longer pulls conneciton status from the API, it only relies on the properties. Use WithConnectionStatus HOC instead.

## 0.6.1 - 2021-09-28
### Added
- Set 'exports' in package.json.

### Changed
- Allow Node ^14.17.6 to be used in this project. This shouldn't change the behavior of the code itself.
- Updated package dependencies.

### Fixed
- Display an error message on site registration failure.

## 0.6.0 - 2021-08-31
### Added
- Add the spinner to the connection button.

### Changed
- Bump version number
- Extract connection status fetching into a higher order component.
- Make redirect URI optional for connection screen and button components.
- Updated package dependencies.
- Use Node 16.7.0 in tooling.

## 0.5.1 - 2021-08-12
### Changed
- Move API calls to jetpack-api package
- Updated package dependencies

### Fixed
- Fix minor styling issues on the connection screen.

## 0.5.0 - 2021-07-27
### Added
- Add Connection Status Card component.
- Add DisconnectDialog RNA component.
- Added the connection screen components, moved connection status callback to properties.

### Changed
- Mark assetBaseUrl as optional for ImageSlider.

## 0.4.0 - 2021-06-29
### Changed
- Remove In-Place Connection flow from the package.
- Rename 'Main' component into 'ConnectButton'
- Update node version requirement to 14.16.1

## 0.3.0 - 2021-06-15
### Added
- Added dev dependency on react (in addition to existing peer dep) for tests to run.
- Added missing dependencies.

### Changed
- Getting rid of the 'authorizeUrl' parameter, retrieving the value via REST API, and extrating the user connection functionality into a separate 'ConnectUser' component.

## 0.2.0 - 2021-05-25
### Added
- Add connection components.

### Changed
- Updated package dependencies.

## 0.1.0 - 2021-04-27
### Added
- `InPlaceConnection` component added.

## 0.2.0 - 2021-05-18

- `Main` and `ConnectUser` components added.
- `JetpackRestApiClient` API client added.
