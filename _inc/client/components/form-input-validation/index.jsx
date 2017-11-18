/**
 * External dependencies
 */
const React = require( 'react' ),
	classNames = require( 'classnames' ),
	Gridicon = require( 'components/gridicon' );

require( './style.scss' );

module.exports = React.createClass( {

	displayName: 'FormInputValidation',

	propTypes: {
		isError: React.PropTypes.bool,
		isWarning: React.PropTypes.bool,
		text: React.PropTypes.node,
		icon: React.PropTypes.string
	},

	getDefaultProps: function() {
		return { isError: false };
	},

	render: function() {
		const classes = classNames( {
			'form-input-validation': true,
			'is-warning': this.props.isWarning,
			'is-error': this.props.isError
		} );

		const icon = this.props.isError || this.props.isWarning ? 'notice-outline' : 'checkmark';

		return (
			<div className={ classes }>
				<span><Gridicon size={ 24 } icon={ this.props.icon ? this.props.icon : icon } /> { this.props.text }</span>
			</div>
		);
	}
} );
