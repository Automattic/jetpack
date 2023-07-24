# PluginDashItem Component

PluginDashItem is used to display an upsell for another plugin on the Jetpack AAG Dashboard.

## Usage

```jsx
import PluginDashItem from 'components/plugin-dash-item';

export default BoostDashItem = () =>
	<PluginDashItem
		pluginName="Boost"
		pluginFiles={ [ 'jetpack-boost/jetpack-boost.php' ] }
		pluginSlug={ 'jetpack-boost' }
		pluginLink={ this.props.siteAdminUrl + 'admin.php?page=jetpack-boost' }
		installOrActivatePrompt={ createInterpolateElement(
			__(
				'Improve your site’s performance and SEO in a few clicks with the free Jetpack Boost plugin.<br /><ExternalLink>Learn more</ExternalLink>',
				'jetpack'
			),
			{
				ExternalLink: <ExternalLink href={ getRedirectUrl( 'stats-nudges-boost-learn' ) } />,
				br: <br />,
			}
		) }
	/>;

```

## Props

### pluginName
- **Type:** `String`
- **Required:** `yes`

The display name for the Plugin. Does not need to match the name of the plugin exactly.

### pluginFiles
- **Type:** `String[]`
- **Required:** `yes`

The exact path to the plugin(s). Used to detect if the plugin is installed. Can contain multiple paths, in which case each is checked.

### pluginSlug
- **Type:** `String`
- **Required:** `yes`

The exact slug of the plugin. Used to install and activate the plugin.

### pluginLink
- **Type:** `String`
- **Required:** `yes`

Link to an admin page for the plugin. Used in the "manage" link for the card after the plugin is installed.

### installOrActivatePrompt
- **Type:** `Element`
- **Required:** `yes`

React prompt to show when Plugin is un-installed or un-activated.

### installedPrompt
- **Type:** `Element`
- **Required:** `no`

React prompt to show when Plugin is installed and activated

### iconAlt
- **Type:** `String`
- **Required:** `no`

Icon alt to use with custom icon for plugin ( see `iconSrc` ).

### iconSrc
- **Type:** `String`
- **Required:** `no`

Custom icon for dash item. Is given to `src` of img.