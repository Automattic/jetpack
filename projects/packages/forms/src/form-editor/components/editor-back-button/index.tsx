/**
 * WordPress dependencies
 */
import { Button, Fill } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { FORM_POST_TYPE } from '../../../blocks/shared/util/constants.js';
import { getFormsReturnUrl } from '../../utils/get-return-url';

/**
 * Slot fill for editor header back button.
 *
 * @return Back button fill or null when not in form editor.
 */
export default function EditorBackButton(): JSX.Element | null {
	const postType = useSelect( select => select( 'core/editor' ).getCurrentPostType(), [] );

	const sourceId = useMemo( () => {
		const url = new URL( window.location.href );
		return url.searchParams.get( 'source_id' );
	}, [] );

	if ( postType !== FORM_POST_TYPE ) {
		return null;
	}

	const label = sourceId
		? __( 'Back to Form', 'jetpack-forms' )
		: __( 'View Forms', 'jetpack-forms' );

	const href = getFormsReturnUrl( sourceId );

	return (
		<Fill name="PinnedItems/core">
			<Button
				className="jp-forms-editor-back-button"
				href={ href }
				label={ label }
				showTooltip
				size="compact"
				variant="secondary"
			>
				{ label }
			</Button>
		</Fill>
	);
}
