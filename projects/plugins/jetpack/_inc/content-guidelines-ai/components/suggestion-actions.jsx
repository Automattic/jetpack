import { Button, TextareaControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { STORE_NAME } from '../constants';
import { AI_STORE_NAME } from '../store';

export default function SuggestionActions( { slug } ) {
	const suggestion = useSelect(
		select => select( AI_STORE_NAME ).getSuggestion( slug ),
		[ slug ]
	);
	const { clearSuggestion } = useDispatch( AI_STORE_NAME );
	const { setGuideline } = useDispatch( STORE_NAME );

	const handleAccept = useCallback( () => {
		setGuideline( slug, suggestion );
		clearSuggestion( slug );
	}, [ slug, suggestion, setGuideline, clearSuggestion ] );

	const handleDismiss = useCallback( () => {
		clearSuggestion( slug );
	}, [ slug, clearSuggestion ] );

	if ( ! suggestion ) {
		return null;
	}

	return (
		<div className="jetpack-content-guidelines-ai__suggestion">
			<TextareaControl
				value={ suggestion }
				readOnly
				rows={ 6 }
				className="jetpack-content-guidelines-ai__suggestion-text"
			/>
			<div className="jetpack-content-guidelines-ai__suggestion-actions">
				<Button variant="primary" onClick={ handleAccept }>
					{ __( 'Accept suggestion', 'jetpack' ) }
				</Button>
				<Button variant="tertiary" onClick={ handleDismiss }>
					{ __( 'Dismiss', 'jetpack' ) }
				</Button>
			</div>
		</div>
	);
}
