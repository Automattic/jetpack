import type { MeasurableImageStore } from './stores/MeasurableImageStore.ts';

export type GuideSize = 'normal' | 'small' | 'micro';
export interface ImageGuideConfig {
	target: HTMLElement;
	intro?: boolean;
	props: {
		stores: MeasurableImageStore[];
	};
}
