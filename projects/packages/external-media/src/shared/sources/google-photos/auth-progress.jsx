import { memo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';

/**
 * AuthProgress component
 *
 * @return {import('react').ReactElement} - JSX Element
 */
function AuthProgress() {
	return (
		<Text variant="body-lg">{ __( 'Awaiting authorization', 'jetpack-external-media' ) }</Text>
	);
}

export default memo( AuthProgress );
