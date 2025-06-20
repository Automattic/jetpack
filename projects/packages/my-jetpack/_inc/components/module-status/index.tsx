import { Badge } from '@automattic/ui';
import { __ } from '@wordpress/i18n';
import { MyJetpackModule } from '../types';

import '@automattic/ui/style.css';

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
		return <Badge intent="success">{ __( 'Active', 'jetpack-my-jetpack' ) }</Badge>;
	}

	return null;
}
