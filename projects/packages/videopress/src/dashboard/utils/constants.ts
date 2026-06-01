// Path *relative* to wp-admin, not an absolute URL: the connection REST
// endpoint resolves it server-side with `admin_url( $redirect_uri )`. An
// absolute URL would be appended onto the wp-admin base, producing a doubled,
// broken redirect (`…/wp-admin/https:/…/wp-admin/…`) that 404s. Matches the
// legacy dashboard, which passed the relative `adminUri` from its initial state.
export const VIDEOPRESS_ADMIN_PAGE = 'admin.php?page=jetpack-videopress';
