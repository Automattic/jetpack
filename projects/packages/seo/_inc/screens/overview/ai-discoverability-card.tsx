/* eslint-disable react/jsx-no-bind */

import { __, sprintf, _n } from '@wordpress/i18n';
import { Link, Stack, Text } from '@wordpress/ui';
import { useNavigate } from 'react-router';
import { JetpackSeoRoutes, JetpackSeoSections } from '../../constants';
import CardSkeleton from './card-skeleton';
import OverviewCard from './overview-card';
import SeverityDot from './severity-dot';
import type { Severity } from './severity-dot';
import type { OverviewResponse } from '../../data/overview-types';
import type { FC, MouseEvent } from 'react';

interface Props {
	data?: OverviewResponse[ 'ai_discoverability' ];
}

interface Row {
	id: string;
	label: string;
	severity?: Severity;
}

const discoverabilityHref = `${ JetpackSeoRoutes.Settings }#${ JetpackSeoSections.Discoverability }`;

const AiDiscoverabilityCard: FC< Props > = ( { data } ) => {
	const navigate = useNavigate();

	if ( ! data ) {
		return <CardSkeleton title={ __( 'AI discoverability', 'jetpack-seo' ) } />;
	}

	const values = Object.values( data.crawlers );
	const blocked = values.filter( v => v === 'block' ).length;
	const total = values.length;

	const heading = data.llms_txt_enabled
		? __( 'Published', 'jetpack-seo' )
		: __( 'Off', 'jetpack-seo' );

	const description = data.llms_txt_enabled
		? __( 'AI assistants have a machine-readable map of your priority pages.', 'jetpack-seo' )
		: __( 'Without llms.txt, assistants have to guess which pages to read.', 'jetpack-seo' );

	const rows: Row[] = [
		{
			id: 'llms',
			label: data.llms_txt_enabled
				? __( 'llms.txt enabled', 'jetpack-seo' )
				: __( 'llms.txt disabled', 'jetpack-seo' ),
			severity: data.llms_txt_enabled ? 'healthy' : 'moderate',
		},
		{
			id: 'crawlers',
			label: sprintf(
				/* translators: 1: blocked count, 2: total known AI crawlers */
				_n(
					'%1$d of %2$d AI crawler blocked',
					'%1$d of %2$d AI crawlers blocked',
					total,
					'jetpack-seo'
				),
				blocked,
				total
			),
		},
	];

	const goToSettings = ( event: MouseEvent< HTMLAnchorElement > ) => {
		event.preventDefault();
		navigate( discoverabilityHref );
	};

	return (
		<OverviewCard
			title={ __( 'AI discoverability', 'jetpack-seo' ) }
			heading={ heading }
			description={ description }
			body={
				<Stack direction="column" gap="sm">
					{ rows.map( row => (
						<Stack key={ row.id } direction="row" gap="md" align="flex-start">
							<span
								// Match the body-md line-box so the dot sits
								// mid-line with the label. Rows without a
								// severity keep the 8px placeholder width so
								// the labels stay vertically aligned.
								style={ {
									display: 'inline-flex',
									alignItems: 'center',
									height: 'var(--wpds-typography-line-height-sm, 20px)',
									width: 10,
								} }
								aria-hidden="true"
							>
								{ row.severity && <SeverityDot severity={ row.severity } /> }
							</span>
							<Text variant="body-md">{ row.label }</Text>
						</Stack>
					) ) }
				</Stack>
			}
			footer={
				<Stack direction="row" justify="flex-end">
					<Link href={ discoverabilityHref } onClick={ goToSettings }>
						{ __( 'Manage AI discoverability', 'jetpack-seo' ) }
					</Link>
				</Stack>
			}
		/>
	);
};

export default AiDiscoverabilityCard;
