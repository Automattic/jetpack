/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import { isDevVersion as _isDevVersion } from 'state/initial-state';
import { switchMichaelsPlan } from 'state/dev-version';
import { getSitePlan } from 'state/site';

export const DevCard = React.createClass( {
    displayName: 'DevCard',

    onChange( event ) {
        this.props.switchMichaelsPlan( event.target.value );
    },

    render() {
        const classes = classNames(
            this.props.className,
            'jp-dev-card'
        );

        return (
            <div className={ classes }>
                Switch plan view (Dev versions only): <br/>
                <input
                    type='radio'
                    id='jetpack_free'
                    value='jetpack_free'
                    name='jetpack_free'
                    checked={ 'jetpack_free' === this.props.sitePlan.product_slug }
                    onChange={ this.onChange }
                /> Free
                <input
                    type='radio'
                    id='jetpack_personal'
                    value='jetpack_personal'
                    name='jetpack_personal'
                    checked={ /jetpack_personal*/.test( this.props.sitePlan.product_slug ) }
                    onChange={ this.onChange }
                /> Personal
                <input
                    type='radio'
                    id='jetpack_premium'
                    value='jetpack_premium'
                    name='jetpack_premium'
                    checked={ /jetpack_premium*/.test( this.props.sitePlan.product_slug ) }
                    onChange={ this.onChange }
                /> Premium
                <input
                    type='radio'
                    id='jetpack_business'
                    value='jetpack_business'
                    name='jetpack_business'
                    checked={ /jetpack_business*/.test( this.props.sitePlan.product_slug ) }
                    onChange={ this.onChange }
                /> Professional
            </div>
        );
    }
} );

export default connect(
    state => {
        return {
            isDevVersion: _isDevVersion( state ),
            sitePlan: getSitePlan( state )
        }
    },
    ( dispatch ) => {
        return {
            switchMichaelsPlan: ( slug ) => {
                return dispatch( switchMichaelsPlan( slug ) );
            }
        };
    }
)( DevCard );
