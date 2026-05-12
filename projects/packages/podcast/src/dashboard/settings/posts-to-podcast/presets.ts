import { __ } from '@wordpress/i18n';

export interface WindowPreset {
	id: string;
	label: string;
	unit: 'days' | 'months';
	n: number;
}

export interface LabeledPreset {
	id: string;
	label: string;
}

export const WINDOW_PRESETS: WindowPreset[] = [
	{ id: 'last-7-days', label: __( 'Last 7 days', 'jetpack-podcast' ), unit: 'days', n: 7 },
	{ id: 'last-14-days', label: __( 'Last 14 days', 'jetpack-podcast' ), unit: 'days', n: 14 },
	{ id: 'last-30-days', label: __( 'Last 30 days', 'jetpack-podcast' ), unit: 'days', n: 30 },
	{ id: 'last-3-months', label: __( 'Last 3 months', 'jetpack-podcast' ), unit: 'months', n: 3 },
];

export const LENGTH_PRESETS: LabeledPreset[] = [
	{ id: 'short', label: __( 'Short (~3 min)', 'jetpack-podcast' ) },
	{ id: 'medium', label: __( 'Medium (~7 min)', 'jetpack-podcast' ) },
	{ id: 'long', label: __( 'Long (~12 min)', 'jetpack-podcast' ) },
];

export const VOICE_PRESETS: LabeledPreset[] = [
	{ id: 'witty', label: __( 'Witty', 'jetpack-podcast' ) },
	{ id: 'earnest', label: __( 'Earnest', 'jetpack-podcast' ) },
	{ id: 'professional', label: __( 'Professional', 'jetpack-podcast' ) },
];
