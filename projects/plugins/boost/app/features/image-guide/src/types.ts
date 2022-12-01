import type { MeasurableImageStore } from './stores/MeasurableImageStore';
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
	oversizedBy: number;
	expected: {
		width: number;
		height: number;
	};
};

export type Image = Omit< MeasuredImage, 'expected' | 'onScreen' | 'oversizedBy' >;

export interface ImageComponentConfig extends ComponentConstructorOptions {
	target: HTMLElement;
	props: {
		stores: MeasurableImageStore[];
	};
}

export type GuideSize = 'normal' | 'small' | 'micro';
