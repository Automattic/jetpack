# useScan()

`useScan()` provides methods for interacting with site scans via the Jetpack Scan API.

## Usage

```js
import { useScan } from '@automattic/jetpack-scan';

// Component that monitors the in-progress scan status until it is complete.
const ScanStatus = () => {
    const { data, fetch } = useScan();

    useEffect( () => {
        fetch(); // Fetch the latest scan results on mount.
    }, [ fetch ] );

    return <p>Current scan state: { data.state }</p>;
};
```
