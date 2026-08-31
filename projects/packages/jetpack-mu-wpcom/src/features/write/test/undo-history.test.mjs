import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createUndoHistory } from '../undo-history.js';

describe( 'createUndoHistory', () => {
	it( 'starts empty — canUndo and canRedo are false', () => {
		const h = createUndoHistory();
		assert.equal( h.canUndo, false );
		assert.equal( h.canRedo, false );
		assert.equal( h.current, null );
	} );

	it( 'after one push — canUndo is false, canRedo is false', () => {
		const h = createUndoHistory();
		h.push( { html: '<p>hello</p>', title: '' } );
		assert.equal( h.canUndo, false );
		assert.equal( h.canRedo, false );
	} );

	it( 'current returns the most recently pushed snapshot', () => {
		const h = createUndoHistory();
		const snap = { html: '<p>hello</p>', title: 'My Post' };
		h.push( snap );
		assert.deepEqual( h.current, snap );
	} );

	it( 'after two pushes — canUndo is true, canRedo is false', () => {
		const h = createUndoHistory();
		h.push( { html: '<p>a</p>', title: '' } );
		h.push( { html: '<p>b</p>', title: '' } );
		assert.equal( h.canUndo, true );
		assert.equal( h.canRedo, false );
	} );

	it( 'undo returns the previous snapshot', () => {
		const h = createUndoHistory();
		const first = { html: '<p>a</p>', title: '' };
		h.push( first );
		h.push( { html: '<p>b</p>', title: '' } );
		const result = h.undo();
		assert.deepEqual( result, first );
		assert.deepEqual( h.current, first );
	} );

	it( 'undo at the bottom of the stack has no effect and returns current', () => {
		const h = createUndoHistory();
		const only = { html: '<p>a</p>', title: '' };
		h.push( only );
		const result = h.undo();
		assert.deepEqual( result, only );
		assert.deepEqual( h.current, only );
	} );

	it( 'after undo — canRedo is true', () => {
		const h = createUndoHistory();
		h.push( { html: '<p>a</p>', title: '' } );
		h.push( { html: '<p>b</p>', title: '' } );
		h.undo();
		assert.equal( h.canRedo, true );
	} );

	it( 'redo returns the next snapshot after an undo', () => {
		const h = createUndoHistory();
		h.push( { html: '<p>a</p>', title: '' } );
		const second = { html: '<p>b</p>', title: '' };
		h.push( second );
		h.undo();
		const result = h.redo();
		assert.deepEqual( result, second );
		assert.deepEqual( h.current, second );
	} );

	it( 'redo at the top of the stack has no effect and returns current', () => {
		const h = createUndoHistory();
		h.push( { html: '<p>a</p>', title: '' } );
		const second = { html: '<p>b</p>', title: '' };
		h.push( second );
		const result = h.redo();
		assert.deepEqual( result, second );
	} );

	it( 'pushing after undo discards redo history', () => {
		const h = createUndoHistory();
		h.push( { html: '<p>a</p>', title: '' } );
		h.push( { html: '<p>b</p>', title: '' } );
		h.undo();
		const branch = { html: '<p>c</p>', title: '' };
		h.push( branch );
		assert.equal( h.canRedo, false );
		assert.deepEqual( h.current, branch );
	} );

	it( 'does not exceed maxSize entries', () => {
		const h = createUndoHistory( { maxSize: 3 } );
		h.push( { html: '<p>1</p>', title: '' } );
		h.push( { html: '<p>2</p>', title: '' } );
		h.push( { html: '<p>3</p>', title: '' } );
		h.push( { html: '<p>4</p>', title: '' } );
		// Oldest entry is evicted; undo twice should land on <p>2</p>
		h.undo();
		h.undo();
		assert.equal( h.current.html, '<p>2</p>' );
		assert.equal( h.canUndo, false );
	} );

	it( 'supports opaque cursor data attached to each snapshot', () => {
		const h = createUndoHistory();
		const cursor = { path: [ 0, 1 ], offset: 5 };
		h.push( { html: '<p>hello</p>', title: '', cursor } );
		assert.deepEqual( h.current.cursor, cursor );
	} );
} );
