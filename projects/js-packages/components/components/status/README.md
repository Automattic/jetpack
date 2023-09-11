= Status

A simple component to display a status indicator.

## Usage

```jsx
import { Status } from '@automattic/jetpack-components';

function MyComponent() {
    return (
        <>
            { /* Default status is "inactive". */}
            <Status />

            { /* You can also pass a status prop to display a different status. */}
            <Status status="active" />

            { /* You can also pass a label prop to display a label beside the status indicator. */}
            <Status status="error" label="Connection Error" />
        </>
    );
}
```

## Props

### status

Optional. The status to display. It can be one of the following:

-   `active`
-   `inactive`
-   `error`

Defaults to `inactive`.

### label

Optional. The label to display beside the status indicator. 

If none is provided, the name of the status will be used by default (i.e. "Active"). Pass an empty string to hide the label.
