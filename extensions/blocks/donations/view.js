/**
 * External dependencies
 */
import domReady from '@wordpress/dom-ready';
import { addQueryArgs, removeQueryArgs } from '@wordpress/url';

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

let jetpackDonationsAmount = null;
let jetpackDonationsIsCustomAmount = false;
let jetpackDonationsInterval = 'one-time';

const getNavItem = interval =>
	document.querySelector(
		`.wp-block-jetpack-donations .donations__nav-item[data-interval="${ interval }"]`
	);

const resetSelectedAmount = () => {
	const selectedAmount = document.querySelector(
		'.wp-block-jetpack-donations .donations__amount.is-selected'
	);
	if ( selectedAmount ) {
		selectedAmount.classList.remove( 'is-selected' );
	}
};

const getDonateButton = interval => {
	const buttonIntervalClasses = {
		'one-time': 'donations__one-time-item',
		'1 month': 'donations__monthly-item',
		'1 year': 'donations__annual-item',
	};
	return document.querySelector(
		`.wp-block-jetpack-donations .donations__donate-button.${ buttonIntervalClasses[ interval ] }`
	);
};

const updateUrl = () => {
	const donateButton = getDonateButton( jetpackDonationsInterval );
	const url = donateButton.getAttribute( 'href' );
	if ( jetpackDonationsAmount ) {
		donateButton.setAttribute(
			'href',
			addQueryArgs( url, {
				amount: jetpackDonationsAmount,
				customAmount: jetpackDonationsIsCustomAmount,
			} )
		);
	} else {
		donateButton.setAttribute( 'href', removeQueryArgs( url, 'amount', 'customAmount' ) );
	}
};

const jetpackDonationsInitNavigation = () => {
	const navItems = document.querySelectorAll( '.wp-block-jetpack-donations .donations__nav-item' );
	const tabContent = document.querySelector( '.wp-block-jetpack-donations .donations__tab' );
	const tabContentClasses = {
		'one-time': 'is-one-time',
		'1 month': 'is-monthly',
		'1 year': 'is-annual',
	};

	const handleClick = event => {
		// Update selected interval.
		const prevInterval = jetpackDonationsInterval;
		const newInterval = event.target.dataset.interval;
		jetpackDonationsInterval = newInterval;

		// Toggle nav item.
		const prevNavItem = getNavItem( prevInterval );
		prevNavItem.classList.remove( 'is-active' );
		const newNavItem = getNavItem( newInterval );
		newNavItem.classList.add( 'is-active' );

		// Toggle tab content.
		tabContent.classList.remove( tabContentClasses[ prevInterval ] );
		tabContent.classList.add( tabContentClasses[ newInterval ] );

		// Reset chosen amount.
		jetpackDonationsAmount = null;
		resetSelectedAmount();
		updateUrl();

		// Disable donate button.
		const donateButton = getDonateButton( prevInterval );
		donateButton.classList.add( 'is-disabled' );
	};

	navItems.forEach( navItem => {
		navItem.addEventListener( 'click', handleClick );
		navItem.addEventListener( 'keydown', handleClick );
	} );

	// Activates the default tab on first execution.
	const navItem = getNavItem( jetpackDonationsInterval );
	navItem.classList.add( 'is-active' );
	tabContent.classList.add( tabContentClasses[ jetpackDonationsInterval ] );
};

const jetpackDonationsHandleCustomAmount = () => {
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
	input.addEventListener( 'focus', () => {
		wrapper.classList.add( 'has-focus' );
		wrapper.classList.remove( 'is-selected' );
	} );

	input.addEventListener( 'blur', () => {
		// Remove focus styles to wrapper element.
		wrapper.classList.remove( 'has-focus' );

		// Mark custom amount as selected.
		if ( ! jetpackDonationsIsCustomAmount ) {
			return;
		}
		wrapper.classList.add( 'is-selected' );

		// Formats the entered amount.
		if ( ! jetpackDonationsAmount ) {
			return;
		}
		input.innerHTML = formatCurrency( jetpackDonationsAmount, input.dataset.currency, {
			symbol: '',
		} );
	} );

	input.addEventListener( 'input', () => {
		const amount = input.innerHTML;
		if ( ! amount ) {
			if ( jetpackDonationsIsCustomAmount ) {
				const donateButton = getDonateButton( jetpackDonationsInterval );
				donateButton.classList.add( 'is-disabled' );
			}
			return;
		}

		// Toggle selected amount.
		resetSelectedAmount();
		jetpackDonationsIsCustomAmount = true;

		// Validates the amount.
		const currency = input.dataset.currency;
		const parsedAmount = parseAmount( amount, currency );
		if ( parsedAmount && parsedAmount >= minimumTransactionAmountForCurrency( currency ) ) {
			wrapper.classList.remove( 'has-error' );
			jetpackDonationsAmount = parsedAmount;
			const donateButton = getDonateButton( jetpackDonationsInterval );
			donateButton.classList.remove( 'is-disabled' );
		} else {
			wrapper.classList.add( 'has-error' );
			jetpackDonationsAmount = null;
			const donateButton = getDonateButton( jetpackDonationsInterval );
			donateButton.classList.add( 'is-disabled' );
		}
		updateUrl();
	} );
};

const jetpackDonationsHandleChosenAmount = () => {
	const prefixedAmounts = document.querySelectorAll(
		'.wp-block-jetpack-donations .donations__amount:not( .donations__custom-amount )'
	);
	prefixedAmounts.forEach( amount => {
		amount.addEventListener( 'click', event => {
			// Toggle amount.
			resetSelectedAmount();
			event.target.classList.add( 'is-selected' );
			jetpackDonationsAmount = event.target.dataset.amount;
			jetpackDonationsIsCustomAmount = false;
			const customAmountWrapper = document.querySelector(
				'.wp-block-jetpack-donations .donations__custom-amount'
			);
			if ( customAmountWrapper ) {
				customAmountWrapper.classList.remove( 'has-error' );
			}
			updateUrl();

			// Enables donate button.
			const donateButton = getDonateButton( jetpackDonationsInterval );
			donateButton.classList.remove( 'is-disabled' );
		} );
	} );

	// Disable all buttons on init since no amount has been chosen yet.
	document
		.querySelectorAll( '.wp-block-jetpack-donations .donations__donate-button' )
		.forEach( button => button.classList.add( 'is-disabled' ) );
};

domReady( () => {
	jetpackDonationsInitNavigation();
	jetpackDonationsHandleCustomAmount();
	jetpackDonationsHandleChosenAmount();
} );
