import './style.scss';

export default function InspectorNotice( { children } ) {
	return (
		<div className="jetpack-inspector-notice">
			<span>{ children }</span>
		</div>
	);
}
