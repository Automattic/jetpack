/**
 * Draws a simple funnel
 * 
 * Inspired in part by https://codepen.io/tylerlwsmith/pen/RwNZKgp
 * 
 * @param funnel_data array of funnel data (count, backfill_count, contact_status, and link)
 * @element HTML element to turn into a funnel
 **/

function jpcrm_build_funnel(data, funnel_element) {
	// something's wrong, so stop
	if (!element || !data) return;

	const COLORS = [ '#00a0d2', '#0073aa', '#035d88', '#333', '#222', '#000' ];

	// show legend if desired
	const SHOW_FUNNEL_LEGEND = false;

	num_of_funnel_sections = data.length;
	funnel_height = num_of_funnel_sections * 50;
	let funnel_html = `<div class="jpcrm_funnel" style="height: ${funnel_height}px">`;
	let legend_html = '';
	
	if (SHOW_FUNNEL_LEGEND) {
		legend_html = '<div class="jpcrm_funnel_legend">';
	}
	for (var i=0; i<num_of_funnel_sections; i++) {
		let section_color = COLORS[i%COLORS.length];
		let section_html = `<a
			${data[i]['link']?'href='+data[i]['link']:''}
			class="funnel_section"
			data-hover="${data[i]['contact_status'] + ': \u00a0'}"
			alt="${data[i]['contact_status']}: ${data[i]['backfill_count']}"
			style="background-color: ${section_color};"
			>${data[i]['backfill_count']}</a>`;
		funnel_html += section_html;

		if (SHOW_FUNNEL_LEGEND) {
			legend_html += `<div class="legend-color" style="background-color: ${section_color}"></div><div class="legend-label">${data[i]['contact_status']}</div>`;
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
