import { Button, Text } from '@wordpress/ui';
import styles from './styles.module.scss';
import type { IdentityCrisisOptionProps } from './types';
import type { ReactNode } from 'react';

/**
 * One Safe Mode resolution in a box: what it does and the button that does it.
 *
 * @param {IdentityCrisisOptionProps} props - Component props.
 * @return {ReactNode} The option.
 */
export default function IdentityCrisisOption( {
	title,
	description,
	visual,
	buttonLabel,
	onClick,
	isBusy = false,
	disabled = false,
	isPrimary = false,
	error,
}: IdentityCrisisOptionProps ): ReactNode {
	return (
		<div className={ styles.option }>
			<Text variant="heading-lg" render={ <h3 /> }>
				{ title }
			</Text>
			<Text variant="body-md" render={ <div /> }>
				{ description }
			</Text>
			{ visual }
			{ error }
			<Button
				variant={ isPrimary ? 'solid' : 'outline' }
				onClick={ onClick }
				loading={ isBusy }
				// The Button only disables itself while loading when `disabled` is undefined.
				disabled={ disabled || isBusy }
				className={ styles[ 'option-button' ] }
			>
				{ buttonLabel }
			</Button>
		</div>
	);
}
