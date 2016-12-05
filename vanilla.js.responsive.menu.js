/**
 * Responsive menu v1.0.0
 * A vanilla JS responsive menu plugin, by Robin Poort
 * http://robinpoort.com
 *
 * Browser support: IE9+ (IE8 doesn't need a responsive menu since it's not responsive)
 *
 * Dependency: apollo JS | https://github.com/toddmotto/apollo
 * Plugin boilerplate by | http://gomakethings.com/mit/
 *
 * Free to use under the MIT License.
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
        parentlevelclass: 'rm-parent-level-',
        listlevelclass: 'rm-list-level-',
        levelclass: 'rm-item-level-',
        onAfterInit: function() {},
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
            if (element.tagName == tag) {
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
        var y;

        if (window.getComputedStyle)
        {
            y = document.defaultView.getComputedStyle(x,null).getPropertyValue(styleProp);
        }
        else if (x.currentStyle)
        {
            y = x.currentStyle[styleProp];
        }

        return y;
    }

    /**
     * Set attribute(s)
     * Check if attribute exists and if not set it
     */
    function setAttr(elements, attribute, val) {
        // Make element an array if not already
        if ( elements.length === undefined ) {
            elements = [elements];
        }
        // Run through items
        forEach(elements, function(value, prop) {
            var element = elements[prop];
            if ( element.getAttribute(attribute) !== val ) {
                element.setAttribute(attribute, val);
            }
        });
    }

    /**
     * Add level class
     */
    function addLevel(parent, level) {
        var listItems = parent.children;
        forEach(listItems, function(value, prop) {
            var listItem = listItems[prop];
            apollo.addClass(listItem, settings.levelclass + level);
        });
    }


    /**
     * Show children
     */

    function showChildren(element) {
        var listItem = element.parentNode;
        var submenu = listItem.querySelector('ul');
        if ( submenu !== null ) {
            setAttr(submenu, 'aria-hidden', 'false');
            var subItems = submenu.children;
            forEach(subItems, function(value, prop) {
                var subLink = subItems[prop].getElementsByTagName('A')[0];
                setAttr(subLink, 'tabindex', '0');
            });
        }
    }


    /*
     * Responsive menu
     */
    function initialize(settings) {

        // Define what the actual menu object is
        if ( settings.menu == '' ) {
            menu = settings.wrapper.getElementsByTagName('ul')[0];
        } else {
            menu = settings.menu;
        }

        // See if menu has children
        var subParents = menu.querySelectorAll('li ul');
        if ( subParents.length ) {
            hasChildren = true;
            subtoggles = document.getElementsByClassName(settings.subtoggleclass);
        }

        // Create mobile width indicator
        var mobileindicator = document.createElement('div');
        settings.wrapper.appendChild(mobileindicator);
        mobileindicator.id = settings.mobileindicatorid;
        var mobileindicatorZindex = 0;

        // Creating the main toggle button
        var toggle_element = document.createElement(settings.toggletype);
        apollo.addClass(toggle_element, [settings.toggleclass, settings.hideclass]);
        if ( settings.before_element == '' ) { settings.before_element = settings.wrapper.firstChild }
        settings.before_element.parentNode.insertBefore(toggle_element, settings.before_element);
        var togglebutton = document.getElementsByClassName(settings.toggleclass)[0];
        togglebutton.innerHTML = settings.togglecontent;
        togglebutton.setAttribute('aria-hidden', 'true');
        togglebutton.setAttribute('aria-pressed', 'false');
        togglebutton.setAttribute('type', 'button');

        // Setting aria to main elements if not existing
        setAttr(settings.wrapper, 'role', 'menubar');
        setAttr(settings.wrapper, 'aria-label', 'Menu');
        setAttr(menu, 'role', 'menubar');

        // Adding class and aria to first level items
        addLevel(menu, 1);
        setAttr(menu.children, 'role', 'menuitem');

        // Create subtoggles and add classes
        // Add classes to parent list-items, parent lists and their children
        if ( hasChildren ) {
            for (var i = 0; i < subParents.length; i++) {
                var list = subParents[i];
                var subtoggle_element = document.createElement(settings.subtoggletype);
                apollo.addClass(subtoggle_element, [settings.subtoggleclass, settings.hideclass]);
                var listParent = list.parentNode;
                listParent.insertBefore(subtoggle_element, parent.firstChild);
                subtoggle_element.innerHTML = settings.subtogglecontent;
                subtoggle_element.setAttribute('aria-hidden', 'true');
                subtoggle_element.setAttribute('aria-pressed', 'false');
                subtoggle_element.setAttribute('type', 'button');
                apollo.addClass(listParent, settings.parentclass);
                setAttr(listParent, 'aria-haspopup', 'true');
                setAttr(list, 'role', 'menu');
                setAttr(list, 'aria-hidden', 'true');
                var listLevel = getParents(subParents[i], "UL", settings.wrapper).length + 1;
                apollo.addClass(listParent, settings.parentlevelclass + listLevel);
                apollo.addClass(list, settings.listlevelclass + listLevel);
                addLevel(list, listLevel);
                setAttr(list.children, 'role', 'menuitem');
                var children = list.children;
                forEach(children, function(value,prop) {
                    var child = children[prop];
                    if (child.type && child.type === 'a') {
                        setAttr(children[prop].children, 'tabindex', '-1');
                    }
                });
            }
        }

        // Add a class when JS is initiated
        apollo.addClass(settings.wrapper, settings.initiated_class);

        // Function to run after init
        settings.onAfterInit();

        // Adding responsive classes
        function classes() {

            mobileindicatorZindex = getStyle(settings.mobileindicatorid, "z-index");

            // If wrapper is small and if the menu is not already opened
            if ( mobileindicatorZindex == 0 && !apollo.hasClass(menu, settings.openclass) ) {

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
                apollo.removeClass(document.body, settings.openbodyclass);

                // Make the menu absolute positioned
                if ( settings.absolute == 1 ) {
                    apollo.addClass(menu, settings.absolutemenuclass);
                }

            } else if ( mobileindicatorZindex == 1 ) {

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
                apollo.removeClass(document.body, settings.openbodyclass);

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
        window.addEventListener('load', function() {
            classes();
            stickyMenu();
        }, true);

        // On resize
        window.addEventListener('resize', function() {

            // Run immediately
            classes();
            stickyMenu();

            // Run again after 150 ms for safari OSX when scrollbars are visible and you're resizing to a smaller window
            waitForFinalEvent(function(){
                classes();
                stickyMenu();
            }, 200);

        }, true);

        // Accessible menu
        var menulinks = menu.getElementsByTagName('a');
        for (var i = 0; i < menulinks.length; i++) {
            menulinks[i].onblur = function() {
                var focusedItems = document.getElementsByClassName('rm-focused');
                for (var f = 0; f < focusedItems.length; f++) {
                    apollo.removeClass(focusedItems[f], settings.focusedclass);
                }
            };

            menulinks[i].onfocus = function() {
                showChildren(this);

                // Remove the class
                var siblings = this.parentNode.parentNode.querySelectorAll('li');
                if (siblings.length) {
                    for (var f = 0; f < siblings.length; f++) {
                        apollo.removeClass(siblings[f], settings.focusedclass);
                    }
                }
                // Add the class
                var parent = getParents(this, "LI", menu);
                if (parent.length) {
                    for (var f = 0; f < parent.length; f++) {
                        apollo.addClass(parent[f], settings.focusedclass);
                    }
                }

            };
        }

        // Clicking the toggle button
        togglebutton.onclick = function() {

            // Show the menu
            if ( apollo.hasClass(menu, settings.hideclass) ) {

                // Function to run before toggling
                settings.onBeforeToggleOpen();

                // Show the menu
                apollo.removeClass(menu, settings.hideclass);
                apollo.addClass(menu, settings.openclass);

                // Add class to body element you could use for styling
                apollo.addClass(document.body, settings.openbodyclass);

                // Set toggled class to toggle button
                apollo.addClass(togglebutton, settings.toggleclosedclass);

                // Set and remove animate class after duration
                apollo.addClass(menu, settings.animateopenclass);
                setTimeout(function() {

                    // Remove animation class
                    apollo.removeClass(menu, settings.animateopenclass);

                    // Function to run after toggling
                    settings.onAfterToggleOpen();

                }, settings.animateduration);
            }

            // Hide the menu
            else if ( apollo.hasClass(menu, settings.openclass) ) {

                // Function to run before toggling
                settings.onBeforeToggleClose();

                // Properly set animating classes
                apollo.addClass(menu, settings.animatecloseclass);

                // Remove toggled class to toggle button
                apollo.removeClass(togglebutton, settings.toggleclosedclass);

                // When animation is done
                setTimeout(function() {

                    // Remove animate class
                    apollo.removeClass(menu, settings.animatecloseclass);

                    // Hide the menu
                    apollo.removeClass(menu, settings.openclass);
                    apollo.addClass(menu, settings.hideclass);

                    // Remove class from body element you could use for styling
                    apollo.removeClass(document.body, settings.openbodyclass);

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
            forEach(subtoggles, function(value, prop) {

                // Variables
                var subtoggle = subtoggles[prop];
                var submenu = subtoggle.parentNode.getElementsByTagName('ul')[0];

                // Click buttons and show submenu
                subtoggle.onclick = function() {

                    // Open the menu
                    if ( apollo.hasClass(submenu, settings.hideclass) ) {

                        // Function to run before toggling
                        settings.onBeforeSubToggleOpen();

                        // Properly set animating classes
                        apollo.addClass(menu, settings.subanimateopenclass);

                        // Add class to subtoggle button
                        apollo.addClass(subtoggle, settings.toggleclosedclass);

                        // Show sub menu
                        apollo.removeClass(submenu, settings.hideclass);

                        setTimeout(function() {

                            // Remove animate class
                            apollo.removeClass(menu, settings.subanimateopenclass);

                            // Function to run before toggling
                            settings.onAfterSubToggleOpen();

                        }, settings.subanimateduration);
                    }

                    // Close the menu
                    else if ( !apollo.hasClass(submenu, settings.hideclass) ) {

                        // Function to run before toggling
                        settings.onBeforeSubToggleClose();

                        // Properly set animating classes
                        apollo.addClass(menu, settings.subanimatecloseclass);

                        // Remove class from subtoggle button
                        apollo.removeClass(subtoggle, settings.toggleclosedclass);

                        setTimeout(function() {

                            // Remove animate class
                            apollo.removeClass(menu, settings.subanimatecloseclass);

                            // Set classes
                            apollo.addClass(submenu, settings.hideclass);

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