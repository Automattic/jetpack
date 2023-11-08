import { CheckboxControl } from '@wordpress/components';

function EditorSerivceItem( { onChange } ) {
	let label;
	return (
		<div>
			<CheckboxControl onChange={ onChange } label={ label } />
		</div>
	);
}

export default EditorSerivceItem;
