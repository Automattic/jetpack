/** @ssr-ready **/

import { ExternalLink } from '@wordpress/components';
import clsx from 'clsx';
import Count from 'components/count';
import PropTypes from 'prop-types';
import React from 'react';

/**
 * Main
 */
class NavItem extends React.PureComponent {
	static displayName = 'NavItem';

	static propTypes = {
		itemType: PropTypes.string,
		path: PropTypes.string,
		selected: PropTypes.bool,
		tabIndex: PropTypes.number,
		onClick: PropTypes.func,
		isExternalLink: PropTypes.bool,
		disabled: PropTypes.bool,
		count: PropTypes.number,
	};

	domNode = null;

	render() {
		const itemClassPrefix = this.props.itemType ? this.props.itemType : 'tab';
		const itemClasses = {
			'is-selected': this.props.selected,
			'is-external': this.props.isExternalLink,
		};
		itemClasses[ 'dops-section-nav-' + itemClassPrefix ] = true;
		const itemClassName = clsx( itemClasses );
		let onClick;

		if ( ! this.props.disabled ) {
			onClick = this.props.onClick;
		}

		return (
			<li ref={ node => ( this.domNode = node ) } className={ itemClassName }>
				{ ! this.props.isExternalLink && (
					<a
						href={ this.props.path }
						className={ 'dops-section-nav-' + itemClassPrefix + '__link' }
						onClick={ onClick }
						tabIndex={ this.props.tabIndex || 0 }
						disabled={ this.props.disabled }
						role="menuitem"
					>
						<span className={ 'dops-section-nav-' + itemClassPrefix + '__text' }>
							{ this.props.children }
							{ 'number' === typeof this.props.count && <Count count={ this.props.count } /> }
						</span>
					</a>
				) }

				{ this.props.isExternalLink && (
					<ExternalLink
						href={ this.props.path }
						target="_blank"
						rel="external"
						onClick={ onClick }
						className={ 'dops-section-nav-' + itemClassPrefix + '__link' }
						disabled={ this.props.disabled }
						role="menuitem"
					>
						<span className={ 'dops-section-nav-' + itemClassPrefix + '__text' }>
							{ this.props.children }
							{ 'number' === typeof this.props.count && <Count count={ this.props.count } /> }
						</span>
					</ExternalLink>
				) }
			</li>
		);
	}
}

export default NavItem;
