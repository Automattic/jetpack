;(function($, undefined) {
    gistStylesheetLoaded = false;

    var gistEmbed = function( data ) {
        $('.gist-oembed').each(function(i, el) {
            var url = 'https://gist.github.com/' + $(this).data('gist');
            $.ajax({
                url: url,
                dataType: 'jsonp'
            }).done(function( response ) {
                $(el).replaceWith( response.div );

                if ( ! gistStylesheetLoaded ) {
                    $('head').append(
                        "<link rel='stylesheet' href='" + response.stylesheet + "' type='text/css' />"
                    );

                    gistStylesheetLoaded = true;
                }
            });
        });
    };

    $(document).ready(gistEmbed);
    $('body').on('post-load', gistEmbed);
})(jQuery);
