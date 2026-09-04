import type { Cta } from './types.ts';
import type { MouseEvent } from 'react';

export interface NoticeCtas {
	primary: Cta;
	secondary: Cta | null;
}

export type CtaClickHandler = (
	cta: 'primary' | 'secondary',
	target: Cta,
	event: MouseEvent
) => void;

export interface NoticeAction {
	label: string;
	url: string;
	variant?: 'primary';
	onClick: ( event: MouseEvent ) => void;
}

/**
 * The notice's action links.
 *
 * @param ctas           - The CTAs the state offers.
 * @param ctas.primary   - Always present.
 * @param ctas.secondary - Only in the grace period.
 * @param onCtaClick     - Receives which CTA was clicked, its target, and the click.
 * @return The actions, primary first.
 */
export const noticeActions = (
	{ primary, secondary }: NoticeCtas,
	onCtaClick: CtaClickHandler
): NoticeAction[] => {
	const actions: NoticeAction[] = [
		{
			label: primary.label,
			url: primary.url,
			variant: 'primary',
			onClick: event => onCtaClick( 'primary', primary, event ),
		},
	];
	if ( secondary ) {
		actions.push( {
			label: secondary.label,
			url: secondary.url,
			onClick: event => onCtaClick( 'secondary', secondary, event ),
		} );
	}
	return actions;
};
