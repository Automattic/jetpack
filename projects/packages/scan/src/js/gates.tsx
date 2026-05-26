import type { FC, ReactNode } from 'react';

/**
 * Gate screen — pass-through wrapper for the overview tree. Connection
 * gating already happens server-side in `Jetpack_Scan::is_available()`
 * (the wp-admin menu doesn't register at all on disconnected sites), so
 * by the time this component renders the user is, by definition, on a
 * connected site.
 *
 * Kept as a thin component to leave a clear seam for future plan-level
 * gating (Scan plan presence, single-site/multisite, etc.) without
 * threading more conditional rendering through `stage.tsx`.
 *
 * @param root0          - Component props.
 * @param root0.children - The wrapped overview tree.
 * @return The wrapped tree.
 */
const Gates: FC< { children: ReactNode } > = ( { children } ) => <>{ children }</>;

export default Gates;
