/**
 * Simulated checkout for the Jetpack Forms payments prototype.
 *
 * PROTOTYPE. In production this file does not exist: the form opens
 * `extensions/shared/memberships.js`'s <dialog>, which frames WPCOM's real
 * checkout at subscribe.wordpress.com, and listens for its postMessage. Every
 * card field below is fake, nothing is transmitted anywhere, and no money
 * moves. The shape of the interaction — modal opens after submit, resolves to
 * paid or not-paid, the site confirms server-side — is the real one.
 */

const STYLE_ID = 'jetpack-forms-payment-checkout-styles';

const STYLES = `
.jp-forms-checkout__backdrop::backdrop { background: rgba(0,0,0,.6); }
.jp-forms-checkout {
	border: none; border-radius: 12px; padding: 0; width: min(420px, calc(100vw - 32px));
	box-shadow: 0 12px 40px rgba(0,0,0,.25); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
	color: #1e1e1e; background: #fff;
}
.jp-forms-checkout__inner { padding: 24px; }
.jp-forms-checkout__demo {
	background: #fcf0cd; color: #614200; font-size: 12px; font-weight: 600;
	padding: 8px 24px; border-radius: 12px 12px 0 0; text-align: center;
}
.jp-forms-checkout__amount { font-size: 30px; font-weight: 700; margin: 0 0 2px; }
.jp-forms-checkout__caption { font-size: 13px; color: #757575; margin: 0 0 20px; }
.jp-forms-checkout__label { display: block; font-size: 12px; font-weight: 600; margin: 0 0 4px; }
.jp-forms-checkout__field {
	width: 100%; box-sizing: border-box; padding: 10px 12px; margin: 0 0 14px;
	border: 1px solid #dcdcde; border-radius: 4px; font-size: 14px; background: #fff; color: #1e1e1e;
}
.jp-forms-checkout__row { display: flex; gap: 12px; }
.jp-forms-checkout__row > div { flex: 1; }
.jp-forms-checkout__pay {
	width: 100%; padding: 12px; border: none; border-radius: 4px; background: #3858e9; color: #fff;
	font-size: 15px; font-weight: 600; cursor: pointer;
}
.jp-forms-checkout__pay[disabled] { opacity: .6; cursor: default; }
.jp-forms-checkout__later {
	display: block; width: 100%; margin-top: 12px; padding: 8px; border: none; background: none;
	color: #757575; font-size: 13px; cursor: pointer; text-decoration: underline;
}
.jp-forms-checkout__result { text-align: center; padding: 12px 0 4px; }
.jp-forms-checkout__result h3 { margin: 0 0 6px; font-size: 18px; }
.jp-forms-checkout__result p { margin: 0 0 20px; font-size: 13px; color: #757575; }
.jp-forms-checkout__tick { font-size: 40px; line-height: 1; margin-bottom: 10px; }
.jp-forms-checkout__error { color: #b32d2e; font-size: 13px; margin: 0 0 12px; }
@media (prefers-color-scheme: dark) {
	.jp-forms-checkout { background: #1e1e1e; color: #f0f0f0; }
	.jp-forms-checkout__field { background: #2b2b2b; border-color: #4a4a4a; color: #f0f0f0; }
}
`;

/**
 * Inject the checkout styles once.
 *
 * Prototype shortcut: production would ship these through the package's normal
 * style pipeline rather than a runtime <style> tag.
 */
function ensureStyles() {
	if ( document.getElementById( STYLE_ID ) ) {
		return;
	}

	const style = document.createElement( 'style' );
	style.id = STYLE_ID;
	style.textContent = STYLES;
	document.head.appendChild( style );
}

/**
 * Confirm the payment with the site.
 *
 * @param {object} payment - Payment payload from the submission response.
 * @param {string} outcome - 'success' or 'failure'.
 * @return {Promise<Object>} Confirmation result.
 */
async function confirmPayment( payment, outcome ) {
	const response = await fetch( payment.confirmUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		body: JSON.stringify( {
			order_token: payment.orderToken,
			outcome,
		} ),
	} );

	const result = await response.json();

	if ( ! response.ok ) {
		throw new Error( result?.message || 'Payment could not be confirmed.' );
	}

	return result;
}

