/** External Dependencies **/
const React = require( 'react' );

/** Internal Dependencies **/
const Button = require( '../button' );

export default class Submit extends React.Component {
	static displayName = 'Submit';

	render() {
		let { ...other } = this.props;

		return (
			<Button { ...other } type="submit">{this.props.children}</Button>
		);
	}
}
