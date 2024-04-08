/**
 *
 * Responsive menu
 * A vanilla JS responsive menu plugin by Robin Poort
 * http://robinpoort.com
 *
 * Browser support: IE9+ (IE8 doesn't need a responsive menu since it's not responsive)
 *
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
        loaded_class: 'rm-loaded',
        before_element: '',
        toggletype: 'button',
        toggleclass: 'rm-togglebutton',
        toggleclosedclass: 'rm-togglebutton--closed',
        togglecontent: 'menu',
        subtoggletype: 'button',
        subtoggleclass: 'rm-subtoggle',
        subtogglecontent: '+',
        sticky: false,
        absolute: false,
        hideclass: 'rm-closed',
        openclass: 'rm-opened',
        openbodyclass: 'has-opened-menu',
        focusedclass: 'rm-focused',
        animateopenclass: 'is-opening',
        animatecloseclass: 'is-closing',
        animateduration: 0, // (Animated with CSS so set to same duration as CSS value)
        subanimateopenclass: 'is-opening',
        subanimatecloseclass: 'is-closing',
        subanimateduration: 0, // (Animated with CSS so set to same duration as CSS value)
        parentclass: 'rm-parent',
        fullmenuclass: 'rm-fullmenu',
        absolutemenuclass: 'rm-absolutemenu',
        bodyoverflowhiddenclass: 'rm-bodyoverflowhidden',
        menuoverflowautoclass: 'rm-menuoverflowauto',
        stickyclass: 'rm-sticky',
        stickyinitiatedclass: 'rm-sticky-initiated',
        noresponsivemenuclass: 'rm-no-responsive-menu',
        mobileindicatorid: 'rm-mobile-indicator',
        mobilesubmenuindicatorid: 'rm-mobile-submenu-indicator',
        openOnClick: false,
        arrowNavigation: false,
        onAfterInit: function() {},
        onAfterLoad: function() {},
        onBeforeToggleOpen: function() {},
        onAfterToggleOpen: function() {},
        onBeforeToggleClose: function() {},
        onAfterToggleClose: function() {},
        onBeforeSubToggleOpen: function() {},
        onAfterSubToggleOpen: function() {},
        onBeforeSubToggleClose: function() {},
        onAfterSubToggleClose: function() {}
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

    /**
     * Run when window resize is done (after x ms)
     */
    var waitForFinalEvent = (function () {
        var timers = {};
        return function (callback, ms, uniqueId) {
            if (!uniqueId) {
                uniqueId = "Don't call this twice without a uniqueId";
            }
            if (timers[uniqueId]) {
                clearTimeout (timers[uniqueId]);
            }
            timers[uniqueId] = setTimeout(callback, ms);
        };
    })();

    /**
     * Get parents
     */
    function getParents(element, tag, stop) {
        var nodes = [];
        while (element.parentNode && element.parentNode != stop) {
            element = element.parentNode;
            if (element.tagName === tag) {
                nodes.push(element);
            }
        }
        return nodes
    }

    /**
     * Get style
     */
    function getStyle(el,styleProp)
    {
        var x = document.getElementById(el);

        if (window.getComputedStyle)
        {
            var y = document.defaultView.getComputedStyle(x,null).getPropertyValue(styleProp);
        }
        else if (x.currentStyle)
        {
            var y = x.currentStyle[styleProp];
        }

        return y;
    }

    function returnId(menu, togglebutton, id) {
        if (id === undefined) {
            id = 0;
        }
        if (document.getElementById('vjsrm:'+id) !== null) {
            id = id + 1;
            returnId(menu, togglebutton, id)
        } else {
            menu.id = 'vjsrm:'+id;
            togglebutton.setAttribute('aria-controls', 'vjsrm:'+id);
        }
    }

    // Responsive menu
    function initialize(settings) {

        menu = settings.menu || settings.wrapper.getElementsByTagName('ul')[0];

        // Add a class when JS is initiated
        settings.wrapper.classList.add(settings.initiated_class);

        // Function to run after init
        settings.onAfterInit();

        // See if menu has children
        var parents = menu.querySelectorAll('li ul');
        if ( parents.length ) {
            hasChildren = true;
            subtoggles = document.getElementsByClassName(settings.subtoggleclass);

            // Create mobile submenu width indicator
            var mobilesubmenuindicator = document.createElement('div');
            settings.wrapper.appendChild(mobilesubmenuindicator);
            mobilesubmenuindicator.id = settings.mobilesubmenuindicatorid;
            var mobilesubindicatorZindex = 0;
        }

        // Create mobile width indicator
        var mobileindicator = document.createElement('div');
        settings.wrapper.appendChild(mobileindicator);
        mobileindicator.id = settings.mobileindicatorid;
        var mobileindicatorZindex = 0;

        // Creating the main toggle button
        var toggle_element = document.createElement(settings.toggletype);
        toggle_element.classList.add(settings.toggleclass, settings.hideclass);
        if ( settings.before_element === '' ) { settings.before_element = settings.wrapper.firstChild }
        settings.before_element.parentNode.insertBefore(toggle_element, settings.before_element);
        var togglebutton = toggle_element;
        togglebutton.innerHTML = settings.togglecontent;
        togglebutton.setAttribute('aria-expanded', 'false');
        togglebutton.setAttribute('aria-pressed', 'false');
        togglebutton.setAttribute('type', 'button');

        // Add id's for aria
        returnId(menu, togglebutton);

        // Subtoggles and parent classes
        if ( hasChildren ) {
            for (var i = 0; i < parents.length; i++) {
                var subtoggle_element = document.createElement(settings.subtoggletype);
                subtoggle_element.classList.add(settings.subtoggleclass, settings.hideclass);
                var parent = parents[i].parentNode;
                parent.insertBefore(subtoggle_element, parent.firstChild);
                subtoggle_element.innerHTML = settings.subtogglecontent;
                subtoggle_element.setAttribute('aria-expanded', 'false');
                subtoggle_element.setAttribute('aria-pressed', 'false');
                subtoggle_element.setAttribute('type', 'button');
                parents[i].parentNode.classList.add(settings.parentclass);
            }
        }

        // Adding classes
        function classes() {

            menu =  settings.menu || settings.wrapper.getElementsByTagName('ul')[0];

            mobileindicatorZindex = parseInt(getStyle(settings.mobileindicatorid, "z-index"), 10);

            if ( parents.length ) {
                mobilesubmenuindicator = parseInt(getStyle(settings.mobilesubmenuindicatorid, "z-index"), 10);
            }

            // If wrapper is small and if the menu is not already opened
            if ( mobileindicatorZindex === 0 && !menu.classList.contains(settings.openclass) ) {

                // Show the toggle button(s)
                togglebutton.classList.remove(settings.hideclass);

                // Hide the menu
                menu.classList.remove(settings.openclass, settings.fullmenuclass);
                menu.classList.add(settings.hideclass);
                document.body.classList.remove(settings.openbodyclass);

                // Make the menu absolute positioned
                if ( settings.absolute ) {
                    menu.classList.add(settings.absolutemenuclass);
                }

            } else if ( mobileindicatorZindex === 1 ) {

                // Hide the toggle button(s)
                togglebutton.classList.add(settings.hideclass);
                togglebutton.classList.remove(settings.toggleclosedclass);
                togglebutton.setAttribute('aria-expanded', 'false');
                togglebutton.setAttribute('aria-pressed', 'false');

                // Show the menu and remove all classes
                menu.classList.remove(settings.openclass, settings.hideclass);
                menu.classList.add(settings.fullmenuclass);
                document.body.classList.remove(settings.openbodyclass);

                // Undo absolute positioning
                if ( settings.absolute && menu.classList.contains(settings.absolutemenuclass) ) {
                    menu.classList.remove(settings.absolutemenuclass);
                }
            }

            if ( hasChildren && mobilesubmenuindicator === 0 ) {
                forEach(subtoggles, function (value, prop) {
                    if ( !subtoggles[prop].classList.contains(settings.toggleclosedclass) ) {
                        subtoggles[prop].parentNode.getElementsByTagName('ul')[0].classList.add(settings.hideclass);
                        subtoggles[prop].classList.remove(settings.hideclass);
                    }
                });
            } else if (hasChildren && mobilesubmenuindicator === 1) {
                forEach(subtoggles, function(value, prop) {
                    subtoggles[prop].parentNode.getElementsByTagName('ul')[0].classList.remove(settings.hideclass);
                    subtoggles[prop].classList.add(settings.hideclass);
                });
            }
        }

        // Sticky menu body height
        function stickyMenu() {

            menu =  settings.menu || settings.wrapper.getElementsByTagName('ul')[0];

            if ( settings.sticky ) {

                // The current menu and viewport heights
                var menuheight = settings.wrapper.offsetHeight;
                var viewportheight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

                // Add the overflow class but only if there is space
                if ( viewportheight <= menuheight && !document.body.classList.contains(settings.bodyoverflowhiddenclass) ) {

                    document.body.classList.add(settings.bodyoverflowhiddenclass);
                    settings.wrapper.classList.add(settings.menuoverflowautoclass);

                } else if ( viewportheight > menuheight ) {

                    if ( document.body.classList.contains(settings.bodyoverflowhiddenclass) ) {
                        document.body.classList.remove(settings.bodyoverflowhiddenclass);
                        settings.wrapper.classList.remove(settings.menuoverflowautoclass);
                    }

                    // Make sticky
                    if ( !settings.wrapper.classList.contains(settings.stickyclass) ) {
                        settings.wrapper.classList.add(settings.stickyclass);
                    }

                    // Add padding only if menu is closed or when value is stored
                    if ( !menu.classList.contains(settings.openclass) && !document.body.classList.contains(settings.stickyinitiatedclass) ) {

                        // Calculate the height
                        var paddingtop = menuheight.toString() + 'px';

                        // Set the padding on the body
                        document.body.setAttribute('style', 'padding-top:' + paddingtop);
                        document.body.classList.add(settings.stickyinitiatedclass);
                    }
                }
            }
        }

        // Initial load
        window.addEventListener('load', function() {
            classes();
            stickyMenu();

            // Add a class after load
            settings.wrapper.classList.add(settings.loaded_class);

            // Function to run after load
            settings.onAfterLoad();

        }, true);

        // On resize
        window.addEventListener('resize', function() {

            // Run immediately
            classes();
            stickyMenu();

            // Run again after 200 ms for safari OSX when scrollbars are visible and you're resizing to a smaller window
            waitForFinalEvent(function(){
                classes();
                stickyMenu();
            }, 200);

        }, true);

        // Accessible focus menu
        var menulinks = menu.getElementsByTagName('a');
        for (var i = 0; i < menulinks.length; i++) {
            menulinks[i].onblur = function() {
                var focusedItems = document.getElementsByClassName('rm-focused');
                for (var f = 0; f < focusedItems.length; f++) {
                    focusedItems[f].classList.remove(settings.focusedclass);
                }
            };
            menulinks[i].onfocus = function() {
                // Remove the class
                var siblings = this.parentNode.parentNode.querySelectorAll('li');
                if (siblings.length) {
                    for (var f = 0; f < siblings.length; f++) {
                        siblings[f].classList.remove(settings.focusedclass);
                    }
                }
                // Add the class
                var parent = getParents(this, "LI", menu);
                if (parent.length) {
                    for (var f = 0; f < parent.length; f++) {
                        parent[f].classList.add(settings.focusedclass);
                    }
                }
            };
        }

        // Clicking the toggle button
        togglebutton.onclick = function() {

            menu =  settings.menu || settings.wrapper.getElementsByTagName('ul')[0];

            // Show the menu
            if ( menu.classList.contains(settings.hideclass) ) {

                // Function to run before toggling
                settings.onBeforeToggleOpen();

                // Show the menu
                menu.classList.remove(settings.hideclass);
                menu.classList.add(settings.openclass);

                // Add class to body element you could use for styling
                document.body.classList.add(settings.openbodyclass);

                // Set toggled class to toggle button
                togglebutton.classList.add(settings.toggleclosedclass);
                togglebutton.setAttribute('aria-expanded', 'true');
                togglebutton.setAttribute('aria-pressed', 'true');

                // Set and remove animate class after duration
                menu.classList.add(settings.animateopenclass);
                setTimeout(function() {

                    // Remove animation class
                    menu.classList.remove(settings.animateopenclass);

                    // Function to run after toggling
                    settings.onAfterToggleOpen();

                }, settings.animateduration);
            }

            // Hide the menu
            else if ( menu.classList.contains(settings.openclass) ) {

                menu =  settings.menu || settings.wrapper.getElementsByTagName('ul')[0];

                // Function to run before toggling
                settings.onBeforeToggleClose();

                // Properly set animating classes
                menu.classList.add(settings.animatecloseclass);

                // Remove toggled class to toggle button
                togglebutton.classList.remove(settings.toggleclosedclass);
                togglebutton.setAttribute('aria-expanded', 'false');
                togglebutton.setAttribute('aria-pressed', 'false');

                // When animation is done
                setTimeout(function() {

                    // Remove animate class
                    menu.classList.remove(settings.animatecloseclass);

                    // Hide the menu
                    menu.classList.remove(settings.openclass);
                    menu.classList.add(settings.hideclass);

                    // Remove class from body element you could use for styling
                    document.body.classList.remove(settings.openbodyclass);

                    // Function to run after toggling
                    settings.onAfterToggleClose();

                }, settings.animateduration);
            }

            // Check if the menu still fits
            stickyMenu();

            return false;
        };

        // Clicking the sub toggles button
        if ( hasChildren ) {

            menu =  settings.menu || settings.wrapper.getElementsByTagName('ul')[0];

            forEach(subtoggles, function(value, prop) {

                // Variables
                var subtoggle = subtoggles[prop];
                var submenu = subtoggle.parentNode.getElementsByTagName('ul')[0];

                // Click buttons and show submenu
                subtoggle.onclick = function() {

                    // Open
                    if ( submenu.classList.contains(settings.hideclass) ) {

                        // Function to run before toggling
                        settings.onBeforeSubToggleOpen();

                        // Properly set animating classes
                        menu.classList.add(settings.subanimateopenclass);

                        // Add class to subtoggle button
                        subtoggle.classList.add(settings.toggleclosedclass);
                        subtoggle.setAttribute('aria-expanded', 'true');
                        subtoggle.setAttribute('aria-pressed', 'true');

                        // Show sub menu
                        submenu.classList.remove(settings.hideclass);

                        setTimeout(function() {

                            // Remove animate class
                            menu.classList.remove(settings.subanimateopenclass);

                            // Function to run before toggling
                            settings.onAfterSubToggleOpen();

                        }, settings.subanimateduration);
                    }

                    // Close
                    else if ( !submenu.classList.contains(settings.hideclass) ) {

                        // Function to run before toggling
                        settings.onBeforeSubToggleClose();

                        // Properly set animating classes
                        menu.classList.add(settings.subanimatecloseclass);

                        // Remove class from subtoggle button
                        subtoggle.classList.remove(settings.toggleclosedclass);
                        subtoggle.setAttribute('aria-expanded', 'false');
                        subtoggle.setAttribute('aria-pressed', 'false');

                        setTimeout(function() {

                            // Remove animate class
                            menu.classList.remove(settings.subanimatecloseclass);

                            // Set classes
                            submenu.classList.add(settings.openclass);

                            // Function to run before toggling
                            settings.onAfterSubToggleClose();

                        }, settings.subanimateduration);

                    }

                    // Check if the menu still fits
                    stickyMenu();
                }
            });
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
