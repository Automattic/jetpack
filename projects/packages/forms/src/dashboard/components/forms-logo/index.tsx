/**
 * External dependencies
 */
import JetpackLogo from '@automattic/jetpack-components/jetpack-logo';
/**
 * WordPress dependencies
 */
import { Stack } from '@wordpress/ui';

/**
 * Forms logo with product name for dashboard headers.
 *
 * @return The Forms logo component.
 */
export default function FormsLogo() {
	return (
		<Stack align="center" gap="xs">
			<JetpackLogo showText={ false } width={ 20 } />
			{ /** "Jetpack Forms" and "Forms" are Product names, do not translate. */ }
			Forms
		</Stack>
	);
}
