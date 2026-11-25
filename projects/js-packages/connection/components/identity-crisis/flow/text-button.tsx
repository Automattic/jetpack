import { Link } from '@wordpress/ui';
import styles from '../styles.module.scss';
import type { ReactNode } from 'react';

interface TextButtonProps {
	onClick: () => void;
	disabled?: boolean;
	/** Filled in by `createInterpolateElement()` when the button sits inside a sentence. */
	children?: ReactNode;
}

/**
 * A button that reads as a link, for a change of step inside a sentence.
 *
 * @param {TextButtonProps} props - Component props.
 * @return {ReactNode} The button.
 */
export default function TextButton( { onClick, disabled, children }: TextButtonProps ): ReactNode {
	return (
		<Link
			render={ <button type="button" disabled={ disabled } /> }
			className={ styles[ 'text-button' ] }
			onClick={ onClick }
		>
			{ children }
		</Link>
	);
}
