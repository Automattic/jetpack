import type { ComponentConstructorOptions } from 'svelte';

export type MeasuredImage = {
	type: 'img' | 'srcset' | 'background';
	url: string;
	node: HTMLElement;
	fileSize: {
		width: number;
		height: number;
		weight: number;
	};
	onScreen: {
		width: number;
		height: number;
	};
	oversizedBy: number,
	expected: {
		width: number;
		height: number;
	};
};

export interface ImageComponentConfig extends ComponentConstructorOptions {
	target: HTMLElement;
	props: {
		images: MeasuredImage[];
	};
}

export type GuideSize = 'normal' | 'small' | 'micro';
