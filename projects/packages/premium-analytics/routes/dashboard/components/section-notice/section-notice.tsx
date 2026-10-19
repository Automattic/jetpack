/**
 * External dependencies
 */
import { Notice } from '@jetpack-premium-analytics/externals';
import { speak } from '@wordpress/a11y';
import { useEffect } from 'react';
/**
 * Internal dependencies
 */
import styles from './section-notice.module.scss';

/**
 * The message a section's registration puts above its widgets, such as a store with no orders yet.
 *
 * @param props         - Component props.
 * @param props.message - The message, already translated by the registrant.
 * @return The notice.
 */
export function SectionNotice( { message }: { message: string } ) {
	useEffect( () => {
		speak( message, 'polite' );
	}, [ message ] );

	return (
		<Notice.Root intent="info" className={ styles.notice }>
			<Notice.Description>{ message }</Notice.Description>
		</Notice.Root>
	);
}
