<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}
?>
 <div class="jb-deactivation__dialog">
	<div class="jb-deactivation__dialog__content">
		<h1 id="jb-deactivation__dialog__heading">Are you sure you want to deactivate?</h1>
		<div class="jetpack-benefits__general-benefits-section">
			<p class="jp-connection__disconnect-dialog__large-text">Jetpack has many powerful tools that can help you achieve your goals</p>
			<ul class="jetpack-benefits__general-benefits-list">
				<li>Speed up your site and provide mobile-ready images with <a target="_blank" class="components-external-link" href="https://jetpack.com/redirect/?source=jetpack-features-design-content-delivery-network" rel="noopener noreferrer external">our CDN<span data-wp-c16t="true" data-wp-component="VisuallyHidden" class="components-visually-hidden ffcb----ebdfd-0 e19lxcc00" style="border: 0px; clip: rect(1px, 1px, 1px, 1px); clip-path: inset(50%); height: 1px; margin: -1px; overflow: hidden; padding: 0px; position: absolute; width: 1px; overflow-wrap: normal;">(opens in a new tab)</span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" class="components-external-link__icon ffcb----ebdfd-rvs7bx esh4a730" aria-hidden="true" focusable="false"><path d="M18.2 17c0 .7-.6 1.2-1.2 1.2H7c-.7 0-1.2-.6-1.2-1.2V7c0-.7.6-1.2 1.2-1.2h3.2V4.2H7C5.5 4.2 4.2 5.5 4.2 7v10c0 1.5 1.2 2.8 2.8 2.8h10c1.5 0 2.8-1.2 2.8-2.8v-3.6h-1.5V17zM14.9 3v1.5h3.7l-6.4 6.4 1.1 1.1 6.4-6.4v3.7h1.5V3h-6.3z"></path></svg></a></li>
				<li>Block <a target="_blank" class="components-external-link" href="https://jetpack.com/redirect/?source=jetpack-features-brute-force" rel="noopener noreferrer external">brute force attacks<span data-wp-c16t="true" data-wp-component="VisuallyHidden" class="components-visually-hidden ffcb----ebdfd-0 e19lxcc00" style="border: 0px; clip: rect(1px, 1px, 1px, 1px); clip-path: inset(50%); height: 1px; margin: -1px; overflow: hidden; padding: 0px; position: absolute; width: 1px; overflow-wrap: normal;">(opens in a new tab)</span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" class="components-external-link__icon ffcb----ebdfd-rvs7bx esh4a730" aria-hidden="true" focusable="false"><path d="M18.2 17c0 .7-.6 1.2-1.2 1.2H7c-.7 0-1.2-.6-1.2-1.2V7c0-.7.6-1.2 1.2-1.2h3.2V4.2H7C5.5 4.2 4.2 5.5 4.2 7v10c0 1.5 1.2 2.8 2.8 2.8h10c1.5 0 2.8-1.2 2.8-2.8v-3.6h-1.5V17zM14.9 3v1.5h3.7l-6.4 6.4 1.1 1.1 6.4-6.4v3.7h1.5V3h-6.3z"></path></svg></a> and get immediate notifications if your site is down</li>
				<li>Grow your traffic with automated social <a target="_blank" class="components-external-link" href="https://jetpack.com/redirect/?source=jetpack-support-social" rel="noopener noreferrer external">publishing and sharing<span data-wp-c16t="true" data-wp-component="VisuallyHidden" class="components-visually-hidden ffcb----ebdfd-0 e19lxcc00" style="border: 0px; clip: rect(1px, 1px, 1px, 1px); clip-path: inset(50%); height: 1px; margin: -1px; overflow: hidden; padding: 0px; position: absolute; width: 1px; overflow-wrap: normal;">(opens in a new tab)</span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" class="components-external-link__icon ffcb----ebdfd-rvs7bx esh4a730" aria-hidden="true" focusable="false"><path d="M18.2 17c0 .7-.6 1.2-1.2 1.2H7c-.7 0-1.2-.6-1.2-1.2V7c0-.7.6-1.2 1.2-1.2h3.2V4.2H7C5.5 4.2 4.2 5.5 4.2 7v10c0 1.5 1.2 2.8 2.8 2.8h10c1.5 0 2.8-1.2 2.8-2.8v-3.6h-1.5V17zM14.9 3v1.5h3.7l-6.4 6.4 1.1 1.1 6.4-6.4v3.7h1.5V3h-6.3z"></path></svg></a></li>
			</ul>
		</div>
	</div>
	<div class="jb-deactivation__dialog__actions">
		<button 
			class="jp-deactivation__dialog__button jp-deactivation__dialog__button--cancel" 
			type="button"
			onclick="dispatchEvent(DeactivationDialog.events.close)"
		>Cancel</button>
		<button 
			class="jp-deactivation__dialog__button jp-deactivation__dialog__button--deactivate" 
			type="button"
			onclick="dispatchEvent(DeactivationDialog.events.deactivate)"
		>Deactivate</button>
		<button 
			class="jp-deactivation__dialog__button jp-deactivation__dialog__button--deactivate" 
			type="button"
			onclick="dispatchEvent(DeactivationDialog.events.deactivateWithFeedback)"
		>Give Feedback &amp; Deactivate</button>
	</div>
</div>
<div class="jb-deactivation__overlay" onclick="dispatchEvent(DeactivationDialog.events.close)"></div>
