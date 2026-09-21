import { __, _n, sprintf } from '@wordpress/i18n';
import { useId, type ReactNode } from 'react';
import ChevronDown from '$svg/chevron-down';
import ChevronUp from '$svg/chevron-up';
import styles from './except-panel.module.scss';

type ExceptPanelProps = {
	exceptions: string[];
	countExceptions: boolean;
	isExpanded: boolean;
	onToggle: () => void;
	children: ReactNode;
};

export default function ExceptPanel( {
	exceptions,
	countExceptions,
	isExpanded,
	onToggle,
	children,
}: ExceptPanelProps ) {
	const id = useId();
	const entries = exceptions.filter( entry => entry.trim() !== '' );
	let summary: string = __( 'None', 'jetpack-boost' );
	if ( entries.length ) {
		summary = countExceptions
			? sprintf(
					/* translators: %d is the number of excluded pages. */
					_n( '%d page', '%d pages', entries.length, 'jetpack-boost' ),
					entries.length
				)
			: entries.join( ', ' );
	}

	return (
		<div className={ styles.panel }>
			<button
				type="button"
				className={ styles.toggle }
				aria-expanded={ isExpanded }
				aria-controls={ id }
				onClick={ onToggle }
			>
				<span>{ __( 'Except', 'jetpack-boost' ) }</span>{ ' ' }
				<span className={ styles.summary }>{ summary }</span>
				{ isExpanded ? <ChevronUp /> : <ChevronDown /> }
			</button>
			<div id={ id } hidden={ ! isExpanded } className={ styles.content }>
				{ isExpanded && children }
			</div>
		</div>
	);
}
