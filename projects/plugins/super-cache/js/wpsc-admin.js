jQuery( document ).ready( function () {

    const { __, _x, _n, _nx } = wp.i18n;
    bindActivateClick();

    /**
     * Landing page banner. 
     */
    jQuery( '.wpsc-boost-banner .close' ).on( 'click', function() {
            jQuery( '.wpsc-boost-banner' ).fadeOut( 'slow' );
            jQuery.post( ajaxurl, {
                action: 'wpsc-hide-boost-banner',
                nonce: window.wpscjs.nonce.banner,
            } );
    } );

    jQuery( '.wpsc-boost-banner .install-boost' ).on( 'click', function(el) {
        if(jQuery(this).hasClass('blocker')){
            return;
        };
        jQuery(this).addClass('blocker');
        jQuery('.learn-more').hide();
        jQuery(this).removeClass('install-boost');
        jQuery('span', this).html(__('Installing...','wp-super-cache'));
        jQuery(this).removeClass('button-install').addClass('button-installing');
        jQuery('.wpsc-boost-banner .loading').show();
        jQuery('.loader').show();

        var data = {
            action: 'wpsc_ajax_install_plugin',
            _ajax_nonce: window.wpscjs.nonce.updates, // nonce
            slug: 'jetpack-boost', // e.g. woocommerce
        };

        jQuery.post( ajaxurl, data, function(response) {
            if(response.success){
                //first handle a success
                jQuery('.loader').hide();
                jQuery('.icon .info').hide();
                jQuery('.button-installing span').html(__('Activating Jetpack Boost..','wp-super-cache'));
                jQuery('.button-installing').removeClass('button-installing').addClass('activate-boost').removeClass('install-boost');
                jQuery('.wpsc-boost-banner .loading').hide();
                jQuery('.lead').html(__('Jetpack Boost was sucessfully installed!','wp-super-cache'));
                jQuery('.info').html(__('Jetpack Boost is now being activated.','wp-super-cache'));
                jQuery('.learn-more').remove();
                jQuery('.wpsc-boost-banner').css('border-left', '5px solid #079E08');
                jQuery('.icon .check').show();
                // if the install was a success, proceed to activate
                ActivateBoost();
            }else{
                //then an error
                jQuery('.loader').hide();
                jQuery('.icon .info').hide();
                jQuery('span', this).html('<a href="'+response.data.activateUrl+'">Activate</a>');
                jQuery(this).removeClass('button-installing').addClass('activate-boost').removeClass('install-boost');
                jQuery('.wpsc-boost-banner .loading').hide();
                jQuery('.lead').html(__('There was an error when trying to install Jetpack Boost!','wp-super-cache'));
                jQuery('.info').html(response.data.errorMessage);
                jQuery('.learn-more').remove();
                jQuery('.wpsc-boost-banner').css('border-left', '5px solid #D63639');
                jQuery('.icon .alert').show();
                jQuery('.button-wrap').remove();
            }
        });

    } );

    function bindActivateClick(){
        //proceed to install boost. 
        jQuery( '.wpsc-boost-banner .activate-boost').on('click', function(){
            ActivateBoost();
        });
    }

    function bindSetupClick(){
        jQuery('.wpsc-boost-banner .set-up-boost').on( 'click', function(){
            link = jQuery("a", this).attr('href');
            window.location.href = link;
        });
    }

    function ActivateBoost(){
        if(jQuery(this).hasClass('blocker')){
                return;
            };
        jQuery(this).addClass('blocker');
        jQuery('.wpsc-boost-banner .activate-boost').addClass('button-installing');
        var data = {
            action: 'wpsc_ajax_activate_boost',
            _ajax_nonce: window.wpscjs.nonce.activate, // nonce
        };

        jQuery.post( ajaxurl, data, function(response) {
            if(response.success){
                //first handle a success
                jQuery('.loader').hide();
                jQuery('.icon .info').hide();
                jQuery('.activate-boost span').html('<a href="'+ response.data.setupURL +'">'+ __('Set up Jetpack Boost','wp-super-cache') + '</a>');
                jQuery('.activate-boost').removeClass('button-installing').removeClass('activate-boost').addClass('set-up-boost');
                jQuery('.wpsc-boost-banner .loading').hide();
                jQuery('.lead').html(__('Jetpack Boost was sucessfully activated!','wp-super-cache'));
                jQuery('.info').html(__('There are a few items to set up in order to improve your sites performance.','wp-super-cache'));
                jQuery('.learn-more').remove();
                jQuery('.wpsc-boost-banner').css('border-left', '5px solid #079E08');
                jQuery('.icon .check').show();
                bindSetupClick();
            }
        });
    }

    /**
     * Marks banner - slightly different to the above since a slightly different banner.
     * with more time would streamline this DRY.
     */
    jQuery( '.boost-banner .boost-dismiss' ).on( 'click', function() {
        jQuery( '.boost-banner' ).fadeOut( 'slow' );
        jQuery.post( ajaxurl, {
            action: 'wpsc-hide-boost-banner',
            nonce: window.wpscjs.nonce.banner,
        } );
    } );

    //install and activate Boost through AJAX :-) you're welcome, Mark.
    jQuery('.boost-banner .install-and-activate-boost').on('click', function(e){
        if(jQuery(this).hasClass('blocker')){
            return;
        }
        jQuery(this).addClass('blocker');
        e.preventDefault();
        button = jQuery(this);
        button.html(__('Installing...','wp-super-cache'));
        var data = {
            action: 'wpsc_ajax_install_plugin',
            _ajax_nonce: window.wpscjs.nonce.updates, // nonce
            slug: 'jetpack-boost', // e.g. woocommerce
        };

        jQuery.post( ajaxurl, data, function(response) {
            if(response.success){
                button.html(__('Activating...','wp-super-cache'));
                var data = {
                    action: 'wpsc_ajax_activate_boost',
                    _ajax_nonce: window.wpscjs.nonce.activate, // nonce
                };

                jQuery.post( ajaxurl, data, function(response) {
                    if(response.success){
                        button.removeClass('install-and-activate-boost');
                        button.html(__('Set up Jetpack Boost','wp-super-cache'));
                        button.attr("href", response.data.setupURL);
                    }
                });
            } 
        });
    });

    //activate boost
    jQuery('.boost-banner .activate-boost').on('click', function(e){
        e.preventDefault();
        button = jQuery(this);
        button.html(__('Activating...','wp-super-cache'));
        var data = {
                action: 'wpsc_ajax_activate_boost',
                _ajax_nonce: window.wpscjs.nonce.activate, // nonce
            };
        jQuery.post(ajaxurl, data, function(response) {
            if(response.success){
                button.removeClass('activate-boost');
                button.html(__('Set up Jetpack Boost','wp-super-cache'));
                button.attr("href", response.data.setupURL);
            }
        });
    });


    // This controls the slider on the main page. 
    jQuery( '.slider' ).on( 'click', function(el) {
        if(jQuery(this).hasClass('blocker')){
            //stop it being toggled loads before the setting has updated
            return;
        }
        jQuery(this).addClass('blocker');
        //get the status of the checkbox
        if(jQuery(this).hasClass('toggle-on')){
            //if we already have the class of checked we are turning it off
            jQuery(this).addClass('toggle-off');
            jQuery(this).removeClass('toggle-on');
            mode = 'off';
            wpsc_toggle_caching_mode( mode, jQuery(this) );
        }else{
            jQuery(this).addClass('toggle-on');
            jQuery(this).removeClass('toggle-off');
            mode = 'on';
            wpsc_toggle_caching_mode( mode, jQuery(this) );
        }
    });

    function wpsc_toggle_caching_mode( mode, elem ){
        var data = {
                action: 'wpsc_ajax_toggle_caching_easy',
                _ajax_nonce: window.wpscjs.nonce.toggle, // nonce
                cache: mode,
            };

        jQuery.post( ajaxurl, data, function(response) {
                if(response.success){
                    elem.removeClass('blocker');
                }else{
                    //show it to the console.
                    console.log(response);
                }
            });
    }

});