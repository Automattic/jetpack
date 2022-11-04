export interface Image {
	type: 'img' | 'srcset' | 'background';
	url: string;
	width: number;
	height: number;
	node: Element;
}

export async function load(domElements: Element[]) {
	const parsedNodes = domElements.map(async (el: Element) => {
		// Handle <img> tags first.
		if (el.tagName === 'IMG') {
			return getImg(el as HTMLImageElement);
		}

		// Check for background images
		// in all other elements.
		return getBackgroundImage(el);
	}, []);

	return (await Promise.all(parsedNodes)).filter(Boolean) as Image[];
}

async function urlToDimensions(url: string) {
	const img = new Image();
	img.src = url;

	return new Promise<{ width: number; height: number }>(resolve => {
		img.onload = () => {
			resolve({ width: img.width, height: img.height });
		};
	});
}

async function getBackgroundImage(el: Element): Promise<Image | false> {
	const style = window.getComputedStyle(el);
	const url = backgroundImageSrc(style.backgroundImage);

	if (!url) {
		return false;
	}

	const { width, height } = await urlToDimensions(url);

	return {
		type: 'background',
		width,
		height,
		url,
		node: el,
	};
}

function backgroundImageSrc(backgroundValue: string): string | false {
	if (!isImageURL(backgroundValue)) {
		return false;
	}

	const url = backgroundValue.match(/url\(...([\w\d.-]+...)\)/);
	if (url && url[1]) {
		return url[1];
	}

	return false;
}

function isImageURL(url: string): boolean {
	const ignore = ['data:image', 'gradient', '.svg', 'none', 'initial', 'inherit'];
	if (ignore.some(ignore => url.includes(ignore))) {
		return false;
	}

	return true;
}

async function getImg(el: HTMLImageElement): Promise<Image | false> {
	// Get the currently used image source in srcset if it's available.
	const url = el.currentSrc || el.src;
	const type = el.srcset ? 'srcset' : 'img';

	if (!url || !isImageURL(url)) {
		return false;
	}

	const { width, height } = await urlToDimensions(url);

	return {
		type,
		width,
		height,
		url,
		node: el,
	};
}
