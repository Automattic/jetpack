import { Text } from '@automattic/jetpack-components';
import { dateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo } from 'react';
import AdminSectionHero from '../../components/admin-section-hero';
import ErrorAdminSectionHero from '../../components/error-admin-section-hero';
import useHistoryQuery from '../../data/scan/use-history-query';
import styles from './styles.module.scss';

const HistoryAdminSectionHero: React.FC = () => {
	const { data: history } = useHistoryQuery();
	const numThreats = history ? history.threats.length : 0;

	const oldestFirstDetected = useMemo( () => {
		if ( ! history ) {
			return null;
		}

		return history.threats.reduce( ( oldest, current ) => {
			return new Date( current.firstDetected ) < new Date( oldest.firstDetected )
				? current
				: oldest;
		} ).firstDetected;
	}, [ history ] );

	if ( history && history.error ) {
		return (
			<ErrorAdminSectionHero
				baseErrorMessage={ __( 'We are having problems loading your history.', 'jetpack-protect' ) }
				errorMessage={ history.errorMessage }
				errorCode={ history.errorMessage }
			/>
		);
	}

	return (
		<AdminSectionHero>
			<AdminSectionHero.Main>
				<Text mb={ 2 }>
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
				<AdminSectionHero.Heading icon={ numThreats > 0 ? 'error' : 'success' }>
					{ numThreats > 0
						? sprintf(
								/* translators: %s: Total number of threats  */
								__( '%1$s previously active %2$s', 'jetpack-protect' ),
								numThreats,
								numThreats === 1 ? 'threat' : 'threats'
						  )
						: __( 'No previously active threats', 'jetpack-protect' ) }
				</AdminSectionHero.Heading>
				<Text>{ __( 'Here you can view all of your threats to date.', 'jetpack-protect' ) }</Text>
			</AdminSectionHero.Main>
		</AdminSectionHero>
	);
};

export default HistoryAdminSectionHero;
