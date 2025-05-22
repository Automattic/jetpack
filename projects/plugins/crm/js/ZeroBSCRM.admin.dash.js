/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V2.4
 *
 * Copyright 2020 Automattic
 * CRM dash date range picker
 *
 * Date: 15th August 2018
 */

/* global Chart, ajaxurl, zbsJS_admcolours, zeroBSCRMJS_globViewLang, moment, jpcrm_js_bind_daterangepicker */

jQuery( function () {
	window.dash_security = jQuery( '#zbs_dash_count_security' ).val();

	const ctx = document.getElementById( 'growth-chart' );
	// if no growth chart exists, then there's no data to process so we won't try to create a chart
	// this whole JS file needs rework, but this is a quick fix for now
	if ( ctx ) {
		window.contactChart = new Chart( ctx, {
			type: 'bar',
			data: {
				labels: '',
				datasets: [
					{
						label: '',
						backgroundColor: Chart.defaults.defaultColor,
						data: '',
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { display: false },
					title: {
						display: false,
						text: '',
					},
				},
				scales: {
					y: {
						display: true,
						beginAtZero: true, // minimum value will be 0.
					},
				},
			},
		} );

		jQuery( '.day-or-month .button' ).on( 'click', function () {
			jQuery( '.day-or-month .button' ).removeClass( 'selected' );
			jQuery( this ).addClass( 'selected' );

			const range = jQuery( this ).attr( 'data-range' );

			if ( range === 'yearly' ) {
				jetpackcrm_draw_contact_chart( window.yearly );
			}
			if ( range === 'monthly' ) {
				jetpackcrm_draw_contact_chart( window.monthly );
			}
			if ( range === 'weekly' ) {
				jetpackcrm_draw_contact_chart( window.weekly );
			}
			if ( range === 'daily' ) {
				jetpackcrm_draw_contact_chart( window.daily );
			}
		} );
	}

	jQuery( '#jpcrm_dash_page_options' ).on( 'click', function () {
		document.querySelector( '.dashboard-custom-choices' ).classList.toggle( 'hidden' );
	} );

	jQuery( '.dashboard-custom-choices input' ).on( 'click', function () {
		const zbs_dash_setting_id = jQuery( this ).attr( 'id' );
		jQuery( '#' + zbs_dash_setting_id + '_display' ).toggle();

		let is_checked = 0;
		if ( jQuery( '#' + zbs_dash_setting_id ).is( ':checked' ) ) {
			is_checked = 1;
		}

		const security = jQuery( '#zbs_dash_setting_security' ).val();

		const data = {
			action: 'zbs_dash_setting',
			is_checked: is_checked,
			the_setting: zbs_dash_setting_id,
			security: security,
		};

		jQuery.ajax( {
			type: 'POST',
			url: ajaxurl,
			data: data,
			dataType: 'json',
			timeout: 20000,
			success: function () {},
			error: function () {},
		} );
	} );

	jQuery( function () {
		/**
		 * Callback when changing date range.
		 * @param {object} start - Start moment.js object.
		 * @param {object} end   - End moment.js object.
		 */
		function cb( start, end ) {
			const zbsStrokeColor = zbsJS_admcolours.colors[ 0 ];
			jQuery( '#reportrange span' ).html(
				start.format( 'MMM D Y' ) + ' - ' + end.format( 'MMM D Y' )
			);

			const zbs_start_date = start.format( 'Y-MM-DD' );
			const zbs_end_date = end.format( 'Y-MM-DD' );

			jQuery( '.loading' ).css( 'color', zbsStrokeColor ).show();

			const t = {
				action: 'jetpackcrm_dash_refresh',
				start_date: zbs_start_date,
				end_date: zbs_end_date,
				security: window.dash_security,
			};

			const o = jQuery.ajax( {
				url: ajaxurl,
				type: 'POST',
				data: t,
				dataType: 'json',
			} );
			o.done( function ( res ) {
				//can re-call the AJAX and re-draw to be fair.. for now do it with window vars
				window.yearly = res.chart.yearly;
				window.monthly = res.chart.monthly;
				window.weekly = res.chart.weekly;
				window.daily = res.chart.daily;

				let summary_html = '';
				for ( let i = 0; i < res.summary.length; i++ ) {
					const item = res.summary[ i ];
					summary_html += `
						<jpcrm-dashcount-card>
							<h3>${ item.label }</h3>
							<div>
								<span class="range_total">+${ item.range_total }</span>
								<span class="alltime_total">${ item.alltime_total_str }</span>
							</div>
							<a href="${ item.link }">${ zeroBSCRMJS_globViewLang( 'viewall' ) }</a>
						</jpcrm-dashcount-card>
						`;
				}
				jQuery( 'jpcrm-dashcount' ).html( summary_html );
				if ( window.contactChart ) {
					jetpackcrm_draw_contact_chart( res.chart.monthly );
				}
			} );
			o.fail( function () {} );
		}

		// init callback
		cb( moment().subtract( 1, 'year' ), moment() );

		// bind daterangepicker
		jpcrm_js_bind_daterangepicker(
			{
				maxDate: moment(),
			},
			cb
		);
	} );

	jQuery( '#daterange' ).on( 'apply.daterangepicker', function ( ev, picker ) {
		jQuery( '#zbs_from' ).val( picker.startDate.format( 'YYYY-MM-DD HH:mm:ss' ) );
		jQuery( '#zbs_to' ).val( picker.endDate.format( 'YYYY-MM-DD HH:mm:ss' ) );
	} );

	// first use dashboard modal
	if ( window.jpcrm_show_first_use_dash ) {
		// open modal
		jQuery( '#jpcrm-first-use-dash' ).modal( 'show' ).modal( 'refresh' );

		// bind close modal
		jQuery( '.jpcrm-modal-close' ).on( 'click', function () {
			jQuery( '#jpcrm-first-use-dash' ).modal( 'hide' );
		} );
	}
} );

/**
 * Draw the contact chart.
 * @param {object} data - Data for contact chart.
 */
function jetpackcrm_draw_contact_chart( data ) {
	window.contactChart.data.labels = data.labels;
	window.contactChart.data.datasets[ 0 ].data = data.data;
	window.contactChart.update();
}

if ( typeof module !== 'undefined' ) {
	module.exports = { jetpackcrm_draw_contact_chart };
}
