import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';
import { ButtonLink, Stack, Text } from '@wordpress/ui';
import { recordEvent, recordViewOnce } from '../data/tracks';
import { CardRow } from './card';
import type { ReactElement } from 'react';

type Props = {
	heading: string;
	/** Three features, each an icon, a title and a description. */
	features: [ ReactElement, string, string ][];
	url: string;
	/** Tracks event prefix; `_view` and `_click` are recorded with `eventProps`. */
	event: string;
	eventProps?: Record< string, string | number >;
};

/**
 * A card row selling an upgrade: a heading, the features it adds in columns, and a button.
 *
 * @param props            - Component props.
 * @param props.heading    - The pitch.
 * @param props.features   - What the upgrade adds.
 * @param props.url        - Where the button goes.
 * @param props.event      - Tracks event prefix.
 * @param props.eventProps - Tracks event properties.
 * @return The row.
 */
export default function FeatureUpsell( { heading, features, url, event, eventProps = {} }: Props ) {
	// No dependencies: recordViewOnce drops repeats, and eventProps is a new object each render.
	useEffect( () => recordViewOnce( `${ event }_view`, eventProps ) );

	return (
		<CardRow className="jp-protect-feature-upsell">
			<Stack direction="column" gap="md">
				<Text variant="body-md" className="jp-protect-feature-upsell__heading">
					{ heading }
				</Text>
				<div className="jp-protect-feature-upsell__body">
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
						// eslint-disable-next-line react/jsx-no-bind -- ButtonLink isn't memoized, so a stable handler buys nothing.
						onClick={ () => recordEvent( `${ event }_click`, eventProps ) }
					>
						{ __( 'Upgrade', 'jetpack-protect-pkg' ) }
					</ButtonLink>
				</div>
			</Stack>
		</CardRow>
	);
}
