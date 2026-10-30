import { forwardRef } from '@wordpress/element';
import { Link } from '@wordpress/ui';
import type { ReactNode } from 'react';
import './text-action.scss';

export type TextActionProps = {
	/** Optional when a trigger renders it, e.g. `<Collapsible.Trigger render={ <TextAction /> }>`. */
	onClick?: () => void;
	children?: ReactNode;
	className?: string;
	'aria-expanded'?: boolean;
	'aria-controls'?: string;
};

/**
 * A text-only action that lines up with the text around it: a neutral Link rendered as a button.
 * Only for links inside a sentence and setup's optional extras; Change, Cancel and show/hide are
 * minimal neutral Buttons.
 *
 * @param props           - Component props.
 * @param props.className - Extra class.
 * @param props.children  - The label.
 * @param ref             - Forwarded to the button, for returning focus to it.
 * @return The button.
 */
const TextAction = forwardRef< HTMLButtonElement, TextActionProps >(
	( { className, children, ...rest }, ref ) => (
		<Link
			tone="neutral"
			className={
				className ? `jetpack-send-text-action ${ className }` : 'jetpack-send-text-action'
			}
			render={ <button type="button" ref={ ref } /> }
			{ ...rest }
		>
			{ children }
		</Link>
	)
);

export default TextAction;
