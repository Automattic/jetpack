import React from 'react';

const PrimarySummaryComponent = () => {
	return (
		<div className="jp-recommendations-feature-summary">
			<span className="jp-recommendations-feature-summary__display-name">Real-time Backups</span>
			<div className="jp-recommendations-feature-summary__actions">
				<div className="jp-recommendations-feature-summary__cta">
					<a href="#">Manage</a>
				</div>
			</div>
		</div>
	);
};

const PrimarySummary = PrimarySummaryComponent;

export { PrimarySummary };
