import App from '../../src/js/app';

// `@wordpress/build` mounts the route's exported `stage`. The Beta app owns its
// own chrome (`AdminPage`) and reads its bootstrapped state synchronously, so
// the stage is just the app root. The active screen (plugin list vs. manage) is
// chosen from the `?plugin=` search param inside the app.
export { App as stage };
