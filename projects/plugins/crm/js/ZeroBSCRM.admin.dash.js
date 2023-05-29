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

jQuery( function ( $ ) {
	window.dash_security = jQuery( '#zbs_dash_count_security' ).val();

	var ctx = document.getElementById( 'growth-chart' );
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
						backgroundColor: Chart.defaults.global.defaultColor,
						data: '',
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				legend: { display: false },
				title: {
					display: false,
					text: '',
				},
				scales: {
					yAxes: [
						{
							display: true,
							ticks: {
								beginAtZero: true, // minimum value will be 0.
							},
						},
					],
				},
			},
		} );

		jQuery( '.day-or-month .button' ).on( 'click', function ( e ) {
			jQuery( '.day-or-month .button' ).removeClass( 'selected' );
			jQuery( this ).addClass( 'selected' );

			range = jQuery( this ).attr( 'data-range' );

			if ( range == 'yearly' ) {
				jetpackcrm_draw_contact_chart( window.yearly );
			}
			if ( range == 'monthly' ) {
				jetpackcrm_draw_contact_chart( window.monthly );
			}
			if ( range == 'weekly' ) {
				jetpackcrm_draw_contact_chart( window.weekly );
			}
			if ( range == 'daily' ) {
				jetpackcrm_draw_contact_chart( window.daily );
			}
		} );
	}

	jQuery( '#jpcrm_dash_page_options' ).on( 'click', function ( e ) {
		document.querySelector('.dashboard-custom-choices').classList.toggle('hidden');
	} );

	jQuery( '.dashboard-custom-choices input' ).on( 'click', function ( e ) {
		var zbs_dash_setting_id = jQuery( this ).attr( 'id' );
		jQuery( '#' + zbs_dash_setting_id + '_display' ).toggle();

		var is_checked = 0;
		if ( jQuery( '#' + zbs_dash_setting_id ).is( ':checked' ) ) {
			is_checked = 1;
		}
		var the_setting = zbs_dash_setting_id;
		var security = jQuery( '#zbs_dash_setting_security' ).val();

		var data = {
			action: 'zbs_dash_setting',
			is_checked: is_checked,
			the_setting: the_setting,
			security: security,
		};

		jQuery.ajax( {
			type: 'POST',
			url: ajaxurl,
			data: data,
			dataType: 'json',
			timeout: 20000,
			success: function ( response ) {},
			error: function ( response ) {},
		} );
	} );

	jQuery( function () {
		/**
		 * @param start
		 * @param end
		 */
		function cb( start, end ) {
			zbsStrokeColor = zbsJS_admcolours.colors[ 0 ];
			jQuery( '#reportrange span' ).html(
				start.format( 'MMM D Y' ) + ' - ' + end.format( 'MMM D Y' )
			);

			var zbs_start_date = start.format( 'Y-MM-DD' );
			var zbs_end_date = end.format( 'Y-MM-DD' );

			jQuery( '.loading' ).css( 'color', zbsStrokeColor ).show();

			var t = {
				action: 'jetpackcrm_dash_refresh',
				start_date: zbs_start_date,
				end_date: zbs_end_date,
				security: window.dash_security,
			};

			o = jQuery.ajax( {
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

				summary_html = '';
				for ( var i = 0; i < res.summary.length; i++ ) {
					item = res.summary[ i ];
					summary_html += `
						<jpcrm-dashcount-card>
							<h3>${item.label}</h3>
							<div>
								<span class="range_total">+${item.range_total}</span>
								<span class="alltime_total">${item.alltime_total_str}</span>
							</div>
							<a href="${item.link}">${zeroBSCRMJS_globViewLang( 'viewall' )}</a>
						</jpcrm-dashcount-card>
						`;
				}
				jQuery( 'jpcrm-dashcount' ).html( summary_html );
				if ( window.contactChart ) {
					jetpackcrm_draw_contact_chart( res.chart.monthly );
				}
			} );
			o.fail( function ( res ) {} );
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
 * @param data
 */
function jetpackcrm_draw_contact_chart( data ) {
	window.contactChart.data.labels = data.labels;
	window.contactChart.data.datasets[ 0 ].data = data.data;
	window.contactChart.update();
}

if ( typeof module !== 'undefined' ) {
    module.exports = {  jetpackcrm_draw_contact_chart  };
}
