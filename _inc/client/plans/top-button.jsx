/**
 * External dependencies
 */
import React from 'react';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import analytics from 'lib/analytics';

export default class TopButton extends React.Component {
	clickHandler = () => {
		const { planType, productSlug } = this.props;

		analytics.tracks.recordJetpackClick( {
			target: `upgrade-${ planType }`,
			type: 'upgrade',
			plan: productSlug,
			page: 'Plans',
		} );
	};

	render() {
		const {
			buttonText,
			planType,
			isActivePlan,
			isPrimary,
			shouldRenderButton,
			siteRawUrl,
			plansUpgradeUrl,
		} = this.props;
		const url = isActivePlan
			? `https://wordpress.com/plans/my-plan/${ siteRawUrl }`
			: plansUpgradeUrl;
		const className = classNames(
			'plan-features__table-item',
			'has-border-bottom',
			'is-top-buttons'
		);
		if ( ! shouldRenderButton ) {
			return <td key={ 'button-' + planType } className={ className } />;
		}

		return (
			<td key={ 'button-' + planType } className={ className }>
				<Button href={ url } primary={ isPrimary } onClick={ this.clickHandler }>
					{ buttonText }
				</Button>
			</td>
		);
	}
}
