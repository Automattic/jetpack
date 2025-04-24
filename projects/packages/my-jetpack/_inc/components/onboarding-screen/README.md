# Onboarding Screen

The Onboarding Screen component provides a user interface for connecting sites to WordPress.com, either for regular sites or Atomic (WordPress.com) sites.

## Usage

### Regular Site Connection

For regular sites, simply render the component without any props:

```jsx
import OnboardingScreen from 'path/to/onboarding-screen';

const MyComponent = () => {
  return <OnboardingScreen />;
};
```

### Atomic Site Connection (WoA)

For Atomic sites (WordPress.com on Atomic infrastructure), pass the `isAtomic` prop:

```jsx
import OnboardingScreen from 'path/to/onboarding-screen';

const MyComponent = () => {
  return <OnboardingScreen isAtomic={true} />;
};
```

This will render the Atomic version of the connection form, which includes:
- A "Reconnect your site" title
- A reconnect button 
- An "Auto-reconnect in the future" checkbox

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isAtomic` | boolean | `false` | Whether to display the Atomic (WoA) version of the connection form |

## Development Notes

The Atomic version of the connection form does not currently have active functionality - the button and checkbox are placeholders that can be enhanced with actual reconnection functionality in the future. 