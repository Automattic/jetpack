import BlazeDashboard from '../../src/dashboard/app';

/**
 * wp-build stage: boot mounts this into the page's app container.
 *
 * @return The Blaze Ads dashboard.
 */
const Stage = () => <BlazeDashboard />;

export { Stage as stage };
