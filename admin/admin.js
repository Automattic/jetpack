(function () {
    // Elements
    var prs = document.getElementById('section-pr').querySelectorAll('.branch-card');
    var tags = document.getElementById( 'section-tags' ).querySelectorAll( '.tag-card' );
    var search_input_prs = document.getElementById('search-component-prs');
    var search_input_tags = document.getElementById('search-component-tags');
    var search_close_link_prs = document.getElementById('search-component-prs-close');
    var search_close_link_tags = document.getElementById('search-component-tags-close');
    var activate_links = document.querySelectorAll('.activate-branch');
    var toggle_links = document.querySelectorAll('.form-toggle__label');


    var pr_index = [];
    var tag_index = [];
    var each = Array.prototype.forEach;
    var clicked_activate = false;
    var clicked_toggle = false;

    // Build index of prs
    each.call( prs, function( element, index ) {
        hide( element );
        element.querySelector( '.activate-branch' ).setAttribute( 'data-index', index );
        pr_index[index] = {
            header: element.querySelector( '.branch-card-header' ).textContent,
            key: element.getAttribute( 'data-pr' ),
            element: element
        }
    } );

    // Build index of tags
    each.call( tags, function( element, index ) {
        hide( element );
        element.querySelector( '.activate-branch' ).setAttribute('data-index', index );
        tag_index[index] = {
            header: element.querySelector( '.tag-card-header' ).textContent,
            key: element.getAttribute( 'data-tag' ),
            element: element
        };
    } );

    search_input_listener( search_input_prs );
    search_input_listener( search_input_tags );
    function search_input_listener( input_area ) {
        input_area.addEventListener( 'keyup', function( event ) {
            var section_id = event.srcElement.id;
            var search_for = pr_to_header( input_area.value );
            var index = 'search-component-tags' === section_id ? tag_index : pr_index;

            if ( ! search_for ) {
                hide_section();
                return;
            }

            show( search_close_link_tags );
            index.forEach( show_found.bind( this, search_for, section_id ) );
        } );
    }

    function show_found( search_for, section, found ) {
        var element = found.element;
        var header_text = ( parseInt(search_for) > 0 ) ? found.key.toString() : found.header;
        var class_selector = 'search-component-tags' === section ? '.tag-card-header' : '.branch-card-header';

        var found_position = header_text.indexOf( search_for );
        if ( -1 === found_position ) {
            hide( element );
            return;
        }

        element.querySelector( class_selector ).innerHTML = highlight_word( search_for, header_text );
        show( element );
    }

    // Hiding the search close link
    hide_search_close_link( search_close_link_prs );
    hide_search_close_link( search_close_link_tags );
    function hide_search_close_link( section ) {
        hide( section );
        section.addEventListener( 'click', function( event ) {
            hide_section();
            hide( section );
            search_input.value = '';
            event.preventDefault();
        } );
    }

    // Activate Links
    each.call(activate_links, function (element, index) {
        element.addEventListener('click', activate_link_click.bind( this, element ) );
    });

    function activate_link_click( element, event ) {
        if ( clicked_activate ) {
           return;
        }
        if ( element.textContent == JetpackBeta.activate ) {
            element.parentNode.textContent = JetpackBeta.activating;
        } else {
            element.parentNode.textContent = JetpackBeta.updating;
        }

        var index = parseInt( element.getAttribute('data-index') );

        prs = Array.prototype.filter.call( prs, function( element, i ) {
            return (index === i ? false: true );
        } );
        disable_activete_branch_links();
        clicked_activate = true;
    }

    function disable_activete_branch_links() {
        each.call(activate_links, function (element, index) {
            element.addEventListener('click', function (event) {
                event.preventDefault();
            } );
            element.removeEventListener( 'click', activate_link_click.bind( this, element ) );
            element.classList.add('is-disabled');
        })
    }

    // Toggle Links
    each.call( toggle_links, function( element, index ) {
        element.addEventListener('click', toggle_link_click.bind( this, element ) );


    } );
    function toggle_link_click( element, event ) {
        if ( clicked_toggle ) {
            return;
        }
        clicked_toggle = true;
        element.classList.toggle('is-active');
    }

    // Helper functions
    function pr_to_header(search) {
        return search.replace("/", " / ").replace(new RegExp("\\-", "g"), " ").replace(/  +/g, ' ').toLowerCase();
    }

    function highlight_word(word, phrase) {
        var regExp = new RegExp(word, 'g');
        var replace = '<span class="highlight">' + word + '</span>';
        return phrase.replace(regExp, replace);
    }

    function hide_section() {
        each.call( prs, hide );
        each.call( tags, hide );
    }

    function hide( element ) {
        element.style.display = 'none';
    }

    function show( element ) {
        element.style.display = '';
    }
})();
