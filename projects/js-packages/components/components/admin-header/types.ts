import type { ReactNode } from 'react';

export type AdminHeaderProps = {
	/**
	 * Custom logo element. Defaults to JetpackLogo icon (bolt only).
	 */
	logo?: ReactNode;

	/**
	 * Product title displayed next to the logo.
	 */
	title: string;

	/**
	 * Optional tagline displayed below the title row.
	 */
	tagline?: string;

	/**
	 * Optional action elements (buttons, links) displayed on the right side of the header.
	 */
	actions?: ReactNode;

	/**
	 * Optional tab navigation displayed below the title/tagline.
	 */
	tabs?: ReactNode;

	/**
	 * Additional CSS class name.
	 */
	className?: string;
};
