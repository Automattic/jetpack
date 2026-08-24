export default function InspectorHint( { children } ) {
	return (
		<p
			style={ {
				color: 'rgba( 117, 117, 117, 1 )',
				marginBottom: '24px',
			} }
		>
			{ children }
		</p>
	);
}
