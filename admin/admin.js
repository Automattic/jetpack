/**
 * Created by enej on 14/02/2017.
 */
jQuery(document).ready(function ($) {

    var sections = $('#section-pr').find('.branch-card');

    var search_close_link = $('#search-component-close');
    var activate_links = $('.activate-branch');
    var search_input = $('#search-component');

    sections.hide();

    var section_index = []; //
    sections.each(function (index) {
        var element = $(this);
        section_index[ index ] = {
            header: element.find('.branch-card-header').text(),
            pr: element.data('pr'),
            element: element
        }
    });

    search_input.on("keyup", function (event) {
        var search_for = pr_to_header(this.value);

        if (!search_for) {
            search_close_link.hide();
            sections.hide();
            return;
        }

        search_close_link.show();
        section_index.forEach(function (branch) {
            var element = branch.element;
            var header_text = ( parseInt(search_for) > 0 ) ? branch.pr.toString() : branch.header;

            var found_position = header_text.indexOf(search_for);
            if (-1 === found_position) {
                element.hide();
                return;
            }

            element.find('.branch-card-header').html(hiliter(search_for, header_text));
            element.show();
        });

    });

    search_close_link.on('click', function (event) {
        sections.hide();
        search_close_link.hide();
        search_input.val('');
        event.preventDefault();
    }).hide();

    activate_links.on('click', function () {
        var link = $(this);
        link.parent().text(JetpackBeta.activating);
        link.closest('.branch-card').addClass( 'branch-card-active' );

        activate_links.bind('click', function (e) {
            e.preventDefault();
        }).addClass('is-disabled');
    });

    // Helper functions
    function pr_to_header(search) {
        return search.replace("/", " / ").replace(new RegExp("\\-", "g"), " ").replace(/  +/g, ' ').toLowerCase();
    }

    function hiliter(word, phrase) {
        var rgxp = new RegExp(word, 'g');
        var repl = '<span class="highlight">' + word + '</span>';
        return phrase.replace(rgxp, repl);
    }
});
