// A 16:9 poster drawn inline, so the stories need no network.
export const POSTER = `data:image/svg+xml;utf8,${ encodeURIComponent(
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 90">' +
		'<rect width="160" height="90" fill="#1e1e1e"/>' +
		'<polygon points="66,28 66,62 98,45" fill="#fff"/>' +
		'</svg>'
) }`;

export const UPLOAD_DATE = '2026-01-10 08:00:00';
