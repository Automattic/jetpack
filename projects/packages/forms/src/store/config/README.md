# Forms Config Store

A Redux-style store for managing Jetpack Forms configuration data. The store automatically fetches and caches data from the `/wp/v2/feedback/config` REST API endpoint.

## Overview

The config store provides a centralized way to access Forms configuration data across your application. It handles async fetching, caching, loading states, and errors automatically.

## Quick Start

The simplest way to use the config store is with the `useConfigValue` hook:

```typescript
import useConfigValue from '../hooks/use-config-value';

function MyComponent() {
  const isMailPoetEnabled = useConfigValue('isMailPoetEnabled');
  const hasAI = useConfigValue('hasAI');
  const blogId = useConfigValue('blogId');

  if (isMailPoetEnabled === undefined) {
    return <div>Loading...</div>;
  }

  return <div>MailPoet is {isMailPoetEnabled ? 'enabled' : 'disabled'}</div>;
}
```

## Available Config Keys

The store provides access to the following configuration values (see `FormsConfigData` type):

- `isMailPoetEnabled` - Whether MailPoet integration is enabled
- `isIntegrationsEnabled` - Whether integrations UI is enabled
- `canInstallPlugins` - Whether the current user can install plugins
- `canActivatePlugins` - Whether the current user can activate plugins
- `hasFeedback` - Whether there are any form responses on the site
- `hasAI` - Whether AI Assist features are available
- `formsResponsesUrl` - URL of the Forms responses list in wp-admin
- `blogId` - Current site blog ID
- `gdriveConnectSupportURL` - Support URL for Google Drive connect guidance
- `pluginAssetsURL` - Base URL to static/assets for the Forms package
- `siteURL` - The site suffix/fragment for building admin links
- `dashboardURL` - The dashboard URL with migration acknowledgement parameter
- `exportNonce` - Nonce for exporting feedback responses
- `newFormNonce` - Nonce for creating a new form
- `emptyTrashDays` - Number of days before WordPress permanently deletes trash

## Usage Examples

### Basic Hook Usage

```typescript
import useConfigValue from '../hooks/use-config-value';

function ExampleComponent() {
  const hasAI = useConfigValue('hasAI');

  return hasAI ? <AIFeature /> : <RegularFeature />;
}
```

### Using Multiple Config Values

```typescript
import useConfigValue from '../hooks/use-config-value';

function DashboardSettings() {
  const canInstall = useConfigValue('canInstallPlugins');
  const canActivate = useConfigValue('canActivatePlugins');
  const responsesUrl = useConfigValue('formsResponsesUrl');

  return (
    <div>
      <a href={responsesUrl}>View Responses</a>
      {canInstall && <InstallPluginButton />}
      {canActivate && <ActivatePluginButton />}
    </div>
  );
}
```

### Advanced: Direct Store Access

For more control, you can use the store directly with `@wordpress/data`:

```typescript
import { useSelect, useDispatch } from '@wordpress/data';
import { CONFIG_STORE } from '../store/config';

function AdvancedComponent() {
  // Get the entire config object
  const config = useSelect(
    select => select(CONFIG_STORE).getConfig(),
    []
  );

  // Get a specific value
  const hasAI = useSelect(
    select => select(CONFIG_STORE).getConfigValue('hasAI'),
    []
  );

  // Check loading state
  const isLoading = useSelect(
    select => select(CONFIG_STORE).isConfigLoading(),
    []
  );

  // Get error state
  const error = useSelect(
    select => select(CONFIG_STORE).getConfigError(),
    []
  );

  // Get dispatch actions
  const { refreshConfig, invalidateConfig } = useDispatch(CONFIG_STORE);

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error} />;

  return (
    <div>
      <pre>{JSON.stringify(config, null, 2)}</pre>
      <button onClick={refreshConfig}>Refresh Config</button>
    </div>
  );
}
```

### Handling Loading States

```typescript
import useConfigValue from '../hooks/use-config-value';

function ComponentWithLoading() {
  const blogId = useConfigValue('blogId');

  // Value is undefined while loading or if it doesn't exist
  if (blogId === undefined) {
    return <Spinner />;
  }

  return <div>Blog ID: {blogId}</div>;
}
```

### Force Refresh Config

```typescript
import { useDispatch } from '@wordpress/data';
import { CONFIG_STORE } from '../store/config';

function RefreshButton() {
  const { refreshConfig } = useDispatch(CONFIG_STORE);

  const handleRefresh = async () => {
    await refreshConfig();
    console.log('Config refreshed!');
  };

  return <button onClick={handleRefresh}>Refresh Config</button>;
}
```

### Invalidate Cache

```typescript
import { useDispatch } from '@wordpress/data';
import { CONFIG_STORE } from '../store/config';

function ResetButton() {
  const { invalidateConfig } = useDispatch(CONFIG_STORE);

  // Invalidating will cause the next access to re-fetch
  return <button onClick={invalidateConfig}>Clear Cache</button>;
}
```

## Store API Reference

### Selectors

- `getConfig()` - Returns the entire config object or null if not loaded
- `getConfigValue(key)` - Returns the value for a specific config key
- `isConfigLoading()` - Returns true if config is currently being fetched
- `getConfigError()` - Returns error message if fetch failed, null otherwise

### Actions

- `refreshConfig()` - Force re-fetch the config from the API
- `invalidateConfig()` - Clear the cached config (next access will re-fetch)
- `receiveConfig(config)` - Manually set the config data
- `receiveConfigValue(key, value)` - Manually set a single config value
- `setConfigLoading(isLoading)` - Set the loading state
- `setConfigError(error)` - Set the error state

## How It Works

1. **Automatic Fetching**: The first time you access config data (via `useConfigValue` or `getConfigValue` selector), the store automatically fetches it from `/wp/v2/feedback/config`
2. **Caching**: Once fetched, the config is cached in the Redux store and won't be re-fetched unless you explicitly invalidate it
3. **Resolvers**: The store uses WordPress data resolvers to handle async fetching automatically:
   - `getConfig` resolver: Triggered when calling the `getConfig()` selector
   - `getConfigValue` resolver: Triggered when calling `getConfigValue(key)` selector - only fetches if config is not already loaded
4. **Type Safety**: Full TypeScript support ensures you only access valid config keys

### Resolver Behavior

The config store has two resolvers:

- **`getConfig` resolver**: Always fetches the config from the API
- **`getConfigValue` resolver**: Smart resolver that only fetches if config hasn't been loaded yet

When you use `useConfigValue('hasAI')`:
1. The hook calls the `getConfigValue('hasAI')` selector
2. WordPress automatically triggers the `getConfigValue` resolver
3. The resolver checks if config is already loaded
4. If not loaded, it fetches from `/wp/v2/feedback/config`
5. Once loaded, subsequent calls to any config value use the cached data

