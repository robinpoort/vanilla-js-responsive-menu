/**
 *
 * Responsive menu v1.0.0
 * A vanilla JS responsive menu plugin, by Robin Poort - Timble
 * http://robinpoort.com - http://www.timble.net
 *
 * Browser support: IE9+ (IE8 doesn't need a responsive menu since it's not responsive)
 *
 * Dependency: apollo JS | https://github.com/toddmotto/apollo
 * Plugin boilerplate by | http://gomakethings.com/mit/
 *
 * Free to use under the MIT License.
 *
 */

(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define('responsivemenu', factory(root));
    } else if ( typeof exports === 'object' ) {
        module.responsivemenu = factory(root);
    } else {
        root.responsivemenu = factory(root);
    }
})(this, function (root) {

    'use strict';

    // Variables
    var exports = {}; // Object for public APIs
    var supports = !!document.querySelector && !!root.addEventListener; // Feature test
    var settings; // Plugin settings
    var menu; // The actual menu item
    var hasChildren = false;
    var subtoggles = false;

    // Default settings
    var defaults = {
        menu: '',
        initiated_class: 'rm-initiated',
        before_element: '',
        toggletype: 'button',
        toggleclass: 'rm-togglebutton',
        toggleclosedclass: 'rm-togglebutton--closed',
        togglecontent: 'menu',
        subtoggletype: 'button',
        subtoggleclass: 'rm-subtoggle',
        subtogglecontent: '+',
        sticky: 0,
        absolute: 0,
        hideclass: 'rm-closed',
        openclass: 'rm-opened',
        focusedclass: 'rm-focused',
        animateopenclass: 'is-opening',
        animatecloseclass: 'is-closing',
        animateduration: 0, // (Animated with CSS so set to same duration as CSS value)
        width: 600,
        parentclass: 'rm-parent',
        fullmenuclass: 'rm-fullmenu',
        absolutemenuclass: 'rm-absolutemenu',
        bodyoverflowhiddenclass: 'rm-bodyoverflowhidden',
        menuoverflowautoclass: 'rm-menuoverflowauto',
        stickyclass: 'rm-sticky',
        stickyinitiatedclass: 'rm-sticky-initiated',
        noresponsivemenuclass: 'rm-no-responsive-menu'
    };

    // Methods
    /**
     * A simple forEach() implementation for Arrays, Objects and NodeLists
     * @private
     * @param {Array|Object|NodeList} collection Collection of items to iterate
     * @param {Function} callback Callback function for each iteration
     * @param {Array|Object|NodeList} scope Object/NodeList/Array that forEach is iterating over (aka `this`)
     */
    var forEach = function (collection, callback, scope) {
        if (Object.prototype.toString.call(collection) === '[object Object]') {
            for (var prop in collection) {
                if (Object.prototype.hasOwnProperty.call(collection, prop)) {
                    callback.call(scope, collection[prop], prop, collection);
                }
            }
        } else {
            for (var i = 0, len = collection.length; i < len; i++) {
                callback.call(scope, collection[i], i, collection);
            }
        }
    };

    /**
     * Merge defaults with user options
     * @private
     * @param {Object} defaults Default settings
     * @param {Object} options User options
     * @returns {Object} Merged values of defaults and options
     */
    var extend = function ( defaults, options ) {
        var extended = {};
        forEach(defaults, function (value, prop) {
            extended[prop] = defaults[prop];
        });
        forEach(options, function (value, prop) {
            extended[prop] = options[prop];
        });
        return extended;
    };

    /**
     * Remove whitespace from a string
     * @private
     * @param {String} string
     * @returns {String}
     */
    var trim = function ( string ) {
        return string.replace(/^\s+|\s+$/g, '');
    };

    /**
     * Convert data-options attribute into an object of key/value pairs
     * @private
     * @param {String} options Link-specific options as a data attribute string
     * @returns {Object}
     */
    var getDataOptions = function ( options ) {
        var settings = {};
        // Create a key/value pair for each setting
        if ( options ) {
            options = options.split(';');
            options.forEach( function(option) {
                option = trim(option);
                if ( option !== '' ) {
                    option = option.split(':');
                    settings[option[0]] = trim(option[1]);
                }
            });
        }
        return settings;
    };

    function getParents(element, tag, stop) {
        var nodes = [];
        while (element.parentNode && element.parentNode != stop) {
            element = element.parentNode;
            if (element.tagName == tag) {
                nodes.push(element);
            }
        }
        return nodes
    }

    // Responsive menu
    function initialize(settings) {

        // Define what the actual menu object is
        if ( settings.menu == '' ) {
            menu = settings.wrapper.getElementsByTagName('ul')[0];
        } else {
            menu = settings.menu;
        }

        // Add a class when JS is initiated
        apollo.addClass(settings.wrapper, settings.initiated_class);

        // See if menu has children
        var parents = menu.querySelectorAll('li ul');
        if ( parents.length ) {
            hasChildren = true;
            subtoggles = document.getElementsByClassName(settings.subtoggleclass);
        }

        // Creating the main toggle button
        var toggle_element = document.createElement(settings.toggletype);
        apollo.addClass(toggle_element, [settings.toggleclass]);
        if ( settings.before_element == '' ) { settings.before_element = settings.wrapper.firstChild }
        settings.before_element.parentNode.insertBefore(toggle_element, settings.before_element);
        var togglebutton = document.getElementsByClassName(settings.toggleclass)[0];
        togglebutton.innerHTML = settings.togglecontent;
        togglebutton.setAttribute('aria-hidden', 'true');
        togglebutton.setAttribute('aria-pressed', 'false');
        togglebutton.setAttribute('type', 'button');

        // Subtoggles and parent classes
        if ( hasChildren ) {
            for (var i = 0; i < parents.length; i++) {
                var subtoggle_element = document.createElement(settings.subtoggletype);
                apollo.addClass(subtoggle_element, [settings.subtoggleclass, settings.hideclass]);
                var parent = parents[i].parentNode;
                parent.insertBefore(subtoggle_element, parent.firstChild);
                subtoggle_element.innerHTML = settings.subtogglecontent;
                subtoggle_element.setAttribute('aria-hidden', 'true');
                subtoggle_element.setAttribute('aria-pressed', 'false');
                subtoggle_element.setAttribute('type', 'button');
                apollo.addClass(parents[i].parentNode, settings.parentclass);
            }
        }

        // Adding classes
        function classes() {

            // Check current wrapper width
            var windowwidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

            // If wrapper is small and if the menu is not already opened
            if ( windowwidth < settings.width && !apollo.hasClass(menu, settings.openclass) ) {

                // Show the toggle button(s)
                apollo.removeClass(togglebutton, settings.hideclass);
                if ( hasChildren ) {
                    forEach(subtoggles, function (value, prop) {
                        apollo.addClass(subtoggles[prop].parentNode.getElementsByTagName('ul')[0], settings.hideclass);
                        apollo.removeClass(subtoggles[prop], settings.hideclass);
                    });
                }

                // Hide the menu
                apollo.removeClass(menu, [settings.openclass, settings.fullmenuclass]);
                apollo.addClass(menu, settings.hideclass);

                // Make the menu absolute positioned
                if ( settings.absolute == 1 ) {
                    apollo.addClass(menu, settings.absolutemenuclass);
                }

            } else if ( windowwidth >= settings.width ) {

                // Hide the toggle button(s)
                apollo.addClass(togglebutton, settings.hideclass);
                apollo.removeClass(togglebutton, settings.toggleclosedclass);
                if (hasChildren) {
                    forEach(subtoggles, function(value, prop) {
                        apollo.removeClass(subtoggles[prop].parentNode.getElementsByTagName('ul')[0], settings.hideclass);
                        apollo.addClass(subtoggles[prop], settings.hideclass);
                    });
                }

                // Show the menu and remove all classes
                apollo.removeClass(menu, [settings.openclass, settings.hideclass]);
                apollo.addClass(menu, settings.fullmenuclass);

                // Undo absolute positioning
                if ( settings.absolute == 1 && apollo.hasClass(menu, settings.absolutemenuclass) ) {
                    apollo.removeClass(menu, settings.absolutemenuclass);
                }
            }
        }

        // Sticky menu body height
        function stickyMenu() {

            if ( settings.sticky == 1 ) {

                // The current menu and viewport heights
                var menuheight = settings.wrapper.offsetHeight;
                var viewportheight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

                // Add the overflow class but only if there is space
                if ( viewportheight <= menuheight && !apollo.hasClass(document.body, settings.bodyoverflowhiddenclass) ) {

                    apollo.addClass(document.body, settings.bodyoverflowhiddenclass);
                    apollo.addClass(settings.wrapper, settings.menuoverflowautoclass);

                } else if ( viewportheight > menuheight ) {

                    if ( apollo.hasClass(document.body, settings.bodyoverflowhiddenclass) ) {
                        apollo.removeClass(document.body, settings.bodyoverflowhiddenclass);
                        apollo.removeClass(settings.wrapper, settings.menuoverflowautoclass);
                    }

                    // Make sticky
                    if ( !apollo.hasClass(settings.wrapper, settings.stickyclass) ) {
                        apollo.addClass(settings.wrapper, settings.stickyclass);
                    }

                    // Add padding only if menu is closed or when value is stored
                    if ( !apollo.hasClass(menu, settings.openclass) && !apollo.hasClass(document.body, settings.stickyinitiatedclass) ) {

                        // Calculate the height
                        var paddingtop = menuheight.toString() + 'px';

                        // Set the padding on the body
                        document.body.setAttribute('style', 'padding-top:' + paddingtop);
                        apollo.addClass(document.body, settings.stickyinitiatedclass);
                    }
                }
            }
        }

        // Initial load
        classes();
        stickyMenu();

        window.addEventListener('resize', function() {
            classes();
            stickyMenu();
        }, true);

        // Accessible focus menu
        var menulinks = menu.getElementsByTagName('a');
        for (var i = 0; i < menulinks.length; i++) {


            menulinks[i].onfocus = function() {
                apollo.addClass(settings.wrapper, 'rm-focused-menu');
            };

            menulinks[i].onblur = function() {
                apollo.removeClass(settings.wrapper, 'rm-focused-menu');
            };


            //menulinks[0].getElementsByTagName('a')[0].onblur = function() {
            //
            //
            //
            //    var siblings = this.parentNode.querySelectorAll('li');
            //    if (siblings.length) {
            //        for (var f = 0; f < siblings.length; f++) {
            //            apollo.removeClass(settings.wrapper, 'rm-focused-menu');
            //        }
            //    }
            //
            //
            //    //var focusedItems = document.getElementsByClassName('rm-focused');
            //    //for (var f = 0; f < focusedItems.length; f++) {
            //    //    apollo.removeClass(focusedItems[f], settings.focusedclass);
            //    //}
            //};
            //menulinks[i].getElementsByTagName('a')[0].onfocus = function() {
            //
            //    console.log(document.activeElement);
            //
            //    if ( !apollo.hasClass(settings.wrapper, 'rm-focused-menu') ) {
            //        apollo.addClass(settings.wrapper, 'rm-focused-menu');
            //    }
            //
            //    //// Remove the class
            //    //var siblings = this.parentNode.parentNode.querySelectorAll('li');
            //    //if (siblings.length) {
            //    //    for (var f = 0; f < siblings.length; f++) {
            //    //        apollo.removeClass(siblings[f], settings.focusedclass);
            //    //    }
            //    //}
            //    //// Add the class
            //    //var parent = getParents(this, "LI", menu);
            //    //if (parent.length) {
            //    //    for (var f = 0; f < parent.length; f++) {
            //    //        apollo.addClass(parent[f], settings.focusedclass);
            //    //    }
            //    //}
            //};
        }

        // Clicking the toggle button
        togglebutton.onclick = function() {

            // Show the menu
            if ( apollo.hasClass(menu, settings.hideclass) ) {

                // Show menu immediately so it can be animated
                apollo.removeClass(menu, settings.hideclass);
                apollo.addClass(menu, settings.openclass);

                // Set and remove animate class after duration
                apollo.addClass(menu, settings.animateopenclass);
                setTimeout(function() { apollo.removeClass(menu, settings.animateopenclass); }, settings.animateduration);

                // Set toggled class to toggle button
                apollo.addClass(togglebutton, settings.toggleclosedclass);
            }

            // Hide the menu
            else if ( apollo.hasClass(menu, settings.openclass) ) {

                // Properly set animating classes
                apollo.addClass(menu, settings.animatecloseclass);
                setTimeout(function() { apollo.removeClass(menu, settings.animatecloseclass); }, settings.animateduration);

                // Hide menu after animation is done (Animated with CSS so set to same duration as CSS value)
                setTimeout(function() { apollo.removeClass(menu, settings.openclass); }, settings.animateduration);
                setTimeout(function() { apollo.addClass(menu, settings.hideclass); }, settings.animateduration);

                // Remove toggled class to toggle button
                apollo.removeClass(togglebutton, settings.toggleclosedclass);
            }

            // Check if the menu still fits
            stickyMenu();

            return false;
        };

        // Clicking the sub toggles button
        if ( hasChildren ) {
            forEach(subtoggles, function(value, prop) {

                // Variables
                var subtoggle = subtoggles[prop];
                var submenu = subtoggle.parentNode.getElementsByTagName('ul')[0];

                // Click buttons and show submenu
                subtoggle.onclick = function() {

                    // Add classes accordingly
                    if ( apollo.hasClass(submenu, settings.hideclass) ) {
                        apollo.removeClass(submenu, settings.hideclass);
                        apollo.addClass(subtoggle, settings.toggleclosedclass);
                    } else if ( !apollo.hasClass(submenu, settings.hideclass) ) {
                        apollo.addClass(submenu, settings.hideclass);
                        apollo.removeClass(subtoggle, settings.toggleclosedclass);
                    }

                    // Check if the menu still fits
                    stickyMenu();
                }
            });
        }







        document.onkeydown = checkKey;

        function checkKey(e) {

            if ( apollo.hasClass(settings.wrapper, 'rm-focused-menu') ) {
                e = e || window.event;

                // Up arrow
                if (e.keyCode == '38') {
                    if (document.activeElement.parentNode.parentNode.previousElementSibling.getAttribute('aria-haspopup')) {
                        e.preventDefault();

                        if (document.activeElement.parentNode.previousElementSibling) {
                            document.activeElement.parentNode.previousElementSibling.getElementsByTagName('a')[0].focus();
                        } else {
                            var elements = document.activeElement.parentNode.parentNode.getElementsByTagName('li');
                            var last_element = elements[elements.length - 1];
                            last_element.getElementsByTagName('a')[0].focus();
                        }
                    }
                }

                // down arrow
                else if (e.keyCode == '40') {
                    if (document.activeElement.getAttribute('aria-haspopup')) {
                        e.preventDefault();
                        apollo.addClass(document.activeElement.parentNode, 'rm-focused');
                        document.activeElement.parentNode.getElementsByTagName('li')[0].getElementsByTagName('a')[0].focus();
                    }
                    else if (document.activeElement.parentNode.parentNode.previousElementSibling.getAttribute('aria-haspopup')) {
                        e.preventDefault();

                        if (document.activeElement.parentNode.nextElementSibling) {
                            document.activeElement.parentNode.nextElementSibling.getElementsByTagName('a')[0].focus();
                        } else {
                            document.activeElement.parentNode.parentNode.getElementsByTagName('a')[0].focus();
                        }
                    }
                }

                // left arrow
                else if (e.keyCode == '37') {
                    e.preventDefault();
                    if (document.activeElement.parentNode.parentNode.getAttribute('role') == 'menubar') {
                        apollo.removeClass(document.activeElement.parentNode, 'rm-focused');
                        document.activeElement.parentNode.previousElementSibling.getElementsByTagName('a')[0].focus();
                    } else {
                        var prevEl = settings.wrapper.getElementsByClassName('rm-focused')[0].previousElementSibling;
                        apollo.removeClass(settings.wrapper.getElementsByClassName('rm-focused')[0],'rm-focused');
                        apollo.addClass(prevEl, 'rm-focused');
                        settings.wrapper.getElementsByClassName('rm-focused')[0].getElementsByTagName('a')[0].focus();
                    }
                }

                // right arrow
                else if (e.keyCode == '39') {
                    e.preventDefault();

                    // First level items
                    if (document.activeElement.parentNode.parentNode.getAttribute('role') == 'menubar') {
                        apollo.removeClass(document.activeElement.parentNode, 'rm-focused');
                        document.activeElement.parentNode.nextElementSibling.getElementsByTagName('a')[0].focus();
                    }
                    // Other levels
                    else {
                        var nextEl = settings.wrapper.getElementsByClassName('rm-focused')[0].nextElementSibling;
                        apollo.removeClass(settings.wrapper.getElementsByClassName('rm-focused')[0],'rm-focused');
                        apollo.addClass(nextEl, 'rm-focused');
                        settings.wrapper.getElementsByClassName('rm-focused')[0].getElementsByTagName('a')[0].focus();
                    }
                }

                // Esc
                else if (e.keyCode == '27') {
                    if (document.activeElement.parentNode.parentNode.previousElementSibling.getAttribute('role') == 'menuitem') {
                        e.preventDefault();
                        apollo.removeClass(document.activeElement.parentNode.parentNode.parentNode, 'rm-focused');
                        document.activeElement.parentNode.parentNode.parentNode.getElementsByTagName('a')[0].focus();
                    }
                    if (document.activeElement.getAttribute('aria-haspopup') && apollo.hasClass(document.activeElement.parentNode, 'rm-focused')) {
                        apollo.removeClass(document.activeElement.parentNode, 'rm-focused');
                    }
                }

                // Space
                else if (e.keyCode == '32') {
                    e.preventDefault();
                    if (document.activeElement.getAttribute('aria-haspopup') && !apollo.hasClass(document.activeElement.parentNode, 'rm-focused')) {
                        apollo.addClass(document.activeElement.parentNode, 'rm-focused');
                    } else {
                        apollo.removeClass(document.activeElement.parentNode, 'rm-focused');
                    }
                }

                // Enter
                else if (e.keyCode == '13') {
                    if (document.activeElement.getAttribute('aria-haspopup') && !apollo.hasClass(document.activeElement.parentNode, 'rm-focused')) {
                        e.preventDefault();
                        apollo.addClass(document.activeElement.parentNode, 'rm-focused');
                    }
                }
            }
        }


    }

    /**
     * Initialize Plugin
     * @public
     * @param {Object} options User settings
     */
    exports.init = function ( options ) {
        // feature test
        if ( !supports ) {
            document.documentElement.className += ' ' + settings.noresponsivemenuclass;
            return;
        }
        settings = extend( defaults, options || {} ); // Merge user options with defaults
        initialize(settings);
    };

    // Public APIs
    return exports;

});
