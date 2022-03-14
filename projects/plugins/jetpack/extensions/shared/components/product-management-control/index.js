/**
 * Internal dependencies
 */
import './store';
import ProductManagementInspectorControl from './inspector-control';
import ProductManagementToolbarControl from './toolbar-control';

import './style.scss';

export default function ProductManagementControl() {
	return (
		<>
			<ProductManagementInspectorControl />
			<ProductManagementToolbarControl />
		</>
	);
}
