import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import classnames from 'classnames';

const InboxResponse = () => {
	const classes = classnames( 'jp-forms__inbox-response', {
		'has-email': true,
	} );
	const titleClasses = classnames( 'jp-forms__inbox-response-title', {
		'is-email': false,
		'is-ip': false,
		'is-name': true,
	} );

	return (
		<div className={ classes }>
			<div className="jp-forms__inbox-response-avatar">
				<img
					src="https://gravatar.com/avatar/6e998f49bfee1a92cfe639eabb350bc5?size=68&default=identicon"
					alt={ __( 'Respondent’s gravatar', 'jetpack-forms' ) }
				/>
			</div>

			<h3 className={ titleClasses }>{ __( 'Bill Suitor', 'jetpack-forms' ) }</h3>
			<p className="jp-forms__inbox-response-subtitle">
				{ __( 'bill@la84.com', 'jetpack-forms' ) }
			</p>

			<div className="jp-forms__inbox-response-meta">
				<div className="jp-forms__inbox-response-meta-label">
					{ __( 'Date:', 'jetpack-forms' ) }
				</div>
				<div className="jp-forms__inbox-response-meta-value">
					{ sprintf(
						/* Translators: %1$s is the date, %2$s is the time. */
						__( '%1$s at %2$s', 'jetpack-forms' ),
						dateI18n( getDateSettings().formats.date, new Date().getTime() ),
						dateI18n( getDateSettings().formats.time, new Date().getTime() )
					) }
				</div>
				<div className="jp-forms__inbox-response-meta-label">
					{ __( 'Source:', 'jetpack-forms' ) }
				</div>
				<div className="jp-forms__inbox-response-meta-value">{ '/rsvp' }</div>
				<div className="jp-forms__inbox-response-meta-label">
					{ __( 'IP address:', 'jetpack-forms' ) }
				</div>
				<div className="jp-forms__inbox-response-meta-value">{ '168.1.0.254' }</div>
			</div>

			<div className="jp-forms__inbox-response-separator" />

			<div className="jp-forms__inbox-response-data">
				<div className="jp-forms__inbox-response-data-label">
					{ __( 'Name:', 'jetpack-forms' ) }
				</div>
				<div className="jp-forms__inbox-response-data-value">
					{ __( 'Bill Suitor', 'jetpack-forms' ) }
				</div>
				<div className="jp-forms__inbox-response-data-label">
					{ __( 'Email:', 'jetpack-forms' ) }
				</div>
				<div className="jp-forms__inbox-response-data-value">
					{ __( 'bill@la84.com', 'jetpack-forms' ) }
				</div>
			</div>
		</div>
	);
};

export default InboxResponse;
