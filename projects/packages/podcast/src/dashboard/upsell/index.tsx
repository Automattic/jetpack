import { getSiteData } from '@automattic/jetpack-script-data';
import {
	Button,
	Card,
	CardBody,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalText as Text,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const Upsell = () => {
	const siteSuffix = getSiteData()?.suffix ?? '';
	const checkoutUrl = siteSuffix
		? `https://wordpress.com/checkout/${ siteSuffix }/premium`
		: 'https://wordpress.com/pricing';

	return (
		<Card>
			<CardBody>
				<VStack spacing={ 4 }>
					<h2 className="podcast__section-heading">
						{ __( 'Manage episodes with a Premium plan', 'jetpack-podcast' ) }
					</h2>
					<Text variant="muted">
						{ __(
							'Upgrade to Premium to see every episode, track plays and durations, and manage your catalog from one place.',
							'jetpack-podcast'
						) }
					</Text>
					<div>
						<Button variant="primary" href={ checkoutUrl }>
							{ __( 'Upgrade to Premium', 'jetpack-podcast' ) }
						</Button>
					</div>
				</VStack>
			</CardBody>
		</Card>
	);
};

export default Upsell;
