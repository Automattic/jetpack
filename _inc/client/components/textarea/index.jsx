/**
 * External dependencies
 */
const React = require( 'react' ),
	classnames = require( 'classnames' ),
	omit = require( 'lodash/omit' );

require( './style.scss' );

export default class Textarea extends React.Component {
	static displayName = 'Textarea';

	render() {
		return (
			<textarea { ...omit( this.props, 'className' ) } className={ classnames( this.props.className, 'dops-textarea' ) } >
				{ this.props.children }
			</textarea>
		);
	}
}
