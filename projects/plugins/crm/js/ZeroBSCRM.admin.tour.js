/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V2.4
 *
 * Copyright 2020 Automattic
 *
 * Date: 11/02/18
 */

// Define the tour!
var zbsTour = {
	id: 'zbs-welcome-tour',
	steps: [
		{
			title: window.zbs_tour.lang.step1.title,
			content: window.zbs_tour.lang.step1.content,
			target: '.logo-cube',
			placement: 'right',
			yOffset: -15,
		},
		{
			title: window.zbs_tour.lang.step2.title,
			content: window.zbs_tour.lang.step2.content,
			target: 'learn',
			placement: 'right',
			showPrevButton: true,
			yOffset: -23,
			onShow: function () {
				// highlight
				jQuery( '#learn' ).addClass( 'green' ).removeClass( 'grey' );
			},
			onNext: function () {
				// unhighlight
				jQuery( '#learn' ).addClass( 'grey' ).removeClass( 'green' );
			},
		},
		{
			title: window.zbs_tour.lang.step3.title,
			content: window.zbs_tour.lang.step3.content,
			target: 'notifymebell',
			placement: 'left',
			showPrevButton: true,
			yOffset: -20,
			onNext: function () {
				jQuery( '#notifymebell' ).html( 1 ).addClass( 'notfications' );
			},
		},

		{
			title: window.zbs_tour.lang.step4.title,
			content: window.zbs_tour.lang.step4.content,
			target: 'notifymebell',
			placement: 'left',
			multipage: true,
			showPrevButton: true,
			yOffset: -20,
			onNext: function () {
				window.location = zbs_tour.admin_url + 'admin.php?page=zerobscrm-notifications';
			},
		},

		{
			title: window.zbs_tour.lang.step5.title,
			content: window.zbs_tour.lang.step5.content,
			target: 'notification-list',
			placement: 'top',
			yOffset: 15,
			onNext: function () {
				jQuery( '#first-example' ).removeClass( 'r0' ).addClass( 'r1' );
				jQuery( '#mike-face' ).fadeIn( 1000 );
			},
		},

		{
			title: window.zbs_tour.lang.step6.title,
			content: window.zbs_tour.lang.step6.content,
			target: 'mike-face',
			placement: 'top',
			showPrevButton: true,
		},

		{
			title: window.zbs_tour.lang.step7.title,
			content: window.zbs_tour.lang.step7.content,
			target: 'top-bar-tools-menu',
			placement: 'left',
			yOffset: -12,
			showPrevButton: true,
			onShow: function () {
				// force menu open
				jQuery( '#top-bar-tools-menu' ).addClass( 'active' );
			},
		},

		{
			title: window.zbs_tour.lang.step7a.title,
			content: window.zbs_tour.lang.step7a.content,
			target: 'zbs-manage-modules-tour',
			placement: 'left',
			showPrevButton: true,
			yOffset: -16,
			onShow: function () {
				// highlight
				jQuery( '#zbs-manage-modules-tour' ).addClass( 'tourhighlight' );
			},
		},

		{
			title: window.zbs_tour.lang.step7b.title,
			content: window.zbs_tour.lang.step7b.content,
			target: 'zbs-manage-ext-tour',
			placement: 'left',
			multipage: true,
			showPrevButton: true,
			yOffset: -16,
			onShow: function () {
				// unhighlight
				jQuery( '#zbs-manage-modules-tour' ).removeClass( 'tourhighlight' );
				// highlight
				jQuery( '#zbs-manage-ext-tour' ).addClass( 'tourhighlight' );
			},
			onNext: function () {
				window.location = zbs_tour.admin_url + 'admin.php?page=zerobscrm-extensions';
			},
		},

		{
			title: window.zbs_tour.lang.step9.title,
			content: window.zbs_tour.lang.step9.content,
			target: 'learn',
			placement: 'right',
			multipage: true,
			showPrevButton: true,
			yOffset: -20,
			onNext: function () {
				window.location = zbs_tour.admin_url + 'admin.php?page=zerobscrm-plugin-settings';
			},
			//show cta :)
			showCTAButton: true,
			ctaLabel: window.zbs_tour.lang.step9.cta_label,
			onCTA: function () {
				//window.location = zbs_tour.cta_url;
				window.open( zbs_tour.cta_url, '_blank', '' );
			},
		},
		{
			title: window.zbs_tour.lang.step10.title,
			content: window.zbs_tour.lang.step10.content,
			target: 'zbs-settings-head-tour',
			placement: 'bottom',
		},

		{
			title: window.zbs_tour.lang.step12.title,
			content: window.zbs_tour.lang.step12.content,
			target: 'override-allusers',
			placement: 'top',
			xOffset: 'center',
			onNext: function () {
			},
		},
		{
			title: window.zbs_tour.lang.step13.title,
			content: window.zbs_tour.lang.step13.content,
			target: 'jpcrm-user-menu-item',
			placement: 'left',
			yOffset: -10,
			onShow: function () {
				// highlight item
				//jQuery('#jpcrm-user-menu-item').addClass('active');
			},
			onNext: function () {
				// unforce open
				//jQuery('#jpcrm-user-menu').removeClass('visible').removeClass('active');
				// re-init popup
				//jQuery('#jpcrm-user-menu-item').popup('destroy');
				//zbscrm_JS_initMenuPopups();
			},
		},
	],
};

jQuery( function ( $ ) {
	// Start the tour!

	/* ========== */
	/* TOUR SETUP */
	/* ========== */
	addClickListener = function ( el, fn ) {
		if ( el.addEventListener ) {
			el.addEventListener( 'click', fn, false );
		} else {
			el.attachEvent( 'onclick', fn );
		}
	};

	// DEBUG console.log("hopscotch state: " + hopscotch.getState());
	// DEBUG console.log("ADMIN ROOT FOR TOUR " + zbs_tour.admin_url);

	// hopscotch.startTour(tour);

	//admin tour link
	/*
  tourBtnEl = document.getElementById("zbs-tour-top-menu");
  if (tourBtnEl) {
    addClickListener(tourBtnEl, function() {
      if (!hopscotch.isActive) {
        hopscotch.startTour(tour, 0);
      }
    });
  }
*/
} );

if ( typeof module !== 'undefined' ) {
    module.exports = { zbsTour };
}