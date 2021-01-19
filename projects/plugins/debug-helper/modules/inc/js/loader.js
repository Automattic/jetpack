/**
 * Initialize the loader object, and retrieve the `on()` and `off()` methods.
 *
 * @param {Element} button - The button HTMLElement
 * @returns {{off: Function, on: Function}} The loader button.
 */
export default function loaderButton( button ) {
	const label = button.innerHTML;
	let interval = null;

	return {
		on: () => {
			if ( null === interval ) {
				button.setAttribute( 'disabled', 'disabled' );
				button.innerHTML = '.';
				let dotCount = 1;

				interval = setInterval( () => {
					if ( dotCount > 3 ) {
						dotCount = 0;
						button.innerHTML = '';
					}

					++dotCount;
					button.innerHTML += '.';
				}, 500 );
			}
		},
		off: () => {
			clearInterval( interval );
			interval = null;
			button.innerHTML = label;
			button.removeAttribute( 'disabled' );
		},
	};
}
