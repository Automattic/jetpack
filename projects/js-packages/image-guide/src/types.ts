import type { MeasurableImageStore } from './stores/MeasurableImageStore.ts';
import type { ComponentConstructorOptions } from 'svelte';

export type GuideSize = 'normal' | 'small' | 'micro';
export interface ImageGuideConfig extends ComponentConstructorOptions {
	target: HTMLElement;
	props: {
		stores: MeasurableImageStore[];
	};
}
