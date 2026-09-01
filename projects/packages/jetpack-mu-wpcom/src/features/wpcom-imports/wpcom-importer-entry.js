/* global wp, wpcomImporterData */

/**
 * Create the HTML markup for the WPCOM Importer card.
 *
 * @param {number} width - The width in pixels for the import system cell.
 * @return {string} HTML markup for the WPCOM Importer card table.
 */
function wpcomImporterEntry( width ) {
	return (
		'<table class="widefat importers striped" style="margin-bottom: 20px">' +
		'<tbody><tr class="importer-item">' +
		'<td class="import-system" style="width: ' +
		width +
		'px">' +
		'<span class="importer-title">WordPress.com</span>' +
		'<span class="importer-action"><a href="' +
		wpcomImporterData.wpcomImporterUrl +
		'" aria-label="' +
		wp.i18n.__( 'Run WordPress.com Importer', 'jetpack-mu-wpcom' ) +
		'">' +
		wp.i18n.__( 'Run Importer', 'jetpack-mu-wpcom' ) +
		'</a></span>' +
		'</td>' +
		'<td class="desc">' +
		'<span class="importer-desc">' +
		wp.i18n.__(
			'Move any WordPress site, including all content, themes, plugins, and users to WordPress.com.',
			'jetpack-mu-wpcom'
		) +
		'</span>' +
		'</td>' +
		'</tr>' +
		'</tbody></table>'
	);
}

wp.domReady( function () {
	const targetElement = document.querySelector( '.widefat.importers.striped' );
	// 24 is the padding size.
	const width = targetElement.rows[ 0 ].cells[ 0 ].clientWidth - 24;
	if ( targetElement ) {
		targetElement.insertAdjacentHTML( 'beforebegin', wpcomImporterEntry( width ) );
	}
} );
