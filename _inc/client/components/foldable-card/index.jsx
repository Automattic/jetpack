/**
 * External Dependencies
 */
const PropTypes = require( 'prop-types' );
const React = require( 'react' ),
	classNames = require( 'classnames' ),
	noop = require( 'lodash/noop' );

/**
 * Internal Dependencies
 */
const Card = require( 'components/card' ),
	CompactCard = require( 'components/card/compact' ),
	Gridicon = require( 'components/gridicon' ),
	onKeyDownCallback = require( 'utils/onkeydown-callback' );

require( './style.scss' );

const FoldableCard = React.createClass( {

	propTypes: {
		actionButton: PropTypes.element,
		actionButtonExpanded: PropTypes.element,
		cardKey: PropTypes.string,
		compact: PropTypes.bool,
		disabled: PropTypes.bool,
		expandedSummary: PropTypes.oneOfType( [ PropTypes.string, PropTypes.element ] ),
		expanded: PropTypes.bool,
		icon: PropTypes.string,
		onClick: PropTypes.func,
		onClose: PropTypes.func,
		onOpen: PropTypes.func,
		summary: PropTypes.oneOfType( [ PropTypes.string, PropTypes.element ] ),
		clickableHeader: PropTypes.bool,
		clickableHeaderText: PropTypes.bool
	},

	getInitialState: function() {
		return {
			expanded: this.props.expanded
		};
	},

	getDefaultProps: function() {
		return {
			onOpen: noop,
			onClose: noop,
			cardKey: '',
			icon: 'chevron-down',
			isExpanded: false,
			clickableHeader: false,
			clickableHeaderText: false
		};
	},

	onClick: function() {
		if ( this.props.children ) {
			this.setState( { expanded: ! this.state.expanded } );
		}

		if ( this.props.onClick ) {
			this.props.onClick();
		}

		if ( this.state.expanded ) {
			this.props.onClose( this.props.cardKey );
		} else {
			this.props.onOpen( this.props.cardKey );
		}
	},

	getClickAction: function() {
		if ( this.props.disabled ) {
			return;
		}
		return this.onClick;
	},

	getActionButton: function() {
		if ( this.state.expanded ) {
			return this.props.actionButtonExpanded || this.props.actionButton;
		}
		return this.props.actionButton;
	},

	renderActionButton: function() {
		const clickAction = ! this.props.clickableHeader ? this.getClickAction() : null;
		if ( this.props.actionButton ) {
			return (
				<button className="dops-foldable-card__action" onClick={ clickAction }>
				{ this.getActionButton() }
				</button>
			);
		}
		if ( this.props.children ) {
			const iconSize = 24;
			return (
				<button type="button" disabled={ this.props.disabled } className="dops-foldable-card__action dops-foldable-card__expand" onClick={ clickAction }>
					<span className="screen-reader-text">More</span>
					<Gridicon icon={ this.props.icon } size={ iconSize } />
				</button>
			);
		}
	},

	renderContent: function() {
		return (
			<div className="dops-foldable-card__content">
				{ this.props.children }
			</div>
		);
	},

	renderHeader: function() {
		const summary = this.props.summary ? <span className="dops-foldable-card__summary">{ this.props.summary } </span> : null,
			expandedSummary = this.props.expandedSummary ? <span className="dops-foldable-card__summary_expanded">{ this.props.expandedSummary } </span> : null,
			header = this.props.header ? <div className="dops-foldable-card__header-text">{ this.props.header }</div> : null,
			subheader = this.props.subheader ? <div className="dops-foldable-card__subheader">{ this.props.subheader }</div> : null,
			clickableProps = {
				role: 'button',
				tabIndex: 0,
				onClick: this.getClickAction(),
				onKeyDown: onKeyDownCallback( this.getClickAction() ),
			},
			headerClasses = classNames( 'dops-foldable-card__header', {
				'is-clickable': !! this.props.clickableHeader,
				'has-border': !! this.props.summary
			} ),
			headerTextClasses = classNames( 'dops-foldable-card__header-text', {
				'is-clickable': !! this.props.clickableHeaderText
			} );
		return (
			<div className={ headerClasses } { ...( this.props.clickableHeader ? clickableProps : {} ) }>
				<span className="dops-foldable-card__main">
					<div className={ headerTextClasses } { ...( this.props.clickableHeaderText ? clickableProps : {} ) }>
						{ header }
						{ subheader }
					</div>
				</span>
				<span className="dops-foldable-card__secondary">
					{ summary }
					{ expandedSummary }
					{ this.renderActionButton() }
				</span>
			</div>
		);
	},

	render: function() {
		const Container = this.props.compact ? CompactCard : Card,
			itemSiteClasses = classNames(
				'dops-foldable-card',
				this.props.className,
				{
					'is-disabled': !! this.props.disabled,
					'is-expanded': !! this.state.expanded,
					'has-expanded-summary': !! this.props.expandedSummary
				}
			);

		return (
			<Container className={ itemSiteClasses }>
				{ this.renderHeader() }
				{ this.state.expanded && this.renderContent() }
			</Container>
		);
	}
} );

module.exports = FoldableCard;