/**
 * Open the simulated checkout and resolve once the buyer is done with it.
 *
 * Resolves to `{ paid: boolean }`. It never rejects: a buyer who closes the
 * dialog, or a confirmation that fails, is a normal outcome — the response is
 * already saved either way, which is the whole point of the design's
 * entry-first ordering.
 *
 * @param {object} payment - Payment payload from the submission response.
 * @return {Promise<{paid: boolean}>} Outcome.
 */
export function openCheckout( payment ) {
	ensureStyles();

	return new Promise( resolve => {
		const dialog = document.createElement( 'dialog' );
		dialog.className = 'jp-forms-checkout jp-forms-checkout__backdrop';
		dialog.setAttribute( 'aria-label', 'Payment' );

		const renderForm = () => {
			dialog.innerHTML = `
				<div class="jp-forms-checkout__demo">Demo checkout — no card is charged</div>
				<div class="jp-forms-checkout__inner">
					<p class="jp-forms-checkout__amount">${ payment.formattedAmount }</p>
					<p class="jp-forms-checkout__caption">Amount set by the site, not editable here.</p>
					<div class="jp-forms-checkout__error" hidden></div>
					<label class="jp-forms-checkout__label" for="jp-fc-email">Email</label>
					<input class="jp-forms-checkout__field" id="jp-fc-email" type="email" value="demo@example.com" />
					<label class="jp-forms-checkout__label" for="jp-fc-card">Card number</label>
					<input class="jp-forms-checkout__field" id="jp-fc-card" inputmode="numeric" value="4242 4242 4242 4242" />
					<div class="jp-forms-checkout__row">
						<div>
							<label class="jp-forms-checkout__label" for="jp-fc-exp">Expiry</label>
							<input class="jp-forms-checkout__field" id="jp-fc-exp" value="12 / 30" />
						</div>
						<div>
							<label class="jp-forms-checkout__label" for="jp-fc-cvc">CVC</label>
							<input class="jp-forms-checkout__field" id="jp-fc-cvc" value="123" />
						</div>
					</div>
					<button class="jp-forms-checkout__pay" type="button">Pay ${ payment.formattedAmount }</button>
					<button class="jp-forms-checkout__later" type="button">Pay later</button>
				</div>
			`;

			const payButton = dialog.querySelector( '.jp-forms-checkout__pay' );
			const laterButton = dialog.querySelector( '.jp-forms-checkout__later' );
			const errorBox = dialog.querySelector( '.jp-forms-checkout__error' );

			payButton.addEventListener( 'click', async () => {
				payButton.disabled = true;
				payButton.textContent = 'Processing…';
				errorBox.hidden = true;

				try {
					const result = await confirmPayment( payment, 'success' );
					renderResult( 'paid' === result.status );
				} catch ( error ) {
					errorBox.textContent = error.message;
					errorBox.hidden = false;
					payButton.disabled = false;
					payButton.textContent = `Pay ${ payment.formattedAmount }`;
				}
			} );

			laterButton.addEventListener( 'click', () => close( false ) );
		};

		const renderResult = paid => {
			dialog.innerHTML = `
				<div class="jp-forms-checkout__demo">Demo checkout — no card was charged</div>
				<div class="jp-forms-checkout__inner">
					<div class="jp-forms-checkout__result">
						<div class="jp-forms-checkout__tick">${ paid ? '✅' : '⚠️' }</div>
						<h3>${ paid ? 'Payment complete' : 'Payment not completed' }</h3>
						<p>${
							paid
								? 'Your response has been marked as paid.'
								: 'Your response was saved and is waiting for payment.'
						}</p>
						<button class="jp-forms-checkout__pay" type="button">Done</button>
					</div>
				</div>
			`;

			dialog
				.querySelector( '.jp-forms-checkout__pay' )
				.addEventListener( 'click', () => close( paid ) );
		};

		const close = paid => {
			document.body.classList.remove( 'jp-forms-checkout-open' );
			dialog.close();
			dialog.remove();
			resolve( { paid } );
		};

		// Escape / backdrop dismissal counts as "pay later", not as an error.
		dialog.addEventListener( 'cancel', event => {
			event.preventDefault();
			close( false );
		} );

		renderForm();
		document.body.appendChild( dialog );
		document.body.classList.add( 'jp-forms-checkout-open' );
		dialog.showModal();
	} );
}
