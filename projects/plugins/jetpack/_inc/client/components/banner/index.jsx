import classNames from 'classnames';
import Button from 'components/button';
import Card from 'components/card';
import Gridicon from 'components/gridicon';
import PlanIcon from 'components/plans/plan-icon';
import analytics from 'lib/analytics';
import {
	getPlanClass,
	isJetpackProduct,
	isJetpackBundle,
	isJetpackLegacyPlan,
} from 'lib/plans/constants';
import { noop, size } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect as reduxConnect } from 'react-redux';
import { isCurrentUserLinked, isConnectionOwner } from 'state/connection';
import { getCurrentVersion } from 'state/initial-state';

import './style.scss';

export class Banner extends Component {
	static propTypes = {
		callToAction: PropTypes.string,
		className: PropTypes.string,
		currentVersion: PropTypes.string.isRequired,
		description: PropTypes.node,
		eventFeature: PropTypes.string,
		eventProps: PropTypes.object,
		feature: PropTypes.string, // PropTypes.oneOf( getValidFeatureKeys() ),
		href: PropTypes.string,
		icon: PropTypes.string,
		iconAlt: PropTypes.string,
		iconSrc: PropTypes.string,
		list: PropTypes.arrayOf( PropTypes.string ),
		onClick: PropTypes.func,
		path: PropTypes.string,
		plan: PropTypes.string,
		siteSlug: PropTypes.string,
		title: PropTypes.node.isRequired,
		isCurrentUserLinked: PropTypes.bool,
		isConnectionOwner: PropTypes.bool,
	};

	static defaultProps = {
		onClick: noop,
		eventProps: {},
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

		const { eventFeature, path, currentVersion, eventProps } = this.props;
		if ( eventFeature || path ) {
			const eventFeatureProp = eventFeature ? { feature: eventFeature } : {};
			const pathProp = path ? { path } : {};

			const clickEventProps = {
				target: 'banner',
				type: 'upgrade',
				current_version: currentVersion,
				is_user_wpcom_connected: this.props.isCurrentUserLinked ? 'yes' : 'no',
				is_connection_owner: this.props.isConnectionOwner ? 'yes' : 'no',
				...eventFeatureProp,
				...pathProp,
				...eventProps,
			};

			analytics.tracks.recordJetpackClick( clickEventProps );
		}
	};

	getIcon() {
		const { icon, iconAlt, iconSrc, plan } = this.props;

		if ( plan && ( ! icon || ! iconSrc ) ) {
			return (
				<div className="dops-banner__icon-plan">
					<PlanIcon plan={ plan } />
				</div>
			);
		}

		return (
			<div className="dops-banner__icons">
				<div className="dops-banner__icon">
					{ icon && <Gridicon icon={ icon || 'info-outline' } size={ 18 } /> }
					{ iconSrc && (
						<img className="dops-banner__icon-circle-svg" src={ iconSrc } alt={ iconAlt } />
					) }
				</div>
				<div className="dops-banner__icon-circle">
					{ icon && <Gridicon icon={ icon || 'info-outline' } size={ 18 } /> }
					{ iconSrc && (
						<img className="dops-banner__icon-circle-svg" src={ iconSrc } alt={ iconAlt } />
					) }
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
		const isLegacy = isJetpackLegacyPlan( plan );
		const isProduct = isJetpackProduct( plan );

		const classes = classNames(
			'dops-banner',
			className,
			{ 'has-call-to-action': callToAction },
			{ 'is-upgrade-personal': isLegacy && 'is-personal-plan' === planClass },
			{ 'is-upgrade-premium': isLegacy && 'is-premium-plan' === planClass },
			{ 'is-upgrade-business': isLegacy && 'is-business-plan' === planClass },
			{ 'is-product': isProduct },
			{ 'is-plan': ! isProduct },
			{ 'is-bundle': ! isProduct && isJetpackBundle( plan ) }
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

/**
 * Redux-connect a Banner or subclass.
 *
 * @param {Banner} BannerComponent - Component to connect.
 * @returns {Component} Wrapped component.
 */
export function connect( BannerComponent ) {
	return reduxConnect( state => ( {
		currentVersion: getCurrentVersion( state ),
		isCurrentUserLinked: isCurrentUserLinked( state ),
		isConnectionOwner: isConnectionOwner( state ),
	} ) )( BannerComponent );
}

export default connect( Banner );
