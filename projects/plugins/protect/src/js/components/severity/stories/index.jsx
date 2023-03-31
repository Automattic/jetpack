import React from 'react';
import ThreatSeverityBadge from '../index.jsx';

export default {
	title: 'Plugins/Protect/Threat Severity Badge',
	component: ThreatSeverityBadge,
};

export const Low = () => <ThreatSeverityBadge severity={ 1 } />;
export const High = () => <ThreatSeverityBadge severity={ 3 } />;
export const Critical = () => <ThreatSeverityBadge severity={ 5 } />;
