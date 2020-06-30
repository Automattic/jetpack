/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { noop, size } from 'lodash';
import { ProductIcon } from '@automattic/components';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import { getPlanClass } from 'lib/plans/constants';
import Button from 'components/button';
import Card from 'components/card';
import Gridicon from 'components/gridicon';
import { getCurrentVersion } from 'state/initial-state';

import './style.scss';

class Banner extends Component {
	static propTypes = {
		callToAction: PropTypes.string,
		className: PropTypes.string,
		currentVersion: PropTypes.string.isRequired,
		description: PropTypes.node,
		eventFeature: PropTypes.string,
		feature: PropTypes.string, // PropTypes.oneOf( getValidFeatureKeys() ),
		href: PropTypes.string,
		icon: PropTypes.string,
		list: PropTypes.arrayOf( PropTypes.string ),
		onClick: PropTypes.func,
		path: PropTypes.string,
		product: PropTypes.string,
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

		const { eventFeature, path, currentVersion } = this.props;
		if ( eventFeature || path ) {
			const eventFeatureProp = eventFeature ? { feature: eventFeature } : {};
			const pathProp = path ? { path } : {};

			const eventProps = {
				target: 'banner',
				type: 'upgrade',
				current_version: currentVersion,
				...eventFeatureProp,
				...pathProp,
			};

			analytics.tracks.recordJetpackClick( eventProps );
		}
	};

	getIcon() {
		const { icon, product } = this.props;

		if ( product && ! icon ) {
			return (
				<div className="dops-banner__icon-plan">
					<ProductIcon slug={ product } />
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
		const { callToAction, className, product } = this.props;
		const planClass = getPlanClass( product );

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

export default connect( state => ( {
	currentVersion: getCurrentVersion( state ),
} ) )( Banner );
