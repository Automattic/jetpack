import type { ReactNode } from 'react';

export type HighlightBannerProps = {
	/** Extra class for layout overrides, such as width or margins. */
	className?: string;
	/** The banner's heading. */
	title: ReactNode;
	/** Supporting copy under the heading. */
	description?: ReactNode;
	/** Buttons or links in a row under the copy. Give a primary one the `jp-highlight-banner__cta` class. */
	actions?: ReactNode;
	/** Renders a close button in the corner when provided. */
	onDismiss?: () => void;
	/** Accessible label for the close button. Defaults to "Dismiss banner". */
	dismissLabel?: string;
};
