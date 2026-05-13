import { __ } from '@wordpress/i18n';
import { Badge } from '@wordpress/ui';

const Upgraded = () => (
	<Badge intent="stable" style={ { marginInlineStart: 'var(--wpds-dimension-gap-sm, 8px)' } }>
		{ __( 'Upgraded', 'jetpack-boost' ) }
	</Badge>
);

export default Upgraded;
