/**
 * WordPress dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { ANNUAL_DONATION, MONTHLY_DONATION, ONE_TIME_DONATION } from './common/constants';

const tabProperties = {
	[ ONE_TIME_DONATION ]: {
		title: __( 'One-Time', 'jetpack' ),
		interval: 'one-time',
	},
	[ MONTHLY_DONATION ]: {
		title: __( 'Monthly', 'jetpack' ),
		interval: '1 month',
	},
	[ ANNUAL_DONATION ]: {
		title: __( 'Yearly', 'jetpack' ),
		interval: '1 year',
	},
};

const mapAttributesToTabs = attributes =>
	Object.keys( tabProperties )
		.filter( currentTab => true === attributes[ currentTab ] )
		.map( ( currentTab, index ) => (
			<div
				role="button"
				tabIndex={ index }
				className="donations__nav-item"
				data-interval={ tabProperties[ currentTab ].interval }
			>
				{ tabProperties[ currentTab ].title }
			</div>
		) );

const Save = ( { attributes } ) => {
	const className = classnames( 'donations__content', {
		borderless: '0px' === attributes.style.border.width,
	} );

	const blockProps = useBlockProps.save();

	return (
		<div { ...blockProps }>
			<div className="donations__container">
				<div className="donations__nav">{ mapAttributesToTabs( attributes ) }</div>
				<div className={ className }>
					<InnerBlocks.Content />
				</div>
			</div>
		</div>
	);
};

export default Save;
