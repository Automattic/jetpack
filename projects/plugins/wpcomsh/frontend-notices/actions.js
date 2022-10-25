(function () {
	document.documentElement.classList.add('wpcomsh-epn-hidden');

	document.addEventListener('DOMContentLoaded', function () {
		var bumpStat = function (statName) {
			new Image().src =
				document.location.protocol +
				'//pixel.wp.com/b.gif' +
				'?v=wpcom-no-pv' +
				'&x_atomic_expired_site_notice=' +
				statName +
				'&rand=' +
				Math.random();
		};

		if (!document.cookie.includes('wpcomsh_expired_plan_notice_seen=true')) {
			expireNotice();
			bumpStat('viewed_total,viewed_' + wpcomsh_epn_data.plan_level);
		}
		document.documentElement.classList.remove('wpcomsh-epn-hidden');
		document.getElementById('wpcomsh-epn-visit-site').onclick = function () {
			var expiration = new Date();
			expiration.setTime(expiration.getTime() + 1000 * 60 * 60 * 24 * 9999); // 9999 days
			var expires = 'expires=' + expiration.toUTCString();
			document.cookie = 'wpcomsh_expired_plan_notice_seen=true;' + expires + ';path=/';
			document.getElementById('wpcomsh-exp-notice').remove();
			document.documentElement.classList.remove('has-wpcomsh-epn');
			bumpStat('dismissed');
		};
	});

	function expireNotice() {
		var notice = document.createElement('div');
		notice.setAttribute('id', 'wpcomsh-exp-notice');
		notice.classList.add('wpcomsh-epn-body');
		document.documentElement.classList.add('has-wpcomsh-epn');
		notice.innerHTML =
			'<div class="wpcomsh-epn-body-inner">' +
			'<div class="wpcomsh-epn-body-main">' +
			'<div class="wpcomsh-epn-body-description">This site is going offline soon.</div>' +
			'<div class="wpcomsh-epn-info">If you enjoy the site, please let the site owner know their plan has expired. Maybe their contact information is on the site?</div>' +
			'</div>' +
			'<div class="wpcomsh-epn-action">' +
			'<div class="wpcomsh-epn-action-buttons">' +
			'<p><button id="wpcomsh-epn-visit-site" class="wpcomsh-epn-button">Continue to site</button></p>' +
			'</div>' +
			'</div>' +
			'</div>';
		document.body.prepend(notice);
	}
})();
