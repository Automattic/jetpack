/**
 * External dependencies
 */
import domReady from '@wordpress/dom-ready';

/**
 * Internal dependencies
 */
import { parseAmount } from './amount';
import { minimumTransactionAmountForCurrency } from '../../shared/currencies';

/**
 * Style dependencies
 */
import './view.scss';
import formatCurrency from '@automattic/format-currency';

const initNavigation = () => {
	let activeTab = 'one-time';
	const tabClasses = {
		'one-time': 'is-one-time',
		'1 month': 'is-monthly',
		'1 year': 'is-annual',
	};

	const navItems = document.querySelectorAll( '.wp-block-jetpack-donations .donations__nav-item' );
	const tabContent = document.querySelector( '.wp-block-jetpack-donations .donations__tab' );

	const handleClick = event => {
		// Toggle nav item.
		document
			.querySelector( '.wp-block-jetpack-donations .donations__nav-item.is-active' )
			.classList.remove( 'is-active' );
		event.target.classList.add( 'is-active' );

		// Toggle tab.
		tabContent.classList.remove( tabClasses[ activeTab ] );
		activeTab = event.target.dataset.interval;
		tabContent.classList.add( tabClasses[ activeTab ] );
	};

	navItems.forEach( navItem => {
		navItem.addEventListener( 'click', handleClick );
		navItem.addEventListener( 'keydown', handleClick );
	} );

	// Activates the default tab on first execution.
	document
		.querySelector(
			`.wp-block-jetpack-donations .donations__nav-item[data-interval="${ activeTab }"]`
		)
		.classList.add( 'is-active' );
	tabContent.classList.add( tabClasses[ activeTab ] );
};

const handleCustomAmount = () => {
	const input = document.querySelector(
		'.wp-block-jetpack-donations .donations__custom-amount .donations__amount-value'
	);
	if ( ! input ) {
		return;
	}

	const wrapper = document.querySelector( '.wp-block-jetpack-donations .donations__custom-amount' );

	// Make input editable.
	input.setAttribute( 'contenteditable', '' );

	// Prevent new lines.
	input.addEventListener( 'keydown', event => {
		if ( event.keyCode === 13 ) {
			event.preventDefault();
		}
	} );

	// Add focus styles to wrapper element.
	input.addEventListener( 'focus', () => wrapper.classList.add( 'has-focus' ) );
	input.addEventListener( 'blur', () => wrapper.classList.remove( 'has-focus' ) );

	// Validates the amount.
	input.addEventListener( 'input', () => {
		const amount = input.innerHTML;
		const currency = input.dataset.currency;
		const parsedAmount = parseAmount( amount, currency );
		if ( parsedAmount && parsedAmount >= minimumTransactionAmountForCurrency( currency ) ) {
			wrapper.classList.remove( 'has-error' );
			input.dataset.amount = parsedAmount;
		} else if ( amount ) {
			wrapper.classList.add( 'has-error' );
			delete input.dataset.amount;
		}
	} );

	// Formats the entered amount.
	input.addEventListener( 'blur', () => {
		if ( ! input.dataset.amount ) {
			return;
		}

		input.innerHTML = formatCurrency( input.dataset.amount, input.dataset.currency, {
			symbol: '',
		} );
	} );
};

domReady( () => {
	initNavigation();
	handleCustomAmount();
} );
