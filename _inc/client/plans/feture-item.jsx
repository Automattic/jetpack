/**
 * External dependencies
 */
import React, { Component } from 'react';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';

export default class FeatureItem extends Component {
	featureLinkClickHandler = () => {
		const { feature, productSlug } = this.props;

		analytics.tracks.recordJetpackClick( {
			target: feature.id,
			type: 'feature-discovery',
			plan: productSlug,
			page: 'Plans',
		} );
	};

	renderFeatureLink( feature ) {
		const { siteRawUrl, userId } = this.props;

		return (
			<a
				onClick={ this.featureLinkClickHandler }
				href={ `https://jetpack.com/features/${ feature.info }?site=${ siteRawUrl }&u=${ userId }` }
			>
				{ feature.name }
			</a>
		);
	}

	render() {
		const { itemKey, feature, hideBackupFeature } = this.props;

		// empty?
		if ( typeof feature === 'undefined' || hideBackupFeature ) {
			return <td key={ itemKey } className="plan-features__table-item" />;
		}
		return (
			<td key={ itemKey } className="plan-features__table-item has-partial-border">
				<div className="plan-features__item">
					{ feature.info ? this.renderFeatureLink( feature ) : feature.name }
				</div>
			</td>
		);
	}
}
