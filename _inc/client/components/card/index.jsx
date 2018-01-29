var React = require( 'react' ),
	Gridicon = require( '../gridicon' ),
	classnames = require( 'classnames' );

import assign from 'lodash/assign';
import omit from 'lodash/omit';

require( './style.scss' );

let CardSection = React.createClass( {

	propTypes: {
		title: React.PropTypes.any,
		vertical: React.PropTypes.any,
		style: React.PropTypes.object,
		className: React.PropTypes.string,
		device: React.PropTypes.oneOf( ['desktop', 'tablet', 'phone'] )
	},

	getDefaultProps: function() {
		return { vertical: null };
	},

	render: function() {
		return (
			<div className={classnames( 'dops-card-section', this.props.className )} style={this.props.style}>
				{this.props.title ?
					this._renderWithTitle() :
					this.props.children
				}
			</div>
		);
	},

	_renderWithTitle: function() {
		var orientation = this.props.vertical ? 'vertical' : 'horizontal';
		var wrapperClassName = 'dops-card-section-orient-' + orientation;

		return (
			<div className={wrapperClassName}>
				<h4 ref="label" className="dops-card-section-label">
					{this.props.title}
				</h4>
				<div ref="content" className="dops-card-section-content">
					{this.props.children}
				</div>
			</div>
		);
	}
} );

let CardFooter = React.createClass( {

	render: function() {
		return (
			<div className="dops-card-footer">
				{this.props.children}
			</div>
		);
	}
} );

let Card = React.createClass( {

	propTypes: {
		meta: React.PropTypes.any,
		icon: React.PropTypes.string,
		iconLabel: React.PropTypes.any,
		iconColor: React.PropTypes.string,
		style: React.PropTypes.object,
		className: React.PropTypes.string,
		href: React.PropTypes.string,
		title: React.PropTypes.string,
		tagName: React.PropTypes.string,
		target: React.PropTypes.string,
		compact: React.PropTypes.bool,
		children: React.PropTypes.node
	},

	getDefaultProps() {
		return {
			iconColor: '#787878',
			className: '',
			tagName: 'div'
		};
	},

	render: function() {
		const className = classnames( 'dops-card', this.props.className, {
			'is-card-link': !! this.props.href,
			'is-compact': this.props.compact
		} );

		const omitProps = [ 'compact', 'tagName', 'meta', 'iconColor' ];

		let linkIndicator;
		if ( this.props.href ) {
			linkIndicator = <Gridicon
				className="dops-card__link-indicator"
				icon={ this.props.target ? 'external' : 'chevron-right' } />;
		} else {
			omitProps.push( 'href', 'target' );
		}

		let fancyTitle;
		if ( this.props.title ) {
			fancyTitle = (
				<h2 className="dops-card-title">
					{ this.props.title }
					{ this.props.meta && <span className="dops-card-meta">{ this.props.meta }</span>}
					{( this.props.icon || this.props.iconLabel ) && (
						this._renderIcon()
					)}
				</h2>
			);
		}

		return React.createElement(
			this.props.href ? 'a' : this.props.tagName,
			assign( omit( this.props, omitProps ), { className } ),
			linkIndicator,
			fancyTitle,
			this.props.children
		);
	},

	_renderIcon: function() {
		return (
			<span className="dops-card-icon" style={{ color: this.props.iconColor }}>
				{ this.props.icon && <Gridicon icon={ this.props.icon } style={{ backgroundColor: this.props.iconColor }}/>}
				{ this.props.iconLabel }
			</span>
		);
	}
} );

Card.Section = CardSection;
Card.Footer = CardFooter;

module.exports = Card;
