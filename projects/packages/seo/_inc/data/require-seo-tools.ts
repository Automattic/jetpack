import { redirect } from '@wordpress/route';
import isSeoToolsActive from './is-seo-tools-active';

/**
 * Route guard for the tabs that need SEO tools: while they are off, Settings is the only tab.
 */
export default function requireSeoTools(): void {
	if ( ! isSeoToolsActive() ) {
		throw redirect( { href: '/settings', replace: true } );
	}
}
