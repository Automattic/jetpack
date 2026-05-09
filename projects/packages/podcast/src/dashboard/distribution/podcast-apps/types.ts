import type { PodcatcherId } from '../types';
import type { ComponentType, ReactNode } from 'react';

export interface PodcastApp {
	id: PodcatcherId;
	name: string;
	Logo: ComponentType;
	submitUrl: string;
	learnMoreUrl?: string;
	// Lowercase, no `www.`. Mirrors SHOW_URL_HOSTS in src/class-settings.php.
	showHosts: readonly string[];
	// Extra JSX inside Step 2 of the default modal.
	step2Extra?: ReactNode;
	// Full replacement for the default 3-step submit modal.
	Modal?: ComponentType< PodcastAppModalProps >;
}

export interface PodcastAppModalProps {
	app: PodcastApp;
	feedUrl: string;
	onClose: () => void;
}
