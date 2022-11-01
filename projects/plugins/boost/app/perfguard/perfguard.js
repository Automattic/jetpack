const $ = window.jQuery;

function wrap($el) {
	let $target = $el;
	if ($el.css('position') !== 'static') {
		const parents = $el.parentsUntil('body');
		for (const parent of parents) {
			if ($(parent).css('position') === 'static') {
				$target = $(parent);
				break;
			}
		}
	}

	// Don't wrap twice
	if ($target.parent().hasClass('perfguard')) {
		return $target.parent();
	}

	const $perfguard = insertPerfguard($target.parent());
	$target.appendTo($perfguard);
	return $perfguard;
}

function insertPerfguard($target) {
	$target.prepend(`
		<div class="perfguard">
			<div class="perfguard-previews"></div>
			<div class="perfguard-overlay"></div>
		</div>
	` );
	return $target.find('.perfguard');
}

function addInfo($el, imageURL, ratio, loadedW, loadedH, actualW, actualH) {
	loadedW = Math.round(loadedW);
	loadedH = Math.round(loadedH);
	actualW = Math.round(actualW);
	actualH = Math.round(actualH);

	const severity = ratio > 2 ? 'high' : ratio > 1.1 ? 'medium' : 'normal';
	const imageName = imageURL.split('/').pop();

	const previewHTML = `
	<div class="perfguard-preview ${severity}">
		<div class="perfguard-preview__ratio">${ratio}</div>
	</div>
	`;
	const fakeSavingsInKB = Math.round((loadedW * loadedH - actualW * actualH) / 1000);
	const infoHTML = `
	<div class="perfguard-info">
		<div class="perfguard-details">
			<a href="${imageURL}" target="_blank">${imageName}</a> is <b>${ratio}x</b> larger the needed. <br>
			Actual Size: ${actualW} x ${actualH} <br>
			Loaded Size: ${loadedW} x ${loadedH} <br>
			Potential Savings: <strong>${fakeSavingsInKB} KB</strong>
		</div>
	</div>
	`;

	$el.find('.perfguard-previews').append(previewHTML);
	$el.find('.perfguard-overlay').append(infoHTML);
}

$(window).load(() => {
	$('img').each((index, el) => {
		const $el = $(el);
		if ($el.width() < 100 || $el.height() < 100) {
			return;
		}

		const width = $el.width();
		const naturalWidth = el.naturalWidth;
		const ratio = (naturalWidth / width).toFixed(2);
		if (ratio < 1) {
			return;
		}

		$el.width($el.width());
		$el.height($el.height());

		const $perfguard = wrap($el);
		addInfo($perfguard, $el.attr('src'), ratio, el.naturalWidth, el.naturalHeight, $el.width(), $el.height());
	});

	const elsWithBgImage = Array.from(document.querySelectorAll('body *')).filter(el => {
		const style = window.getComputedStyle(el);
		return (
			style.backgroundImage.includes('url(') && !style.backgroundImage.includes('data:image')
		);
	});

	for (const el of elsWithBgImage) {
		const $el = $(el);
		const style = window.getComputedStyle(el);
		const bgImage = style.backgroundImage
			.replace('url(', '')
			.replace(')', '')
			.replace(/"/g, '')
			.replace(/'/g, '');
		const img = new Image();
		img.src = bgImage;
		img.onload = () => {
			const width = $el.width();
			const naturalWidth = img.naturalWidth;
			const ratio = (naturalWidth / width).toFixed(2);
			if (ratio < 1) {
				return;
			}
			const $perfguard = insertPerfguard($el);
			$perfguard.addClass('perfguard--bg');
			addInfo($perfguard, bgImage, ratio, img.naturalWidth, img.naturalHeight, $el.width(), $el.height());
		};
	}
});
