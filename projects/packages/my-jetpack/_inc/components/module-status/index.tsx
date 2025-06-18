import { Badge } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { MyJetpackModule } from '../types';

export type ModuleStatusProps = {
	module: MyJetpackModule;
};

/**
 * Renders a badge indicating the status of a module.
 *
 * @param {ModuleStatusProps} props - The component props.
 *
 * @return The rendered component.
 */
export function ModuleStatus( { module: $module }: ModuleStatusProps ) {
	if ( $module.activated ) {
		// TODO replace this with Badge component from @automattic/ui when it's ready.
		return <Badge variant="success">{ __( 'Active', 'jetpack-my-jetpack' ) }</Badge>;
	}

	return null;
}
