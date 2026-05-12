import { Text } from '@automattic/jetpack-components';
import { dateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { Text as UIText } from '@wordpress/ui';
import { useMemo } from 'react';
import { useParams } from 'react-router';
import AdminSectionHero from '../../../components/admin-section-hero';
import ErrorAdminSectionHero from '../../../components/error-admin-section-hero';
import ScanNavigation from '../../../components/scan-navigation';
import useThreatsList from '../../../components/threats-list/use-threats-list';
import useProtectData from '../../../hooks/use-protect-data';
import styles from './styles.module.scss';
import type { FC } from 'react';

const HistoryAdminSectionHero: FC = () => {
	const { filter = 'all' } = useParams();
	const { list } = useThreatsList( {
		source: 'history',
		status: filter,
	} );
	const { counts, error } = useProtectData( {
		sourceType: 'history',
		filter: { status: filter, key: null },
	} );
	const { threats: numAllThreats } = counts.all;

	const oldestFirstDetected = useMemo( () => {
		if ( ! list.length ) {
			return null;
		}

		return list.reduce( ( oldest, current ) => {
			return new Date( current.firstDetected ) < new Date( oldest.firstDetected )
				? current
				: oldest;
		} ).firstDetected;
	}, [ list ] );

	if ( error ) {
		return (
			<ErrorAdminSectionHero
				baseErrorMessage={ __( 'We are having problems loading your history.', 'jetpack-protect' ) }
				errorMessage={ error?.message }
				errorCode={ error?.code }
			/>
		);
	}

	return (
		<AdminSectionHero
			main={
				<>
					<UIText
						variant="body-sm"
						style={ {
							alignItems: 'center',
							color: 'var(--jp-green-50)',
							display: 'inline-flex',
							fontWeight: 600,
							lineHeight: 1.666,
							whiteSpace: 'nowrap',
						} }
					>
						<span
							style={ {
								backgroundColor: 'var(--jp-green-50)',
								borderRadius: '50%',
								flexShrink: 0,
								height: '0.666em',
								marginRight: '4px',
								width: '0.666em',
							} }
						/>
						<span>{ __( 'Active', 'jetpack-protect' ) }</span>
					</UIText>
					<AdminSectionHero.Heading showIcon>
						{ numAllThreats > 0
							? sprintf(
									/* translators: %1$s: Total number of threats, %2$s: singular or plural form of "threat" */
									__( '%1$s previously active %2$s', 'jetpack-protect' ),
									numAllThreats.toString(),
									numAllThreats === 1 ? 'threat' : 'threats'
							  )
							: __( 'No previously active threats', 'jetpack-protect' ) }
					</AdminSectionHero.Heading>
					<AdminSectionHero.Subheading>
						<Text>
							{ oldestFirstDetected ? (
								<span className={ styles[ 'subheading-content' ] }>
									{ sprintf(
										/* translators: %s: Oldest first detected date */
										__( '%s - Today', 'jetpack-protect' ),
										dateI18n( 'F jS g:i A', oldestFirstDetected, false )
									) }
								</span>
							) : (
								__( 'Most recent results', 'jetpack-protect' )
							) }
						</Text>
					</AdminSectionHero.Subheading>
					<div className={ styles[ 'scan-navigation' ] }>
						<ScanNavigation />
					</div>
				</>
			}
		/>
	);
};

export default HistoryAdminSectionHero;
