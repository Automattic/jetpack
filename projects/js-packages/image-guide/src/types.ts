import type { MeasurableImageStore } from './stores/MeasurableImageStore.js';
import type { ComponentConstructorOptions } from 'svelte';

export type GuideSize = 'normal' | 'small' | 'micro';
export interface ImageGuideConfig extends ComponentConstructorOptions {
	target: HTMLElement;
	props: {
		stores: MeasurableImageStore[];
	};
}
