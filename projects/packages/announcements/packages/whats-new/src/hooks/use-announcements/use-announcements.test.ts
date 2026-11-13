/**
 * External dependencies
 */
import { act, renderHook } from '@testing-library/react';
import { useEntityRecords } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { useAnnouncements } from './use-announcements';
import type { Announcement } from '../../types';

jest.mock( '@wordpress/core-data', () => ( {
	store: 'core',
	useEntityRecords: jest.fn(),
} ) );
jest.mock( '@wordpress/data', () => ( {
	useDispatch: jest.fn(),
} ) );

const CHANNELS = [ 'my-plugin' ];

const unseen: Announcement = {
	id: 'my-plugin/newest',
	date: '2026-11-20T00:00:00+00:00',
	title: 'Newest',
	excerpt: '',
	content: '',
	media: null,
	link: '',
	channels: CHANNELS,
	seen: false,
};

describe( 'useAnnouncements', () => {
	it( 'stops teasing an announcement as soon as it is marked, and saves it as seen', () => {
		const saveEntityRecord = jest.fn();
		jest.mocked( useDispatch ).mockReturnValue( { saveEntityRecord } );
		// The record stays unseen, as it does while the write is pending or when it fails.
		jest.mocked( useEntityRecords ).mockReturnValue( { records: [ unseen ] } as never );

		const { result } = renderHook( () => useAnnouncements( CHANNELS ) );
		expect( result.current.teaser ).toBe( unseen );

		act( () => result.current.markSeen( unseen.id ) );

		expect( result.current.teaser ).toBeNull();
		expect( result.current.announcements ).toEqual( [ unseen ] );
		expect( saveEntityRecord ).toHaveBeenCalledWith( 'jetpack', 'announcement', {
			id: unseen.id,
			seen: true,
		} );
	} );
} );
