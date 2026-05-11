import type { PodcatcherId } from '../types';
import type { ComponentType } from 'react';

export interface PodcastApp {
	id: PodcatcherId;
	name: string;
	Logo: ComponentType;
	submitUrl: string;
	learnMoreUrl?: string;
	// Lowercase, no `www.`. Mirrors SHOW_URL_HOSTS in src/class-settings.php.
	showHosts: readonly string[];
	// Full replacement for the default 3-step submit modal.
	Modal?: ComponentType< PodcastAppModalProps >;
}

export interface PodcastAppModalProps {
	app: PodcastApp;
	feedUrl: string;
	onClose: () => void;
	// Called once a save lands on the very first show URL stored across all
	// directories. Used by Distribution to fire a confetti celebration.
	onFirstSave?: () => void;
}
