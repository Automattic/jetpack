/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';

/**
 * Internal dependencies
 */
import './style.scss';

class Spinner extends Component {
	render() {
		const { size = 20 } = this.props;

		const style = {
			width: size,
			height: size,
			fontSize: size, // allows border-width to be specified in em units
		};

		return (
			<div className="jetpack-instant-search__spinner">
				<div className="jetpack-intant-search__spinner__outer" style={ style }>
					<div className="jetpack-intant-search__spinner__inner" />
				</div>
			</div>
		);
	}
}

export default Spinner;
