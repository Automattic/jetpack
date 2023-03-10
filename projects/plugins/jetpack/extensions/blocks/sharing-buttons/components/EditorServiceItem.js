import { CheckboxControl } from '@wordpress/components';
function EditorSerivceItem({ onChange }) {
	return (
		<div>
			<CheckboxControl onChange={onChange} label={label} />
		</div>
	);
}

export default EditorSerivceItem;
