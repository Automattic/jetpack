/**
 * External dependencies
 */
import { JetpackLogo } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import './style.scss';

export default function InspectorNotice( { children } ) {
	return (
		<div className="jetpack-inspector-notice">
			<span>{ children }</span>
			<JetpackLogo height={ 16 } logoColor="#1a1a1a" showText={ false } />
		</div>
	);
}
