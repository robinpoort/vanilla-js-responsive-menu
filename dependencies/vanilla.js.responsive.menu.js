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

    // Default settings
    var defaults = {
        wrapper: document.getElementsByTagName('nav')[0],
        menu: '',
        initiated_class: 'initiated',
        before_element: '',
        toggletype: 'button',
        toggleclass: 'togglebutton',
        togglecontent: 'menu',
        subtoggletype: 'button',
        subtoggleclass: 'subtoggle',
        subtogglecontent: '+',
        sticky: 0,
        absolute: 0,
        hideclass: 'closed',
        width: 600
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

    // Initialize
    function initialize(settings) {

        // Define what the actual menu object is
        if ( settings.menu == '' ) {
            menu = settings.wrapper.getElementsByTagName('ul')[0];
        } else {
            menu = settings.menu;
        }

        // Add a class when JS is initiated
        apollo.addClass(menu, settings.initiated_class);

        // Creating the main toggle button
        var toggle_element = document.createElement(settings.toggletype);
        apollo.addClass(toggle_element, [settings.toggleclass]);
        if ( settings.before_element == '' ) { settings.before_element = settings.wrapper.firstChild }
        settings.before_element.parentNode.insertBefore(toggle_element, settings.before_element);
        var togglebutton = document.getElementsByClassName(settings.toggleclass)[0];
        togglebutton.innerHTML = settings.togglecontent;
        togglebutton.setAttribute('aria-hidden', 'true');
        togglebutton.setAttribute('aria-pressed', 'false');

        // Creating subtoggles
        var parents = menu.getElementsByTagName('li');
        forEach(parents, function(value, prop) {
            var child = parents[prop].getElementsByTagName('ul')[0];
            if ( child != undefined ) {
                var subtoggle_element = document.createElement(settings.subtoggletype);
                apollo.addClass(subtoggle_element, [settings.subtoggleclass, settings.hideclass]);
                var parent = child.parentNode;
                parent.insertBefore(subtoggle_element, parent.firstChild);
                subtoggle_element.innerHTML = settings.subtogglecontent;
                subtoggle_element.setAttribute('aria-hidden', 'true');
                subtoggle_element.setAttribute('aria-pressed', 'false');
            }
        });

        // Adding classes
        function classes() {

            // Check current viewport width
            var viewportwidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

            // If screen is small and if the menu is not already opened
            if ( viewportwidth < settings.width && !apollo.hasClass(menu, 'opened') ) {

                // Show the toggle button(s)
                apollo.removeClass(togglebutton, 'closed');
                var subtoggles = document.getElementsByClassName(settings.subtoggleclass);
                forEach(subtoggles, function(value, prop) {
                    apollo.addClass(subtoggles[prop].parentNode.getElementsByTagName('ul')[0], settings.hideclass);
                    apollo.removeClass(subtoggles[prop], settings.hideclass);
                });

                // Hide the menu
                apollo.removeClass(menu, 'opened');
                apollo.addClass(menu, 'closed');

                // Make the menu absolute positioned
                if ( settings.absolute == 1 ) {
                    apollo.addClass(menu, 'absolutemenu');
                }

            } else if ( viewportwidth >= settings.width ) {

                // Hide the toggle button(s)
                apollo.addClass(togglebutton, 'closed');
                var subtoggles = document.getElementsByClassName(settings.subtoggleclass);
                forEach(subtoggles, function(value, prop) {
                    apollo.removeClass(subtoggles[prop].parentNode.getElementsByTagName('ul')[0], settings.hideclass);
                    apollo.addClass(subtoggles[prop], settings.hideclass);
                });

                // Show the menu and remove all classes
                apollo.removeClass(menu, ['opened', 'closed']);

                // Undo absolute positioning
                if ( settings.absolute == 1 && apollo.hasClass(menu, 'absolutemenu') ) {
                    apollo.removeClass(menu, 'absolutemenu');
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
                if ( viewportheight <= menuheight && !apollo.hasClass(document.body, 'bodyoverflowhidden') ) {

                    apollo.addClass(document.body, 'bodyoverflowhidden');
                    apollo.addClass(settings.wrapper, 'menuoverflowauto');

                } else if ( viewportheight > menuheight ) {

                    if ( apollo.hasClass(document.body, 'bodyoverflowhidden') ) {
                        apollo.removeClass(document.body, 'bodyoverflowhidden');
                        apollo.removeClass(settings.wrapper, 'menuoverflowauto');
                    }

                    // Make sticky
                    if ( !apollo.hasClass(settings.wrapper, 'sticky') ) {
                        apollo.addClass(settings.wrapper, 'sticky');
                    }

                    // Add padding only if menu is closed or when value is stored
                    if ( !apollo.hasClass(menu, 'opened') && !apollo.hasClass(document.body, 'sticky-initiated') ) {

                        // Calculate the height
                        var paddingtop = menuheight.toString() + 'px';

                        // Set the padding on the body
                        document.body.setAttribute('style', 'padding-top:' + paddingtop);
                        apollo.addClass(document.body, 'sticky-initiated');
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

        // Clicking the toggle button
        togglebutton.onclick = function() {

            // Add classes accordingly
            if ( apollo.hasClass(menu, 'closed') ) {
                apollo.removeClass(menu, 'closed');
                apollo.addClass(menu, 'opened');
                apollo.addClass(togglebutton, 'togglebutton--closed');
            } else if ( apollo.hasClass(menu, 'opened') ) {
                apollo.removeClass(menu, 'opened');
                apollo.addClass(menu, 'closed');
                apollo.removeClass(togglebutton, 'togglebutton--closed');
            }

            // Check if the menu still fits
            stickyMenu();

            return false;
        }

        // Clicking the sub toggles button
        var subtoggles = document.getElementsByClassName(settings.subtoggleclass);
        forEach(subtoggles, function(value, prop) {

            var subtoggle = subtoggles[prop];
            var submenu = subtoggle.parentNode.getElementsByTagName('ul')[0];

            // Click buttons and show submenu
            subtoggle.onclick = function() {

                // Add classes accordingly
                if ( apollo.hasClass(submenu, settings.hideclass) ) {
                    apollo.removeClass(submenu, settings.hideclass);
                    apollo.addClass(subtoggle, 'subtogglebutton--closed');
                } else if ( !apollo.hasClass(submenu, settings.hideclass) ) {
                    apollo.addClass(submenu, settings.hideclass);
                    apollo.removeClass(subtoggle, 'subtogglebutton--closed');
                }

                // Check if the menu still fits
                stickyMenu();
            }
        });
    }

    /**
     * Initialize Plugin
     * @public
     * @param {Object} options User settings
     */
    exports.init = function ( options ) {
        // feature test
        if ( !supports ) return;
        settings = extend( defaults, options || {} ); // Merge user options with defaults
        initialize(settings);
    };

    // Public APIs
    return exports;

});