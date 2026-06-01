import formatCurrency from '@automattic/format-currency';
import domReady from '@wordpress/dom-ready';
import { addQueryArgs, removeQueryArgs } from '@wordpress/url';
import { minimumTransactionAmountForCurrency, parseAmount } from '../../shared/currencies';
import { initializeMembershipButtons } from '../../shared/memberships';
import { checkAmountRange as checkRange } from './utils';

import './view.scss';

const INTERVAL_TO_AMOUNT_CLASS = {
	'one-time': 'donations__one-time-item',
	'1 month': 'donations__monthly-item',
	'1 year': 'donations__annual-item',
};

class JetpackDonations {
	constructor( block ) {
		this.block = block;
		this.amount = null;
		this.isCustomAmount = false;
		this.interval = block.dataset.defaultInterval || 'one-time';
		this.minAmount = block.dataset.minAmount ? parseFloat( block.dataset.minAmount ) : null;
		this.maxAmount = block.dataset.maxAmount ? parseFloat( block.dataset.maxAmount ) : null;
		this.minError = block.dataset.minError || '';
		this.maxError = block.dataset.maxError || '';
		this.stripeMinError = block.dataset.stripeMinError || '';

		// Initialize block.
		this.initNavigation();
		this.handleCustomAmount();
		this.handleChosenAmount();
		this.applyDefaultAmount( this.interval );

		// Remove loading spinner.
		this.block.querySelector( '.donations__container' ).classList.add( 'loaded' );
	}

	applyDefaultAmount( interval, isUserInitiated = false ) {
		const amountClass = INTERVAL_TO_AMOUNT_CLASS[ interval ];
		if ( ! amountClass ) {
			return;
		}
		const wrapper = this.block.querySelector( `.donations__amounts.${ amountClass }` );
		if ( ! wrapper || wrapper.dataset.defaultIndex === undefined ) {
			return;
		}
		const index = parseInt( wrapper.dataset.defaultIndex, 10 );
		const tile = wrapper.querySelectorAll( '.donations__amount:not( .donations__custom-amount )' )[
			index
		];
		if ( ! tile ) {
			return;
		}
		this.resetSelectedAmount();
		tile.classList.add( 'is-selected' );
		this.amount = tile.dataset.amount;
		this.isCustomAmount = false;
		this.updateUrl();
		const defaultRangeError = this.checkAmountRange( parseFloat( tile.dataset.amount ) );
		if ( defaultRangeError ) {
			if ( isUserInitiated ) {
				this.showRangeError( defaultRangeError );
			}
			this.toggleDonateButton( false );
		} else {
			this.toggleDonateButton( true );
		}
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
		if ( enable ) {
			donateButton.classList.remove( 'is-disabled' );
			donateButton.removeAttribute( 'aria-disabled' );
			donateButton.removeAttribute( 'tabindex' );
		} else {
			donateButton.classList.add( 'is-disabled' );
			donateButton.setAttribute( 'aria-disabled', 'true' );
			donateButton.setAttribute( 'tabindex', '-1' );
		}
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

		const amount = input.innerHTML;
		if ( ! amount ) {
			this.amount = null;
			this.toggleDonateButton( false );
			return;
		}

		// Validates the amount.
		const currency = input.dataset.currency;
		const parsedAmount = parseAmount( amount, currency );
		const wrapper = this.block.querySelector( '.donations__custom-amount' );
		if ( parsedAmount && parsedAmount >= minimumTransactionAmountForCurrency( currency ) ) {
			wrapper.classList.remove( 'has-error' );
			this.amount = parsedAmount;
			const customRangeError = this.checkAmountRange( parsedAmount );
			if ( customRangeError ) {
				this.showRangeError( customRangeError );
				this.toggleDonateButton( false );
			} else {
				this.clearRangeError();
				this.toggleDonateButton( true );
			}
		} else {
			wrapper.classList.add( 'has-error' );
			if ( parsedAmount && parsedAmount > 0 ) {
				this.showRangeError( this.stripeMinError );
			} else {
				this.clearRangeError();
			}
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
			this.clearRangeError();

			// Disable donate button.
			this.toggleDonateButton( false );

			// Apply the new tab's default amount, if one is configured.
			this.applyDefaultAmount( newInterval, true );
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
			if ( event.key === 'Enter' ) {
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

				const rangeError = this.checkAmountRange( parseFloat( event.target.dataset.amount ) );
				if ( rangeError ) {
					this.showRangeError( rangeError );
					this.toggleDonateButton( false );
				} else {
					this.clearRangeError();
					this.toggleDonateButton( true );
				}
			} );
		} );

		// Disable all buttons on init since no amount has been chosen yet.
		// Also attach a click guard before memberships.js adds its handler, so
		// keyboard and AT users cannot activate a disabled button.
		this.block.querySelectorAll( '.donations__donate-button' ).forEach( button => {
			button.classList.add( 'is-disabled' );
			button.setAttribute( 'aria-disabled', 'true' );
			button.setAttribute( 'tabindex', '-1' );
			button.addEventListener( 'click', event => {
				if ( button.getAttribute( 'aria-disabled' ) === 'true' ) {
					event.preventDefault();
					event.stopImmediatePropagation();
				}
			} );
		} );
	}

	checkAmountRange( amount ) {
		return checkRange( amount, this.minAmount, this.maxAmount, this.minError, this.maxError );
	}

	showRangeError( message ) {
		const el = this.block.querySelector( '.donations__range-error' );
		if ( el ) {
			el.setAttribute( 'role', 'alert' );
			el.textContent = message;
			el.classList.add( 'is-visible' );
		}
	}

	clearRangeError() {
		const el = this.block.querySelector( '.donations__range-error' );
		if ( el ) {
			el.removeAttribute( 'role' );
			el.textContent = '';
			el.classList.remove( 'is-visible' );
		}
	}
}

