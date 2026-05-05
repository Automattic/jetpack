/**
 * Shared types for the podcast directory app registry.
 *
 * Each podcast app (Apple, Spotify, etc.) lives in its own file under
 * `podcast-apps/` and exports a `PodcastApp` config. The data-only fields
 * cover what every app needs (id, name, logo, submit URL); the optional
 * fields let an app contribute UI without forking the whole flow.
 *
 * `step2Extra` is extra JSX rendered inside Step 2 of the default modal
 * (e.g. "Choose the Public option" for Pocket Casts). `Modal` is a full
 * replacement for the default 3-step submit modal, used when an app's
 * flow doesn't fit "copy feed URL, visit page, paste URL back" (e.g.
 * one-click API submission).
 */

import type { PodcatcherId } from '../types';
import type { ComponentType, ReactNode } from 'react';

export interface PodcastApp {
	id: PodcatcherId;
	name: string;
	Logo: ComponentType;
	/** External submission page; ignored when `Modal` is set. */
	submitUrl: string;
	/** Optional "learn more" link shown inside the default modal. */
	learnMoreUrl?: string;
	/** Optional content rendered below the standard Step 2 copy. */
	step2Extra?: ReactNode;
	/** Override the default 3-step submit modal entirely. */
	Modal?: ComponentType< PodcastAppModalProps >;
}

export interface PodcastAppModalProps {
	app: PodcastApp;
	feedUrl: string;
	onClose: () => void;
}
