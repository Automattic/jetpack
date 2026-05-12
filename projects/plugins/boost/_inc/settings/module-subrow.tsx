import { Button } from '@wordpress/components';
import { useState } from '@wordpress/element';
import type { MouseEvent, ReactNode } from 'react';

type Props = {
	/** Short summary text shown on the leading edge of the subrow. */
	summary: ReactNode;
	/** Action label rendered as a link on the trailing edge of the subrow. */
	actionLabel: ReactNode;
	/**
	 * Action handler. When provided, the action runs once on click
	 * (e.g. "Regenerate"). If `children` is also provided, the
	 * action runs in addition to toggling the inline editor open.
	 */
	onAction?: () => void;
	/**
	 * Inline editor content. When provided, clicking the action
	 * label expands the editor below the summary row. When omitted,
	 * the action label is a fire-and-forget command.
	 */
	children?: ReactNode;
	/** When true, the action label renders as disabled (no click handlers fire). */
	disabled?: boolean;
};

/**
 * "Summary on the left, action link on the right" row used to
 * surface a module's current sub-feature state inline with an
 * affordance to edit or refresh it. Matches the design's gray
 * sub-row inside each module — "Except: jquery, …" + Exclude JS
 * handles, "JPEG Quality: 89, …" + Adjust quality, "Added: Homepage
 * + 1 page" + Edit pages, "Last optimized 10 minutes ago" +
 * Regenerate.
 *
 * Has two modes:
 *
 * - **Action-only** — pass `onAction` without `children`. Clicking
 *   the label fires `onAction` (e.g. the LCP "Regenerate" pattern).
 * - **Inline editor** — pass `children` (and optionally
 *   `onAction`). Clicking the label toggles the panel and fires
 *   `onAction` if provided.
 *
 * @param props             - See `Props`.
 * @param props.summary
 * @param props.actionLabel
 * @param props.onAction
 * @param props.children
 * @param props.disabled
 * @return The subrow element.
 */
export default function ModuleSubrow( {
	summary,
	actionLabel,
	onAction,
	children,
	disabled,
}: Props ): JSX.Element {
	const [ isOpen, setOpen ] = useState( false );
	const hasPanel = !! children;

	const onClick = ( e: MouseEvent< HTMLButtonElement > ) => {
		e.preventDefault();
		if ( disabled ) {
			return;
		}
		if ( hasPanel ) {
			setOpen( open => ! open );
		}
		onAction?.();
	};

	return (
		<div className="jetpack-boost-subrow">
			<div className="jetpack-boost-subrow__row">
				<span className="jetpack-boost-subrow__summary">{ summary }</span>
				<Button
					variant="link"
					className="jetpack-boost-subrow__action"
					onClick={ onClick }
					disabled={ disabled }
				>
					{ actionLabel }
				</Button>
			</div>
			{ hasPanel && isOpen && <div className="jetpack-boost-subrow__panel">{ children }</div> }
		</div>
	);
}
