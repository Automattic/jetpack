/**
 * External dependencies
 */
import { IconButton } from '@wordpress/components';

export default ( { label, onClick } ) => (
	<IconButton
		className="components-toolbar__control"
		label={ label }
		icon="edit"
		onClick={ onClick }
	/>
);
