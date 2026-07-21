import { ToolbarButton } from '@wordpress/components';

export default ( { label, onClick } ) => (
	<ToolbarButton
		className="components-toolbar__control"
		onClick={ onClick }
		icon="edit"
		title={ label }
		showTooltip
	></ToolbarButton>
);
