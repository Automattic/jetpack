/**
 * External dependencies
 */
import domReady from '@wordpress/dom-ready';

/**
 * Style dependencies
 */
import './view.scss';

const initNavigation = () => {
	let activeTab = 'one-time';
	const tabClasses = {
		'one-time': 'is-one-time',
		'1 month': 'is-monthly',
		'1 year': 'is-annual',
	};

	const navItems = document.querySelectorAll( '.wp-block-jetpack-donations .donations__nav-item' );
	const tabContent = document.querySelector( '.wp-block-jetpack-donations .donations__tab' );

	navItems.forEach( navItem => {
		navItem.addEventListener( 'click', event => {
			// Toggle nav item.
			document
				.querySelector( '.wp-block-jetpack-donations .donations__nav-item.is-active' )
				.classList.remove( 'is-active' );
			event.target.classList.add( 'is-active' );

			// Toggle tab.
			tabContent.classList.remove( tabClasses[ activeTab ] );
			activeTab = event.target.dataset.interval;
			tabContent.classList.add( tabClasses[ activeTab ] );
		} );
	} );

	// Activates the default tab on first execution.
	document
		.querySelector(
			`.wp-block-jetpack-donations .donations__nav-item[data-interval="${ activeTab }"]`
		)
		.classList.add( 'is-active' );
	tabContent.classList.add( tabClasses[ activeTab ] );
};

domReady( () => {
	initNavigation();
} );
