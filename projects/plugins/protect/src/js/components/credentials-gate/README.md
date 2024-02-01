# Credentials Gate

The `<CredentialsGate>` component blocks the rendering of its contents when the current site does not have credentials shared with Jetpack.

When credentials are unavailable, the `<CredentialsNeededModal>` component is rendered instead.

## Usage

```jsx
import CredentialsGate from './components/credentials-gate';

const MyCredentialedCompnent = () = (
    <CredentialsGate>
        <p>Only users with credentials will see this message.</p>
    </CredentialsGate>
);
```