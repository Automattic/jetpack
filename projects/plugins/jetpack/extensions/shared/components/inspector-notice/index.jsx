import './style.scss';

export default function InspectorNotice( { children, spanClass } ) {
	return (
		<div className="jetpack-inspector-notice">
			<span className={ spanClass }>{ children }</span>
		</div>
	);
}
