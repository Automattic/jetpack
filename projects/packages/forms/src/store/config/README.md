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
  const hasFeedback = useConfigValue('hasFeedback');

  return hasFeedback ? <ResponsesPanel /> : <EmptyState />;
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
  const canInstall = useSelect(
    select => select(CONFIG_STORE).getConfigValue('canInstallPlugins'),
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

1. **Automatic Fetching**: The first time you access config data, the store automatically fetches it from `/wp/v2/feedback/config`
2. **Caching**: Once fetched, the config is cached in the Redux store and won't be re-fetched unless you explicitly invalidate it
3. **Request Deduplication**: Multiple simultaneous calls to `useConfigValue()` with different keys trigger only ONE API request
4. **Resolvers**: The store uses WordPress data resolvers to handle async fetching automatically
5. **Type Safety**: Full TypeScript support ensures you only access valid config keys

### Resolver Behavior

The config store has one resolver: `getConfig`

**How `useConfigValue` works:**

When you call `useConfigValue('blogId')`:
1. The hook internally calls `getConfig()` selector to fetch the entire config object
2. WordPress automatically triggers the `getConfig` resolver if config isn't loaded
3. The resolver checks if config is already loaded or currently loading via `isFulfilled`
4. If not loaded, it fetches from `/wp/v2/feedback/config`
5. Once loaded, it returns the value for the specific key (`config.blogId`)
6. Subsequent calls to `useConfigValue()` with any key use the cached config

**Request Deduplication:**

Multiple components calling different config values simultaneously:
```typescript
// Component A
const siteURL = useConfigValue('siteURL');

// Component B
const blogId = useConfigValue('blogId');

// Component C
const canInstall = useConfigValue('canInstallPlugins');
```

All three calls trigger the same `getConfig` resolver, but the resolver's `isFulfilled` check ensures only ONE API request is made. All components receive their respective values from the same fetched config object.

## Benefits

- **Performance**: Config is fetched once and cached, avoiding redundant API calls
- **Request Deduplication**: Multiple simultaneous calls with different keys result in only one API request
- **Consistency**: All components get the same config data from a single source
- **Type Safety**: TypeScript autocomplete helps you use the correct config keys
- **Async by Default**: All config fetching happens asynchronously without blocking UI
- **Error Handling**: Built-in loading and error states make it easy to handle failures
- **Standard Pattern**: Follows WordPress data API best practices

## Implementation Details

### isFulfilled Check

The resolver uses an `isFulfilled` function to prevent duplicate requests:

```typescript
isFulfilled: (state: ConfigState) => {
  // Consider fulfilled if config exists or is currently loading
  return state.config !== null || state.isLoading;
}
```

This ensures that:
- If config is already loaded, no fetch occurs
- If a fetch is in progress (`isLoading: true`), subsequent calls wait for the same fetch
- Only the first call actually triggers the API request

### Store Structure

```typescript
type ConfigState = {
  config: Partial<FormsConfigData> | null;
  isLoading: boolean;
  error: string | null;
};
```

## Adding a New Config Key

To add a new configuration value to the config store, follow these steps:

### 1. Update the PHP Endpoint

First, add your new config value to the REST API endpoint response. In the Forms package, this is typically done in the endpoint handler:

```php
// src/contact-form/class-contact-form-endpoint.php
public function get_config() {
    return array(
        'isMailPoetEnabled' => $this->is_mailpoet_enabled(),
        // Add your new key here
        'myNewFeature' => $this->check_my_new_feature(),
    );
}
```

### 2. Update the TypeScript Type Definition

Add the new key to the `FormsConfigData` interface in `src/types/index.ts`:

```typescript
export interface FormsConfigData {
    /** Whether MailPoet integration is enabled across contexts. */
    isMailPoetEnabled?: boolean;

    // Add your new key here with appropriate doc

    /** Whether my new feature is enabled. */
    myNewFeature?: boolean; // Add your new key with proper JSDoc

    // ... other keys
}
```

**Important Notes:**
- Add JSDoc comments to document what the config value represents
- Use optional properties (`?`) since not all config values may be present in all contexts
- Use appropriate TypeScript types (`boolean`, `string`, `number`, etc.)

### 3. Update the README

Add your new config key to the "Available Config Keys" section above:

```markdown
- `myNewFeature` - Whether my new feature is enabled
```

### 4. Use the New Config Value

Now you can use your new config value in any component:

```typescript
import useConfigValue from '../hooks/use-config-value';

function MyComponent() {
  const myNewFeature = useConfigValue('myNewFeature');

  if (myNewFeature === undefined) {
    return <Spinner />;
  }

  return myNewFeature ? <NewFeature /> : <OldFeature />;
}
```

### Complete Example

Here's a complete example of adding a new `showBetaFeatures` config:

**1. PHP (endpoint):**
```php
return array(
    'showBetaFeatures' => current_user_can('manage_options') && get_option('jetpack_forms_beta_features', false),
);
```

**2. TypeScript (`src/types/index.ts`):**
```typescript
export interface FormsConfigData {
    /** Whether beta features should be shown to the current user. */
    showBetaFeatures?: boolean;
    // ... other keys
}
```

**3. README:**
```markdown
- `showBetaFeatures` - Whether beta features should be shown to the current user
```

**4. Usage:**
```typescript
function BetaFeatureToggle() {
  const showBeta = useConfigValue('showBetaFeatures');

  return showBeta && <BetaFeaturesPanel />;
}
```
