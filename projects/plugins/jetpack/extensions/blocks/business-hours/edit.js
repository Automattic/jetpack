import { getBlockIconComponent } from '@automattic/jetpack-shared-extension-utils';
import apiFetch from '@wordpress/api-fetch';
import { useBlockProps } from '@wordpress/block-editor';
import { Placeholder } from '@wordpress/components';
import { getSettings } from '@wordpress/date';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import metadata from './block.json';
import DayEdit from './components/day-edit';
import DayPreview from './components/day-preview';

const icon = getBlockIconComponent( metadata );

export const defaultLocalization = {
	days: {
		Sun: __( 'Sunday', 'jetpack' ),
		Mon: __( 'Monday', 'jetpack' ),
		Tue: __( 'Tuesday', 'jetpack' ),
		Wed: __( 'Wednesday', 'jetpack' ),
		Thu: __( 'Thursday', 'jetpack' ),
		Fri: __( 'Friday', 'jetpack' ),
		Sat: __( 'Saturday', 'jetpack' ),
	},
	startOfWeek: 0,
};

const BusinessHours = props => {
	const { attributes, isSelected } = props;
	const blockProps = useBlockProps();
	const [ localization, setLocalization ] = useState( defaultLocalization );
	const [ hasFetched, setHasFetched ] = useState( false );

	const { days } = attributes;
	const { startOfWeek } = localization;
	const localizedWeek = days.concat( days.slice( 0, startOfWeek ) ).slice( startOfWeek );

	useEffect( () => {
		apiFetch( { path: '/wpcom/v2/business-hours/localized-week' } ).then(
			data => {
				setLocalization( data );
				setHasFetched( true );
			},
			() => {
				setLocalization( defaultLocalization );
				setHasFetched( true );
			}
		);
	}, [] );

	let content;

	if ( ! hasFetched ) {
		content = <Placeholder icon={ icon } label={ __( 'Loading business hours', 'jetpack' ) } />;
	} else if ( ! isSelected ) {
		const settings = getSettings();
		const {
			formats: { time },
		} = settings;

		content = (
			<dl className="jetpack-business-hours">
				{ localizedWeek.map( ( day, key ) => {
					return (
						<DayPreview key={ key } day={ day } localization={ localization } timeFormat={ time } />
					);
				} ) }
			</dl>
		);
	} else {
		content = (
			<div className="is-edit">
				{ localizedWeek.map( ( day, key ) => {
					return <DayEdit key={ key } day={ day } localization={ localization } { ...props } />;
				} ) }
			</div>
		);
	}

	return <div { ...blockProps }>{ content }</div>;
};

export default BusinessHours;
