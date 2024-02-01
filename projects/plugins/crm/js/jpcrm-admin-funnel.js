/**
 * Gets an array of funnel segment colors
 * 
 * @param num_segments the number of segments to generate colors for
 * 
 * @returns an array of colors
 **/
function jpcrm_get_segment_colors(num_segments) {
	const COLORS = [
		zbs_root['jp_green']['20'],
		zbs_root['jp_green']['30'],
		zbs_root['jp_green']['40'],
		zbs_root['jp_green']['50'],
		zbs_root['jp_green']['60'],
		zbs_root['jp_green']['70'],
		zbs_root['jp_green']['80'],
		zbs_root['jp_green']['90'],
		zbs_root['jp_green']['100'],
		'#000000' // add black for good measure
	];

	if (num_segments === COLORS.length) {
		// use full set of colors
		return COLORS;
	} else if (num_segments < COLORS.length) {
		// use a middle subset of colors
		let midpoint = Math.floor(COLORS.length/2);
		let start_index = Math.floor(midpoint - num_segments/2);
		return COLORS.slice(start_index,start_index+num_segments);
	}

	// use full set of colors, repeated and variably reversed
	let lotsa_colors = COLORS.slice();
	while (num_segments > lotsa_colors.length) {
		lotsa_colors = lotsa_colors.concat(COLORS.reverse().slice(1));
	}
	return lotsa_colors.slice(0,num_segments);
}

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

	// show legend if desired
	const SHOW_FUNNEL_LEGEND = false;

	// number of funnel sections
	const NUM_FUNNEL_SECTIONS = funnel_data.length;

	// height of each section
	const SECTION_HEIGHT = 50;

	// colors to use
	const SEGMENT_COLORS = jpcrm_get_segment_colors(NUM_FUNNEL_SECTIONS);

	let funnel_html = `<div class="jpcrm_funnel" style="height: ${SECTION_HEIGHT * NUM_FUNNEL_SECTIONS}px">`;
	let legend_html = '';
	
	if (SHOW_FUNNEL_LEGEND) {
		legend_html = '<div class="jpcrm_funnel_legend">';
	}
	for (var i=0; i<NUM_FUNNEL_SECTIONS; i++) {
		let section_color = SEGMENT_COLORS[i];
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
