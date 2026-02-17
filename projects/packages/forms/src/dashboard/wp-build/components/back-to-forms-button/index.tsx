/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';

/**
 * wp-build primary action to return to the Forms list.
 *
 * @return Button element.
 */
export default function BackToFormsButton(): JSX.Element {
	const navigate = useNavigate();
	const onClick = useCallback( () => navigate( { href: '/forms' } ), [ navigate ] );

	return (
		<Button size="compact" variant="primary" onClick={ onClick }>
			{ __( 'Back to forms', 'jetpack-forms' ) }
		</Button>
	);
}
