/**
 * Adjusts the height of the dashboard container to the available height, including WP notices.
 *
 * @param container - The container element to adjust the height of.
 */
export const adjustDashboardHeight = ( container: HTMLElement ) => {
	const applyDynamicHeight = () => {
		const rect = container.getBoundingClientRect();
		const availableHeight = Math.max( window.innerHeight - rect.top, 0 );

		container.style.height = `${ availableHeight }px`;
	};

	requestAnimationFrame( () => {
		applyDynamicHeight();
	} );

	const resizeHandler = () => applyDynamicHeight();
	window.addEventListener( 'resize', resizeHandler );

	const wpBody = document.getElementById( 'wpbody-content' ) ?? document.body;

	const observer = new MutationObserver( mutations => {
		if ( mutations.some( mutation => mutation.type === 'childList' ) ) {
			applyDynamicHeight();
		}
	} );

	observer.observe( wpBody, { childList: true } );
};
