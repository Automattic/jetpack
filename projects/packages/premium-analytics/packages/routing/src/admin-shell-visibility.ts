/**
 * Internal dependencies
 */
import { DASHBOARD_PAGE_SLUG } from './dashboard-href';

let hidden = false;
let pending: Array< () => void > = [];
let listening = false;

const pageOf = ( event: Event ) => ( event as CustomEvent< { page?: string } > ).detail?.page;

const listen = () => {
	listening = true;
	window.addEventListener( 'jetpack-admin-shell:page-hidden', event => {
		if ( pageOf( event ) === DASHBOARD_PAGE_SLUG ) {
			hidden = true;
		}
	} );
	window.addEventListener( 'jetpack-admin-shell:page-shown', event => {
		if ( pageOf( event ) !== DASHBOARD_PAGE_SLUG ) {
			return;
		}
		hidden = false;
		const writes = pending;
		pending = [];
		writes.forEach( write => write() );
	} );
};

/**
 * Write the URL now, or once the admin shell shows the dashboard again.
 *
 * The router builds its URL on the address bar, so while another dashboard is on screen it would write onto that one's URL.
 *
 * @param write - Writes the URL.
 */
export function whenDashboardShown( write: () => void ): void {
	if ( ! listening ) {
		listen();
	}
	if ( hidden ) {
		pending.push( write );
		return;
	}
	write();
}
