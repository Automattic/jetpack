/**
 * Draws a simple funnel
 * 
 * Inspired in part by https://codepen.io/tylerlwsmith/pen/RwNZKgp
 * 
 * @param funnel_data array of funnel data (count, backfill_count, contact_status, and link)
 * @param funnel_element HTML element to turn into a funnel
 **/

function jpcrm_build_funnel(funnel_data, funnel_element) {
	// something's wrong, so stop
	if (!funnel_element || !funnel_data) return;

	const COLORS = [ '#000', '#222', '#333', '#035d88', '#0073aa', '#00a0d2' ];

	// show legend if desired
	const SHOW_FUNNEL_LEGEND = false;

	// number of funnel sections
	const NUM_FUNNEL_SECTIONS = funnel_data.length;

	// height of each section
	const SECTION_HEIGHT = 50;

	let funnel_html = `<div class="jpcrm_funnel" style="height: ${SECTION_HEIGHT * NUM_FUNNEL_SECTIONS}px">`;
	let legend_html = '';
	
	if (SHOW_FUNNEL_LEGEND) {
		legend_html = '<div class="jpcrm_funnel_legend">';
	}
	for (var i=0; i<NUM_FUNNEL_SECTIONS; i++) {
		let section_color = COLORS[i%COLORS.length];
		funnel_html += `<a
			${funnel_data[i]['link']?'href='+funnel_data[i]['link']:''}
			class="funnel_section"
			data-hover="${funnel_data[i]['contact_status'] + ': \u00a0'}"
			alt="${funnel_data[i]['contact_status']}: ${funnel_data[i]['backfill_count']}"
			style="background-color: ${section_color};"
			>${funnel_data[i]['backfill_count']}</a>`;

		if (SHOW_FUNNEL_LEGEND) {
			legend_html += `<div class="legend-color" style="background-color: ${section_color}"></div><div class="legend-label">${funnel_data[i]['contact_status']}</div>`;
		}
	}
	funnel_html += '</div>';

	if (SHOW_FUNNEL_LEGEND) {
		legend_html += '</div>';
	}

	if (SHOW_FUNNEL_LEGEND) {
		funnel_html += '<br>' + legend_html;
	}
	funnel_element.innerHTML = funnel_html + '<br>';

}

if ( typeof module !== 'undefined' ) {
	module.exports = { jpcrm_build_funnel };
}
