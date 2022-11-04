export interface Image {
	type: 'img' | 'background';
	url: string;
	width: number;
	height: number;
	node: Element;
}

export class Images {
	private targets: Image[] = [];

	public async load(domElements: Element[]) {
		const parsedNodes = domElements.map(async (el: Element) => {

			// Handle <img> tags first.
			if (el.tagName === 'IMG') {
				return this.getImg(el as HTMLImageElement);
			}

			// Check for background images
			// in all other elements.
			return this.getBackgroundImage(el);
		}, []);

		this.targets = (await Promise.all(parsedNodes)).filter(Boolean) as Image[];
		return this.targets;
	}

	private async urlToDimensions(url: string) {
		const img = new Image();
		img.src = url;

		return new Promise<{ width: number; height: number }>(resolve => {
			img.onload = () => {
				resolve({ width: img.width, height: img.height });
			};
		});
	}

	private async getBackgroundImage(el: Element): Promise<Image | false> {
		const style = window.getComputedStyle(el);
		const url = this.backgroundImageSrc(style.backgroundImage);

		if (!url) {
			return false;
		}

		const { width, height } = await this.urlToDimensions(url);

		return {
			type: 'background',
			width,
			height,
			url,
			node: el,
		};
	}

	private backgroundImageSrc(backgroundValue: string): string | false {
		if (!this.isImageURL(backgroundValue)) {
			return false;
		}

		const url = backgroundValue.match(/url\(...([\w\d.-]+...)\)/);
		if (url && url[1]) {
			return url[1];
		}

		return false;
	}

	private isImageURL(url: string): boolean {
		const ignore = ['data:image', 'gradient', '.svg', 'none', 'initial', 'inherit'];
		if (ignore.some(ignore => url.includes(ignore))) {
			return false;
		}

		return true;
	}

	private async getImg(el: HTMLImageElement): Promise<Image | false> {
		const url = el.getAttribute('src');
		if (!url || !this.isImageURL(url)) {
			return false;
		}

		const { width, height } = await this.urlToDimensions(url);

		return {
			type: 'img',
			width,
			height,
			url,
			node: el,
		};
	}

	public get() {
		return this.targets;
	}
}
