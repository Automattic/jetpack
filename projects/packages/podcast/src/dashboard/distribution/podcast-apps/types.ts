import type { PodcastShowState, PodcatcherId } from '../../types';
import type { ComponentType } from 'react';

export interface PodcastApp {
	id: PodcatcherId;
	name: string;
	Logo: ComponentType;
	submitUrl: string;
	learnMoreUrl?: string;
	// `automatic` submits through the wpcom relay on the user's behalf and
	// gets its own Distribution section and setup gate.
	submission: 'automatic' | 'manual';
	// Full replacement for the default directory row.
	Row?: ComponentType< PodcastAppRowProps >;
	// Full replacement for the default 3-step submit modal.
	Modal?: ComponentType< PodcastAppModalProps >;
}

export interface PodcastAppRowProps {
	app: PodcastApp;
	state: PodcastShowState;
	// Non-empty disables the row's action and explains why, so a disabled
	// button can't be left without a reason.
	blockedReason: string;
	onOpenModal: () => void;
	// Called once a save lands on the very first show URL stored across all
	// directories. Used by Distribution to fire a confetti celebration.
	onFirstSave?: () => void;
}

export interface PodcastAppModalProps {
	app: PodcastApp;
	feedUrl: string;
	onClose: () => void;
	// Called once a save lands on the very first show URL stored across all
	// directories. Used by Distribution to fire a confetti celebration.
	onFirstSave?: () => void;
}
