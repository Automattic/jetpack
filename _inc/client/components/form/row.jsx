/** External Dependencies **/
const React = require( 'react' );

module.exports = class extends React.Component {
	static displayName = 'Row';

	render() {
		return (
			<div className="dops-form-row">
				{this.props.children}
			</div>
		);
	}
};
