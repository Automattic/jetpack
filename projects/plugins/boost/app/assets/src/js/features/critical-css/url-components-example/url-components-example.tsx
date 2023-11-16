import { __ } from '@wordpress/i18n';

const UrlComponentsExample = () => {
	const protocol = window.location.protocol.split( ':' )[ 0 ];
	const hostname = window.location.hostname;

	return (
		<div className="url-container">
			<div className="segment">
				<div className="label">{ __( 'Protocol', 'jetpack-boost' ) }</div>

				<div className="arrows" />

				{ protocol }
			</div>
			<div className="segment">://</div>
			<div className="segment">
				<div className="label">{ __( 'Host name', 'jetpack-boost' ) }</div>

				<div className="arrows" />

				{ hostname }
			</div>
		</div>
	);
};

export default UrlComponentsExample;
