import React from 'react';

export interface ActionItemProps extends React.ButtonHTMLAttributes< HTMLButtonElement > {
	icon: React.ReactNode;
	children: React.ReactNode;
	className?: string;
}
