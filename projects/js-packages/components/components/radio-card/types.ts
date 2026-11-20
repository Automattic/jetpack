import type { ReactNode } from 'react';

export type RadioCardProps = {
	/**
	 * Id of the radio; the title's id is built from it.
	 */
	id: string;
	/**
	 * The value the surrounding `RadioGroup` takes when this card is picked. Also passed to `onPreviewClick`.
	 */
	value: string;
	/**
	 * Caption under the card, and the radio's accessible name.
	 */
	title: string;
	/**
	 * Picture filling the card, drawn at a 294×192 aspect ratio.
	 */
	illustration?: ReactNode;
	/**
	 * Shows a "Preview and edit" link to this URL under the title.
	 */
	previewUrl?: string;
	/**
	 * Called with the card's `value` when the "Preview and edit" link is clicked.
	 */
	onPreviewClick?: ( value: string ) => void;
	/**
	 * Disables the radio.
	 */
	disabled?: boolean;
};

export type RadioCardGridProps = {
	/**
	 * The `RadioCard`s to lay out.
	 */
	children: ReactNode;
	/**
	 * Extra class for the grid.
	 */
	className?: string;
};
