/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classNames from 'classnames';
import { noop, size } from 'lodash';

/**
 * Internal dependencies
 */
import { getPlanClass } from 'lib/plans/constants';
import Button from 'components/button';
import Card from 'components/card';
import Gridicon from 'components/gridicon';
import PlanIcon from 'components/plans/plan-icon';

import './style.scss';

class Banner extends Component {
	static propTypes = {
		callToAction: PropTypes.string,
		className: PropTypes.string,
		description: PropTypes.node,
		event: PropTypes.string,
		feature: PropTypes.string, // PropTypes.oneOf( getValidFeatureKeys() ),
		href: PropTypes.string,
		icon: PropTypes.string,
		list: PropTypes.arrayOf( PropTypes.string ),
		onClick: PropTypes.func,
		plan: PropTypes.string,
		siteSlug: PropTypes.string,
		title: PropTypes.string.isRequired,
	};

	static defaultProps = {
		onClick: noop,
	};

	getHref() {
		const { href, feature, siteSlug } = this.props;

		if ( ! href && siteSlug ) {
			if ( feature ) {
				return `/plans/${ siteSlug }?feature=${ feature }`;
			}
			return `/plans/${ siteSlug }`;
		}
		return href;
	}

	handleClick = () => {
		this.props.onClick();
	};

	getIcon() {
		const { icon, plan } = this.props;

		if ( plan && ! icon ) {
			return (
				<div className="dops-banner__icon-plan">
					<PlanIcon plan={ plan } />
				</div>
			);
		}

		return (
			<div className="dops-banner__icons">
				<div className="dops-banner__icon">
					<Gridicon icon={ icon || 'info-outline' } size={ 18 } />
				</div>
				<div className="dops-banner__icon-circle">
					<Gridicon icon={ icon || 'info-outline' } size={ 18 } />
				</div>
			</div>
		);
	}

	getContent() {
		const { callToAction, description, list, title } = this.props;

		return (
			<div className="dops-banner__content">
				<div className="dops-banner__info">
					<div className="dops-banner__title">{ title }</div>
					{ description && <div className="dops-banner__description">{ description }</div> }
					{ size( list ) > 0 && (
						<ul className="dops-banner__list">
							{ list.map( ( item, key ) => (
								<li key={ key }>
									<Gridicon icon="checkmark" size={ 18 } />
									{ item }
								</li>
							) ) }
						</ul>
					) }
				</div>
				{ callToAction && (
					<div className="dops-banner__action">
						{ callToAction && (
							<Button compact href={ this.getHref() } onClick={ this.handleClick } primary>
								{ callToAction }
							</Button>
						) }
					</div>
				) }
			</div>
		);
	}

	render() {
		const { callToAction, className, plan } = this.props;
		const planClass = getPlanClass( plan );

		const classes = classNames(
			'dops-banner',
			className,
			{ 'has-call-to-action': callToAction },
			{ 'is-upgrade-personal': 'is-personal-plan' === planClass },
			{ 'is-upgrade-premium': 'is-premium-plan' === planClass },
			{ 'is-upgrade-business': 'is-business-plan' === planClass }
		);

		return (
			<Card
				className={ classes }
				href={ callToAction ? null : this.getHref() }
				onClick={ callToAction ? noop : this.handleClick }
			>
				{ this.getIcon() }
				{ this.getContent() }
			</Card>
		);
	}
}

export default Banner;
