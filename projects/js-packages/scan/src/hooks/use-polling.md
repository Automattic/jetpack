# usePolling()

`usePolling()` is a hook that repeatedly executes a Promise until specific response criteria is reached.

This can be useful for polling the status of processes such as site scans, threat fixers, credentials availability, et cetera.

## Usage

```js
import { usePolling } from '@automattic/jetpack-scan';

// Component that monitors the in-progress scan status until it is complete.
const ScanStatus = () => {
    const [ status, setStatus ] = useState();

    const { start, stop, stopped } = usePolling({
        callback: API.getScanStatus, // Poll the current scan status from the API.
        handleCallbackResponse: ( response ) => {
            // Update the current status in state.
            setStatus( response.status );

            // Continue polling until the scan is no longer in progress.
            return response.status === 'scanning';
        },
        interval: 5_000, // Poll every 5 seconds.
    });

    useEffect(() => {
        // Start polling when the component mounts.
        start();

        // Clean up: stop polling when the component unmounts.
        return () => stop();
    }, []);

    return <p>Current scan status: { status }</p>;
};
```
