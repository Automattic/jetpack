import App from '../../_inc/app';

// `@wordpress/build` mounts the route's exported `stage`. The SEO app owns its
// own chrome (`AdminPage`) and reads its bootstrapped state synchronously, so
// the stage is just the app root.
export { App as stage };
