/* eslint-disable wpcalypso/import-docblock */
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, ExternalLink, Placeholder } from '@wordpress/components';

const UpgradePlan = ( { className = '', upgradeUrl } ) => {
	return (
		<div className={ `${ className } donations__upgrade-plan` }>
			<Placeholder
				icon="lock"
				label={ __( 'Donations', 'jetpack' ) }
				instructions={ __(
					"You'll need to upgrade your plan to use the Donations block.",
					'jetpack'
				) }
			>
				<Button
					isSecondary
					isLarge
					href={ upgradeUrl }
					target="_blank"
					className="donations__button plan-nudge__button"
				>
					{ __( 'Upgrade Your Plan', 'jetpack' ) }
				</Button>
				<div className="donations__disclaimer membership-button__disclaimer">
					<ExternalLink href="https://wordpress.com/support/donations-block/">
						{ __( 'Read more about Donations and related fees.', 'jetpack' ) }
					</ExternalLink>
				</div>
			</Placeholder>
		</div>
	);
};

export default UpgradePlan;