class JetpackDonationsModal {
	constructor( block ) {
		this.block = block;
		this.trigger = block.querySelector( '.donations__trigger-button' );
		this.overlay = block.querySelector( '.donations__modal-overlay' );
		this.closeBtn = block.querySelector( '.donations__modal-close' );

		if ( ! this.trigger || ! this.overlay ) {
			return;
		}

		this.trigger.addEventListener( 'click', () => this.open() );
		this.closeBtn?.addEventListener( 'click', () => this.close() );
		this.overlay.addEventListener( 'click', event => {
			if ( event.target === this.overlay ) {
				this.close();
			}
		} );
		document.addEventListener( 'keydown', event => {
			if ( event.key === 'Escape' && ! this.overlay.hidden ) {
				this.close();
			}
		} );
	}

	open() {
		this.overlay.hidden = false;
		this.overlay.ownerDocument.body.classList.add( 'donations-modal-open' );
		this._previousFocus = this.overlay.ownerDocument.activeElement;
		const firstFocusable = this.overlay.querySelector(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		);
		firstFocusable?.focus();
		this.overlay.addEventListener( 'keydown', this._trapFocus );
	}

	close() {
		this.overlay.hidden = true;
		this.overlay.ownerDocument.body.classList.remove( 'donations-modal-open' );
		this.overlay.removeEventListener( 'keydown', this._trapFocus );
		this._previousFocus?.focus();
	}

	_trapFocus = event => {
		if ( event.key !== 'Tab' ) {
			return;
		}
		const focusable = Array.from(
			this.overlay.querySelectorAll(
				'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
			)
		).filter( el => ! el.closest( '[hidden]' ) );
		if ( ! focusable.length ) {
			return;
		}
		const first = focusable[ 0 ];
		const last = focusable[ focusable.length - 1 ];
		if ( event.shiftKey && this.overlay.ownerDocument.activeElement === first ) {
			event.preventDefault();
			last.focus();
		} else if ( ! event.shiftKey && this.overlay.ownerDocument.activeElement === last ) {
			event.preventDefault();
			first.focus();
		}
	};
}

domReady( () => {
	const blocks = document.querySelectorAll( '.wp-block-jetpack-donations' );
	blocks.forEach( block =>
		block.querySelector( '.donations__modal-overlay' )
			? [ new JetpackDonationsModal( block ), new JetpackDonations( block ) ]
			: new JetpackDonations( block )
	);
	initializeMembershipButtons( '.donations__donate-button' );
} );
