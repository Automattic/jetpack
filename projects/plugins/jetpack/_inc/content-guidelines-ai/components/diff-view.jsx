import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { diffWords } from 'diff';

export default function DiffView( { original, suggestion, onAccept, height } ) {
	const diff = useMemo( () => {
		if ( ! suggestion ) {
			return [];
		}
		return diffWords( original, suggestion );
	}, [ original, suggestion ] );

	const handleKeyDown = useCallback(
		e => {
			if ( e.key === 'Enter' || e.key === ' ' ) {
				e.preventDefault();
				onAccept();
			}
		},
		[ onAccept ]
	);

	return (
		<div
			className="jetpack-content-guidelines-ai__diff"
			style={ height ? { height } : undefined }
			role="button"
			tabIndex={ 0 }
			aria-label={ __( 'Click to accept suggested changes', 'jetpack' ) }
			onClick={ onAccept }
			onKeyDown={ handleKeyDown }
		>
			<span className="screen-reader-text">
				{ __( 'Changes from current to suggested guidelines:', 'jetpack' ) }
			</span>
			{ diff.map( ( part, i ) => {
				if ( part.added ) {
					return (
						<ins key={ i } className="jetpack-content-guidelines-ai__diff-added">
							{ part.value }
						</ins>
					);
				}
				if ( part.removed ) {
					return (
						<del key={ i } className="jetpack-content-guidelines-ai__diff-removed">
							{ part.value }
						</del>
					);
				}
				return <span key={ i }>{ part.value }</span>;
			} ) }
		</div>
	);
}
