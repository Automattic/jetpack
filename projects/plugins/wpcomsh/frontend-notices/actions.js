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
			'<div id="wpcomsh-epn-title" class="wpcomsh-epn-body-description"></div>' +
			'<div id="wpcomsh-epn-desc" class="wpcomsh-epn-info"></div>' +
			'</div>' +
			'<div class="wpcomsh-epn-action">' +
			'<div class="wpcomsh-epn-action-buttons">' +
			'<p><button id="wpcomsh-epn-visit-site" class="wpcomsh-epn-button"></button></p>' +
			'</div>' +
			'</div>' +
			'</div>';

		notice.querySelector('#wpcomsh-epn-title').innerText = wpcomsh_epn_data.i18n.title;
		notice.querySelector('#wpcomsh-epn-desc').innerText = wpcomsh_epn_data.i18n.description;
		notice.querySelector('#wpcomsh-epn-visit-site').innerText = wpcomsh_epn_data.i18n.action;

		document.body.prepend(notice);
	}
})();
