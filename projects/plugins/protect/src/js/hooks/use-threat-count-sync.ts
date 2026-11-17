import { _n, sprintf } from '@wordpress/i18n';
import { useEffect } from 'react';

/**
 * Keep the admin bar threat count and the Protect menu badge in step with the app's threat count.
 *
 * @param {number} count - Active threats.
 */
export default function useThreatCountSync( count: number ) {
	useEffect( () => {
		window.jetpackMenuBadges?.setCount( 'jetpack-protect', count );

		const node = document.getElementById( 'wp-admin-bar-jetpack-protect' );
		if ( ! node ) {
			return;
		}

		node.classList.toggle( 'hidden', ! count );
		const label = node.querySelector( '.ab-label' );
		if ( label ) {
			label.textContent = String( count );
		}
		node.querySelector( 'a' )?.setAttribute(
			'title',
			sprintf(
				// translators: %d is the number of threats found.
				_n(
					'%d threat found by Jetpack Protect',
					'%d threats found by Jetpack Protect',
					count,
					'jetpack-protect'
				),
				count
			)
		);
	}, [ count ] );
}
