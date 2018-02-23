/** @ssr-ready **/

/**
 * External Dependencies
 */
const PropTypes = require( 'prop-types' );
const React = require( 'react' ),
	PureRenderMixin = require( 'react-pure-render/mixin' ),
	classNames = require( 'classnames' );

const createReactClass = require( 'create-react-class' );

/**
 * Internal Dependencies
 */
const Count = require( 'components/count' );

/**
 * Main
 */
const NavItem = createReactClass( {
	displayName: 'NavItem',
	mixins: [ PureRenderMixin ],

	propTypes: {
		itemType: PropTypes.string,
		path: PropTypes.string,
		selected: PropTypes.bool,
		tabIndex: PropTypes.number,
		onClick: PropTypes.func,
		isExternalLink: PropTypes.bool,
		disabled: PropTypes.bool,
		count: PropTypes.number
	},

	render: function() {
		const itemClassPrefix = this.props.itemType
			? this.props.itemType
			: 'tab';
		const itemClasses = {
			'is-selected': this.props.selected,
			'is-external': this.props.isExternalLink
		};
		itemClasses[ 'dops-section-nav-' + itemClassPrefix ] = true;
		const itemClassName = classNames( itemClasses );
		let target, onClick;

		if ( this.props.isExternalLink ) {
			target = '_blank';
		}

		if ( ! this.props.disabled ) {
			onClick = this.props.onClick;
		}

		return (
			<li className={ itemClassName }>
				<a
					href={ this.props.path }
					target={ target }
					className={ 'dops-section-nav-' + itemClassPrefix + '__link' }
					onTouchTap={ onClick }
					tabIndex={ this.props.tabIndex || 0 }
					disabled={ this.props.disabled }
					role="menuitem"
					rel={ this.props.isExternalLink ? 'external' : null }>
					<span className={ 'dops-section-nav-' + itemClassPrefix + '__text' }>
						{ this.props.children }
						{
							'number' === typeof this.props.count &&
							<Count count={ this.props.count } />
						}
					</span>
				</a>
			</li>
		);
	},
} );

module.exports = NavItem;
