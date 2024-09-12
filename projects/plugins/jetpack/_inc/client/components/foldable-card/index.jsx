import clsx from 'clsx';
import Card from 'components/card';
import CompactCard from 'components/card/compact';
import Gridicon from 'components/gridicon';
import { noop } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import onKeyDownCallback from 'utils/onkeydown-callback';
import './style.scss';

class FoldableCard extends React.Component {
	static propTypes = {
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
		clickableHeaderText: PropTypes.bool,
	};

	static defaultProps = {
		onOpen: noop,
		onClose: noop,
		cardKey: '',
		icon: 'chevron-down',
		isExpanded: false,
		clickableHeader: false,
		clickableHeaderText: false,
	};

	state = {
		expanded: this.props.expanded,
	};

	onClick = () => {
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
	};

	getClickAction = () => {
		if ( this.props.disabled ) {
			return;
		}
		return this.onClick;
	};

	getActionButton = () => {
		if ( this.state.expanded ) {
			return this.props.actionButtonExpanded || this.props.actionButton;
		}
		return this.props.actionButton;
	};

	renderActionButton = () => {
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
				<button
					type="button"
					disabled={ this.props.disabled }
					className="dops-foldable-card__action dops-foldable-card__expand"
					onClick={ clickAction }
				>
					<span className="screen-reader-text">More</span>
					<Gridicon icon={ this.props.icon } size={ iconSize } />
				</button>
			);
		}
	};

	renderContent = () => {
		return <div className="dops-foldable-card__content">{ this.props.children }</div>;
	};

	renderHeader = () => {
		const summary = this.props.summary ? (
				<span className="dops-foldable-card__summary">{ this.props.summary } </span>
			) : null,
			expandedSummary = this.props.expandedSummary ? (
				<span className="dops-foldable-card__summary_expanded">
					{ this.props.expandedSummary }{ ' ' }
				</span>
			) : null,
			header = this.props.header ? (
				<div className="dops-foldable-card__header-text">{ this.props.header }</div>
			) : null,
			subheader = this.props.subheader ? (
				<div className="dops-foldable-card__subheader">{ this.props.subheader }</div>
			) : null,
			clickableProps = {
				role: 'button',
				tabIndex: 0,
				onClick: this.getClickAction(),
				onKeyDown: onKeyDownCallback( this.getClickAction() ),
			},
			headerClasses = clsx( 'dops-foldable-card__header', {
				'is-clickable': !! this.props.clickableHeader,
				'has-border': !! this.props.summary,
			} ),
			headerTextClasses = clsx( 'dops-foldable-card__header-text', {
				'is-clickable': !! this.props.clickableHeaderText,
			} );
		return (
			<div className={ headerClasses } { ...( this.props.clickableHeader ? clickableProps : {} ) }>
				<span className="dops-foldable-card__main">
					<div
						className={ headerTextClasses }
						{ ...( this.props.clickableHeaderText ? clickableProps : {} ) }
					>
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
	};

	render() {
		const Container = this.props.compact ? CompactCard : Card,
			itemSiteClasses = clsx( 'dops-foldable-card', this.props.className, {
				'is-disabled': !! this.props.disabled,
				'is-expanded': !! this.state.expanded,
				'has-expanded-summary': !! this.props.expandedSummary,
			} );

		return (
			<Container className={ itemSiteClasses }>
				{ this.renderHeader() }
				{ this.state.expanded && this.renderContent() }
			</Container>
		);
	}
}

export default FoldableCard;
