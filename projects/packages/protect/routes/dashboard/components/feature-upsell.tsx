import { Icon } from '@wordpress/icons';
import { ButtonLink, Stack, Text } from '@wordpress/ui';
import { CardRow } from './card';
import type { ReactElement } from 'react';

type Props = {
	heading: string;
	/** Three features, each an icon, a title and a description. */
	features: [ ReactElement, string, string ][];
	button: string;
	url: string;
	onClick?: () => void;
};

/**
 * A card row selling an upgrade: a heading, the features it adds in columns, and a button.
 *
 * @param props          - Component props.
 * @param props.heading  - The pitch.
 * @param props.features - What the upgrade adds.
 * @param props.button   - The button's label.
 * @param props.url      - Where the button goes.
 * @param props.onClick  - Called on click, before following `url`.
 * @return The row.
 */
export default function FeatureUpsell( { heading, features, button, url, onClick }: Props ) {
	return (
		<CardRow className="jp-protect-feature-upsell">
			<Stack direction="column" gap="md">
				<Text variant="body-md" className="jp-protect-feature-upsell__heading">
					{ heading }
				</Text>
				<Stack direction="row" gap="lg" align="center" justify="space-between">
					<div className="jp-protect-feature-upsell__features">
						{ features.map( ( [ icon, title, description ] ) => (
							<Stack key={ title } direction="row" gap="sm" align="start">
								<Icon icon={ icon } size={ 24 } className="jp-protect-feature-upsell__icon" />
								<Stack direction="column" gap="xs">
									<Text variant="body-md" className="jp-protect-feature-upsell__title">
										{ title }
									</Text>
									<Text variant="body-sm" className="jp-protect-card__muted">
										{ description }
									</Text>
								</Stack>
							</Stack>
						) ) }
					</div>
					<ButtonLink
						href={ url }
						size="compact"
						className="jp-protect-feature-upsell__button"
						onClick={ onClick }
					>
						{ button }
					</ButtonLink>
				</Stack>
			</Stack>
		</CardRow>
	);
}
