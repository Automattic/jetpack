import formatCurrency from '@automattic/format-currency';
import domReady from '@wordpress/dom-ready';
import { ENTER } from '@wordpress/keycodes';
import { addQueryArgs, removeQueryArgs } from '@wordpress/url';
import { minimumTransactionAmountForCurrency, parseAmount } from '../../shared/currencies';
import { initializeMembershipButtons } from '../../shared/memberships';

import './view.scss';

class JetpackDonations {
	constructor( block ) {
		this.block = block;
		this.amount = null;
		this.isCustomAmount = false;
		this.interval = 'one-time';

		// Initialize block.
		this.initNavigation();
		this.handleCustomAmount();
		this.handleChosenAmount();

		// Remove loading spinner.
		this.block.querySelector( '.donations__container' ).classList.add( 'loaded' );
	}

	getNavItem( interval ) {
		return this.block.querySelector( `.donations__nav-item[data-interval="${ interval }"]` );
	}

	resetSelectedAmount() {
		const selectedAmount = this.block.querySelector( '.donations__amount.is-selected' );
		if ( selectedAmount ) {
			selectedAmount.classList.remove( 'is-selected' );
		}
	}

	getDonateButton() {
		const buttonIntervalClasses = {
			'one-time': 'donations__one-time-item',
			'1 month': 'donations__monthly-item',
			'1 year': 'donations__annual-item',
		};
		return this.block.querySelector(
			`.donations__donate-button.${ buttonIntervalClasses[ this.interval ] }`
		);
	}

	toggleDonateButton( enable ) {
		const donateButton = this.getDonateButton();
		enable
			? donateButton.classList.remove( 'is-disabled' )
			: donateButton.classList.add( 'is-disabled' );
	}

	updateUrl() {
		const donateButton = this.getDonateButton();
		const url = donateButton.getAttribute( 'href' );
		if ( this.amount ) {
			donateButton.setAttribute(
				'href',
				addQueryArgs( url, {
					amount: this.amount,
					...( this.isCustomAmount && { customAmount: true } ),
				} )
			);
		} else {
			donateButton.setAttribute( 'href', removeQueryArgs( url, 'amount', 'customAmount' ) );
		}
	}

	updateAmountFromCustomAmountInput() {
		const input = this.block.querySelector( '.donations__custom-amount .donations__amount-value' );
		const wrapper = this.block.querySelector( '.donations__custom-amount' );

		const amount = input.innerHTML;
		if ( ! amount ) {
			this.amount = null;
			this.toggleDonateButton( false );
			return;
		}

		// Validates the amount.
		const currency = input.dataset.currency;
		const parsedAmount = parseAmount( amount, currency );
		if ( parsedAmount && parsedAmount >= minimumTransactionAmountForCurrency( currency ) ) {
			wrapper.classList.remove( 'has-error' );
			this.amount = parsedAmount;
			this.toggleDonateButton( true );
		} else {
			wrapper.classList.add( 'has-error' );
			this.amount = null;
			this.toggleDonateButton( false );
		}
		this.updateUrl();
	}

	initNavigation() {
		const navItems = this.block.querySelectorAll( '.donations__nav-item' );
		const tabContent = this.block.querySelector( '.donations__tab' );
		const tabContentClasses = {
			'one-time': 'is-one-time',
			'1 month': 'is-monthly',
			'1 year': 'is-annual',
		};

		const handleClick = event => {
			// Update selected interval.
			const prevInterval = this.interval;
			const newInterval = event.target.dataset.interval;
			this.interval = newInterval;

			// Toggle nav item.
			const prevNavItem = this.getNavItem( prevInterval );
			if ( prevNavItem ) {
				prevNavItem.classList.remove( 'is-active' );
			}
			const newNavItem = this.getNavItem( newInterval );
			if ( newNavItem ) {
				newNavItem.classList.add( 'is-active' );
			}

			// Toggle tab content.
			tabContent.classList.remove( tabContentClasses[ prevInterval ] );
			tabContent.classList.add( tabContentClasses[ newInterval ] );

			// Reset chosen amount.
			this.amount = null;
			this.isCustomAmount = false;
			this.resetSelectedAmount();
			this.updateUrl();

			// Disable donate button.
			this.toggleDonateButton( false );
		};

		navItems.forEach( navItem => {
			navItem.addEventListener( 'click', handleClick );
			navItem.addEventListener( 'keydown', handleClick );
		} );

		// Activates the default tab on first execution.
		const navItem = this.getNavItem( this.interval );
		if ( navItem ) {
			navItem.classList.add( 'is-active' );
		}
		tabContent.classList.add( tabContentClasses[ this.interval ] );
	}

	handleCustomAmount() {
		const input = this.block.querySelector( '.donations__custom-amount .donations__amount-value' );
		if ( ! input ) {
			return;
		}

		const wrapper = this.block.querySelector( '.donations__custom-amount' );

		// Make input editable.
		input.setAttribute( 'contenteditable', '' );

		// Prevent new lines.
		input.addEventListener( 'keydown', event => {
			if ( event.keyCode === ENTER ) {
				event.preventDefault();
			}
		} );

		input.addEventListener( 'focus', () => {
			// Toggle selected amount.
			this.resetSelectedAmount();
			wrapper.classList.add( 'is-selected' );

			if ( this.isCustomAmount ) {
				return;
			}
			this.isCustomAmount = true;
			this.updateAmountFromCustomAmountInput();
		} );

		input.addEventListener( 'blur', () => {
			if ( ! this.isCustomAmount || ! this.amount ) {
				return;
			}

			// Formats the entered amount.
			input.innerHTML = formatCurrency( this.amount, input.dataset.currency, {
				symbol: '',
			} );
		} );

		input.addEventListener( 'input', () => this.updateAmountFromCustomAmountInput() );
	}

	handleChosenAmount() {
		const prefixedAmounts = this.block.querySelectorAll(
			'.donations__amount:not( .donations__custom-amount )'
		);
		prefixedAmounts.forEach( amount => {
			amount.addEventListener( 'click', event => {
				// Toggle amount.
				this.resetSelectedAmount();
				event.target.classList.add( 'is-selected' );
				this.amount = event.target.dataset.amount;
				this.isCustomAmount = false;
				const customAmountWrapper = this.block.querySelector( '.donations__custom-amount' );
				if ( customAmountWrapper ) {
					customAmountWrapper.classList.remove( 'has-error' );
				}
				this.updateUrl();

				// Enables the donate button.
				const donateButton = this.getDonateButton();
				donateButton.classList.remove( 'is-disabled' );
			} );
		} );

		// Disable all buttons on init since no amount has been chosen yet.
		this.block
			.querySelectorAll( '.donations__donate-button' )
			.forEach( button => button.classList.add( 'is-disabled' ) );
	}
}

domReady( () => {
	const blocks = document.querySelectorAll( '.wp-block-jetpack-donations' );
	blocks.forEach( block => new JetpackDonations( block ) );
	initializeMembershipButtons( '.donations__donate-button' );
} );
