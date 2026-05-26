import { Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Badge } from '@wordpress/ui';
import { AI_STORE_NAME } from '../store';

export default function SuggestionBadge( { slug } ) {
	const sectionLoading = useSelect(
		select => select( AI_STORE_NAME ).isSectionLoading( slug ),
		[ slug ]
	);
	const hasSuggestion = useSelect(
		select => select( AI_STORE_NAME ).hasSuggestion( slug ),
		[ slug ]
	);

	if ( sectionLoading && ! hasSuggestion ) {
		return (
			<span className="jetpack-content-guidelines-ai__badge--loading">
				<Spinner />
			</span>
		);
	}

	if ( hasSuggestion ) {
		return <Badge intent="stable">{ __( 'Suggestion', 'jetpack' ) }</Badge>;
	}

	return null;
}
