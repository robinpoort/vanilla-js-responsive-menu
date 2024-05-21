(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define('responsivemenu', factory(root));
    } else if (typeof exports === 'object') {
        module.responsivemenu = factory(root);
    } else {
        root.responsivemenu = factory(root);
    }
})(this, function (root) {
    
    'use strict';
    
    // Variables
    const exports = {}; // Object for public APIs
    const supports = !!document.querySelector && !!root.addEventListener; // Feature test
    let settings; // Plugin settings
    let menu; // The actual menu item
    let mobilesubmenuindicator;
    let hasChildren = false;
    let subtoggles = false;
    
    // Default settings
    const defaults = {
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
        arrowNavigationCycle: false,
        arrowGridNav: false,
        onAfterInit: function () {
        },
        onAfterLoad: function () {
        },
        onBeforeToggleOpen: function () {
        },
        onAfterToggleOpen: function () {
        },
        onBeforeToggleClose: function () {
        },
        onAfterToggleClose: function () {
        },
        onBeforeSubToggleOpen: function () {
        },
        onAfterSubToggleOpen: function () {
        },
        onBeforeSubToggleClose: function () {
        },
        onAfterSubToggleClose: function () {
        },
        onBeforeClickToggleOpen: function () {
        },
        onAfterClickToggleOpen: function () {
        },
        onBeforeClickToggleClose: function () {
        },
        onAfterClickToggleClose: function () {
        }
    };
    
    // Methods
    /**
     * A simple forEach() implementation for Arrays, Objects and NodeLists
     * @private
     * @param {Array|Object|NodeList} collection Collection of items to iterate
     * @param {Function} callback Callback function for each iteration
     * @param {Array|Object|NodeList} scope Object/NodeList/Array that forEach is iterating over (aka `this`)
     */
    const forEach = function (collection, callback, scope) {
        if (Object.prototype.toString.call(collection) === '[object Object]') {
            for (const prop in collection) {
                if (Object.prototype.hasOwnProperty.call(collection, prop)) {
                    callback.call(scope, collection[prop], prop, collection);
                }
            }
        } else {
            for (let i = 0, len = collection.length; i < len; i++) {
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
    const extend = function (defaults, options) {
        const extended = {};
        forEach(defaults, function (value, prop) {
            extended[prop] = defaults[prop];
        });
        forEach(options, function (value, prop) {
            extended[prop] = options[prop];
        });
        return extended;
    };
    
    /**
     * Run when window resize is done (after x ms)
     */
    const waitForFinalEvent = (function () {
        const timers = {};
        return function (callback, ms, uniqueId) {
            if (!uniqueId) {
                uniqueId = "Don't call this twice without a uniqueId";
            }
            if (timers[uniqueId]) {
                clearTimeout(timers[uniqueId]);
            }
            timers[uniqueId] = setTimeout(callback, ms);
        };
    })();
    
    /**
     * Get parents
     */
    function getParents(element, tag, stop) {
        const nodes = [];
        while (element.parentNode && element.parentNode !== stop) {
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
    function getStyle(el, styleProp) {
        const x = document.getElementById(el);
        if (x) {
            return window.getComputedStyle(x, null).getPropertyValue(styleProp);
        } else {
            return null;
        }
    }
    
    function returnId(menu, togglebutton, id) {
        if (id === undefined) {
            id = 0;
        }
        if (document.getElementById('vjsrm:' + id) !== null) {
            id = id + 1;
            returnId(menu, togglebutton, id)
        } else {
            menu.id = 'vjsrm:' + id;
            togglebutton.setAttribute('aria-controls', 'vjsrm:' + id);
        }
    }
    
    // Responsive menu
    function initialize(settings) {
        
        // Set menu element
        menu = settings.menu || settings.wrapper.getElementsByTagName('ul')[0];
        
        // Add classes when JS is initiated
        settings.wrapper.classList.add(settings.initiated_class);
        const clickClass = settings.openOnClick ? 'rm-open-on-click' : 'rm-open-on-hover';
        settings.wrapper.classList.add(clickClass);
        const arrowClass = settings.arrowNavigation ? 'rm-arrow-navigation' : 'rm-no-arrow-navigation';
        settings.wrapper.classList.add(arrowClass);
        
        // Function to run after init
        settings.onAfterInit();
        
        // See if menu has children
        const parents = menu.querySelectorAll('li ul');
        if (parents.length) {
            hasChildren = true;
            subtoggles = document.getElementsByClassName(settings.subtoggleclass);
            
            // Create mobile submenu width indicator when openOnClick is false
            if (!settings.openOnClick) {
                mobilesubmenuindicator = document.createElement('div');
                settings.wrapper.appendChild(mobilesubmenuindicator);
                mobilesubmenuindicator.id = settings.mobilesubmenuindicatorid;
            }
        }
        
        // Create mobile width indicator
        const mobileindicator = document.createElement('div');
        settings.wrapper.appendChild(mobileindicator);
        mobileindicator.id = settings.mobileindicatorid;
        let mobileindicatorZindex = 0;
        
        // Creating the main toggle button
        const toggle_element = document.createElement(settings.toggletype);
        toggle_element.classList.add(settings.toggleclass, settings.hideclass);
        if (settings.before_element === '') {
            settings.before_element = settings.wrapper.firstChild
        }
        settings.before_element.parentNode.insertBefore(toggle_element, settings.before_element);
        const togglebutton = toggle_element;
        togglebutton.innerHTML = settings.togglecontent;
        togglebutton.setAttribute('aria-expanded', 'false');
        togglebutton.setAttribute('aria-pressed', 'false');
        togglebutton.setAttribute('type', 'button');
        
        // Add id's for aria
        returnId(menu, togglebutton);
        
        // Loop through all li elements found in the menu and assign them a class with a level number
        const menuItems = menu.querySelectorAll('li');
        menuItems.forEach((item, i) => {
            item.setAttribute('nav-level', getParents(item, 'UL', menu).length);
        });
        
        // Subtoggles and parent classes
        if (hasChildren) {
            // Create list of parents to add to
            const parentElements = [];
            
            for (let i = 0; i < parents.length; i++) {
                const parent = parents[i].closest('li');
                if (!settings.openOnClick) {
                    const subtoggle_element = document.createElement(settings.subtoggletype);
                    subtoggle_element.classList.add(settings.subtoggleclass, settings.hideclass);
                    subtoggle_element.innerHTML = settings.subtogglecontent;
                    subtoggle_element.setAttribute('aria-expanded', 'false');
                    subtoggle_element.setAttribute('aria-pressed', 'false');
                    subtoggle_element.setAttribute('type', 'button');
                    parent.insertBefore(subtoggle_element, parent.firstChild);
                }
                
                // Add to parentElements if it doenst exist in it yet
                if (!parentElements.includes(parent)) {
                    parentElements.push(parent);
                }
            }
            
            // Loop through parents and add a Class
            parentElements.forEach((parent, i) => {
                parent.classList.add(settings.parentclass);
                
                // Convert links to buttons
                if (settings.openOnClick) {
                    // Get the parent link
                    const parentA = parent.querySelector('a');
                    
                    // Convert the href to an id that is safe to use using a regex
                    const hrefId = parentA.getAttribute('href').replace(/[^a-zA-Z0-9-_]/g, '');
                    
                    if (parentA) {
                        if (!parentA.nextElementSibling) return;
                        parentA.nextElementSibling.id = hrefId;
                        const parentButton = document.createElement('button');
                        parentButton.innerHTML = parentA.innerHTML;
                        parentButton.setAttribute('aria-expanded', 'false');
                        parentButton.setAttribute('type', 'button');
                        parentButton.setAttribute('aria-controls', parentA.getAttribute('href').replace('#', ''));
                        parentButton.classList.add('rm-parent-button');
                        parent.insertBefore(parentButton, parentA);
                        parentA.remove();
                    }
                }
            });
            
            document.querySelectorAll(`.${settings.parentclass}`).forEach((parent) => {
                // Set aria to false
                const hasButton = parent.parentNode.querySelector('button[aria-expanded]');
                if (hasButton) {
                    hasButton.setAttribute('aria-expanded', 'false');
                }
            });
        }
        
        // Adding classes
        function classes() {
            
            menu = settings.menu || settings.wrapper.getElementsByTagName('ul')[0];
            
            mobileindicatorZindex = parseInt(getStyle(settings.mobileindicatorid, "z-index"), 10);
            
            if (parents.length) {
                mobilesubmenuindicator = parseInt(getStyle(settings.mobilesubmenuindicatorid, "z-index"), 10);
            }
            
            // If wrapper is small and if the menu is not already opened
            if (mobileindicatorZindex === 0 && !menu.classList.contains(settings.openclass)) {
                
                // Show the toggle button(s)
                togglebutton.classList.remove(settings.hideclass);
                
                // Hide the menu
                menu.classList.remove(settings.openclass, settings.fullmenuclass);
                menu.classList.add(settings.hideclass);
                document.body.classList.remove(settings.openbodyclass);
                
                // Make the menu absolute positioned
                if (settings.absolute) {
                    menu.classList.add(settings.absolutemenuclass);
                }
                
            } else if (mobileindicatorZindex === 1) {
                
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
                if (settings.absolute && menu.classList.contains(settings.absolutemenuclass)) {
                    menu.classList.remove(settings.absolutemenuclass);
                }
            }
            
            if (hasChildren && mobilesubmenuindicator === 0) {
                forEach(subtoggles, function (value, prop) {
                    if (!subtoggles[prop].classList.contains(settings.toggleclosedclass)) {
                        subtoggles[prop].parentNode.getElementsByTagName('ul')[0].classList.add(settings.hideclass);
                        subtoggles[prop].classList.remove(settings.hideclass);
                    }
                });
            } else if (hasChildren && mobilesubmenuindicator === 1) {
                forEach(subtoggles, function (value, prop) {
                    subtoggles[prop].parentNode.getElementsByTagName('ul')[0].classList.remove(settings.hideclass);
                    subtoggles[prop].classList.add(settings.hideclass);
                });
            }
        }
        
        // Sticky menu body height
        function stickyMenu() {
            
            menu = settings.menu || settings.wrapper.getElementsByTagName('ul')[0];
            
            if (settings.sticky) {
                
                // The current menu and viewport heights
                const menuheight = settings.wrapper.offsetHeight;
                const viewportheight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
                
                // Add the overflow class but only if there is space
                if (viewportheight <= menuheight && !document.body.classList.contains(settings.bodyoverflowhiddenclass)) {
                    
                    document.body.classList.add(settings.bodyoverflowhiddenclass);
                    settings.wrapper.classList.add(settings.menuoverflowautoclass);
                    
                } else if (viewportheight > menuheight) {
                    
                    if (document.body.classList.contains(settings.bodyoverflowhiddenclass)) {
                        document.body.classList.remove(settings.bodyoverflowhiddenclass);
                        settings.wrapper.classList.remove(settings.menuoverflowautoclass);
                    }
                    
                    // Make sticky
                    if (!settings.wrapper.classList.contains(settings.stickyclass)) {
                        settings.wrapper.classList.add(settings.stickyclass);
                    }
                    
                    // Add padding only if menu is closed or when value is stored
                    if (!menu.classList.contains(settings.openclass) && !document.body.classList.contains(settings.stickyinitiatedclass)) {
                        
                        // Calculate the height
                        const paddingtop = menuheight.toString() + 'px';
                        
                        // Set the padding on the body
                        document.body.setAttribute('style', 'padding-top:' + paddingtop);
                        document.body.classList.add(settings.stickyinitiatedclass);
                    }
                }
            }
        }
        
        // Initial load
        window.addEventListener('load', function () {
            classes();
            stickyMenu();
            
            // Add a class after load
            settings.wrapper.classList.add(settings.loaded_class);
            
            // Function to run after load
            settings.onAfterLoad();
            
        }, true);
        
        // On resize
        window.addEventListener('resize', function () {
            
            // Run immediately
            classes();
            stickyMenu();
            
            // Run again after 200 ms for safari OSX when scrollbars are visible and you're resizing to a smaller window
            waitForFinalEvent(function () {
                classes();
                stickyMenu();
            }, 200);
            
        }, true);
        
        // Accessible focus menu
        if (!settings.arrowNavigation) {
            const menulinks = menu.getElementsByTagName('a');
            for (let i = 0; i < menulinks.length; i++) {
                menulinks[i].onblur = function () {
                    const focusedItems = document.getElementsByClassName('rm-focused');
                    for (let f = 0; f < focusedItems.length; f++) {
                        focusedItems[f].classList.remove(settings.focusedclass);
                    }
                };
                menulinks[i].onfocus = function () {
                    // Remove the class
                    const siblings = this.parentNode.parentNode.querySelectorAll('li');
                    if (siblings.length) {
                        for (let f = 0; f < siblings.length; f++) {
                            siblings[f].classList.remove(settings.focusedclass);
                        }
                    }
                    // Add the class
                    const parent = getParents(this, "LI", menu);
                    if (parent.length) {
                        for (let f = 0; f < parent.length; f++) {
                            parent[f].classList.add(settings.focusedclass);
                        }
                    }
                };
            }
        }
        
        // Clicking the toggle button
        togglebutton.onclick = function () {
            
            menu = settings.menu || settings.wrapper.getElementsByTagName('ul')[0];
            
            // Show the menu
            if (menu.classList.contains(settings.hideclass)) {
                
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
                setTimeout(function () {
                    
                    // Remove animation class
                    menu.classList.remove(settings.animateopenclass);
                    
                    // Function to run after toggling
                    settings.onAfterToggleOpen();
                    
                }, settings.animateduration);
            }
            
            // Hide the menu
            else if (menu.classList.contains(settings.openclass)) {
                
                menu = settings.menu || settings.wrapper.getElementsByTagName('ul')[0];
                
                // Function to run before toggling
                settings.onBeforeToggleClose();
                
                // Properly set animating classes
                menu.classList.add(settings.animatecloseclass);
                
                // Remove toggled class to toggle button
                togglebutton.classList.remove(settings.toggleclosedclass);
                togglebutton.setAttribute('aria-expanded', 'false');
                togglebutton.setAttribute('aria-pressed', 'false');
                
                // When animation is done
                setTimeout(function () {
                    
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
        if (hasChildren) {
            
            menu = settings.menu || settings.wrapper.getElementsByTagName('ul')[0];
            
            forEach(subtoggles, function (value, prop) {
                
                // Variables
                const subtoggle = subtoggles[prop];
                const submenu = subtoggle.parentNode.getElementsByTagName('ul')[0];
                
                // Click buttons and show submenu
                subtoggle.onclick = function () {
                    
                    // Open
                    if (submenu.classList.contains(settings.hideclass)) {
                        
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
                        
                        setTimeout(function () {
                            
                            // Remove animate class
                            menu.classList.remove(settings.subanimateopenclass);
                            
                            // Function to run before toggling
                            settings.onAfterSubToggleOpen();
                            
                        }, settings.subanimateduration);
                    }
                    
                    // Close
                    else if (!submenu.classList.contains(settings.hideclass)) {
                        
                        // Function to run before toggling
                        settings.onBeforeSubToggleClose();
                        
                        // Properly set animating classes
                        menu.classList.add(settings.subanimatecloseclass);
                        
                        // Remove class from subtoggle button
                        subtoggle.classList.remove(settings.toggleclosedclass);
                        subtoggle.setAttribute('aria-expanded', 'false');
                        subtoggle.setAttribute('aria-pressed', 'false');
                        
                        setTimeout(function () {
                            
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
        
        
        // Opening a submenu on click
        if (settings.openOnClick) {
            menu.addEventListener('click', function (e) {
                
                console.log('click!');
                
                // Get the target
                const target = e.target;
                
                // See if target is a subnav toggle
                const hasSubNav = target.closest('[aria-expanded]');
                
                // If we found a subNav
                if (hasSubNav) {
                    
                    const subNavParent = hasSubNav.parentNode;
                    
                    // Close current open subnav on the same level when it's not the same
                    const currentOpenSubNav = menu.querySelector('[aria-expanded="true"]');
                    if (currentOpenSubNav && currentOpenSubNav !== hasSubNav && !hasSubNav.closest(`.${settings.openclass}`)) {
                        closeSubNav(currentOpenSubNav);
                    }
                    
                    if (subNavParent && subNavParent.classList.contains(settings.openclass)) {
                        closeSubNav(hasSubNav);
                    } else {
                        openSubNav(hasSubNav);
                    }
                }
            });
        }
        
        function openSubNav(el) {
            // Function to run before clicking
            settings.onBeforeClickToggleOpen();
            
            el.parentNode.classList.add(settings.openclass);
            el.setAttribute('aria-expanded', 'true');
            
            // Function to run before clicking
            settings.onAfterClickToggleOpen();
        }
        
        function closeSubNav(el) {
            // Function to run before clicking
            settings.onBeforeClickToggleClose();
            el.parentNode.classList.remove(settings.openclass);
            el.setAttribute('aria-expanded', 'false');
            // Function to run before clicking
            settings.onAfterClickToggleClose();
        }
        
        // Key events
        // ==============
        if (settings.arrowNavigation) {
            menu.addEventListener('keydown', (e) => {
                
                // Esc key
                if (e.key === 'Escape' || e.key === 'Esc') {
                    const currentOpenSubNav = menu.querySelector('[aria-expanded="true"]');
                    if (currentOpenSubNav) {
                        closeSubNav(currentOpenSubNav);
                        // If the current activeElement is a child of the open subnav, focus the subnav
                        if (currentOpenSubNav.closest('li').contains(document.activeElement)) {
                            currentOpenSubNav.focus();
                        }
                    }
                }
                
                // arrow keys for navigation
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'End' || e.key === 'Home') {
                    
                    // Get the root menu
                    const root = document.activeElement.closest('.' + settings.initiated_class);
                    
                    // Return if the activeElement is not in the menu
                    if (!root) return;
                    
                    // Prevent default page scrolling
                    e.preventDefault();
                    
                    // Get the current focused element
                    const currentFocused = document.activeElement;
                    const currentPosition = currentFocused.getBoundingClientRect();
                    let nearest = null;
                    let shortestDistance = Number.MAX_VALUE;
                    let focusableElements;
                    
                    // Get focusableElements based on the current level
                    const currentLevel = document.activeElement.closest('[nav-level]').getAttribute('nav-level');
                    const currentUl = document.activeElement.closest('ul');
                    
                    // Get focusable elements
                    focusableElements = Array.from(currentUl.querySelectorAll('[nav-level="' + currentLevel + '"] > a, [nav-level="' + currentLevel + '"] > button'));
                    
                    if (settings.arrowGridNav && !settings.arrowNavigationCycle) {
                        if (currentFocused.closest('.rm-parent.rm-opened') && !currentFocused.hasAttribute('aria-controls')) {
                            focusableElements = Array.from(currentFocused.closest('.rm-parent').querySelectorAll('a, button:not([aria-expanded="true"])'));
                        }
                    }
                    
                    // Get index
                    const index = Array.from(focusableElements).indexOf(document.activeElement);
                    
                    // Remove elements with display none
                    focusableElements.forEach((el, i) => {
                        if (window.getComputedStyle(el).display === 'none') {
                            focusableElements.splice(i, 1);
                        }
                    });
                    
                    // Go to the next sublevel item
                    if (e.key === 'ArrowDown' && document.activeElement.getAttribute('aria-expanded') === 'true') {
                        document.activeElement.closest('li').querySelector('ul > li > a').focus();
                    } else if (settings.arrowGridNav && !settings.arrowNavigationCycle) {
                        
                        focusableElements.forEach(element => {
                            if (element !== currentFocused) {
                                const position = element.getBoundingClientRect();
                                let dx = 0, dy = 0;
                                
                                switch (event.key) {
                                    case 'ArrowUp':
                                        dy = currentPosition.top - position.bottom;
                                        if (dy < 0) return; // Ignore elements below
                                        dx = (currentPosition.left + currentPosition.right) / 2 - (position.left + position.right) / 2;
                                        break;
                                    case 'ArrowDown':
                                        dy = position.top - currentPosition.bottom;
                                        if (dy < 0) return; // Ignore elements above
                                        dx = (currentPosition.left + currentPosition.right) / 2 - (position.left + position.right) / 2;
                                        break;
                                    case 'ArrowLeft':
                                        dx = currentPosition.left - position.right;
                                        if (dx < 0) return; // Ignore elements to the right
                                        dy = (currentPosition.top + currentPosition.bottom) / 2 - (position.top + position.bottom) / 2;
                                        break;
                                    case 'ArrowRight':
                                        dx = position.left - currentPosition.right;
                                        if (dx < 0) return; // Ignore elements to the left
                                        dy = (currentPosition.top + currentPosition.bottom) / 2 - (position.top + position.bottom) / 2;
                                        break;
                                }
                                
                                // Calculate distance considering both dimensions
                                let distance = Math.sqrt(dx * dx + dy * dy);
                                
                                if (distance < shortestDistance) {
                                    nearest = element;
                                    shortestDistance = distance;
                                }
                            }
                        });
                        
                        if (nearest) {
                            nearest.focus();
                        }
                    } else {
                        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                            let nextElement;
                            if (settings.arrowNavigationCycle) {
                                nextElement = focusableElements[index + 1] || focusableElements[0];
                            } else {
                                nextElement = focusableElements[index + 1] || false;
                            }
                            if (nextElement) {
                                nextElement.focus();
                            }
                        }
                        
                        // Go to the previous sublevel item
                        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                            let prevElement;
                            if (settings.arrowNavigationCycle) {
                                prevElement = focusableElements[index - 1] || focusableElements[focusableElements.length - 1];
                            } else {
                                prevElement = focusableElements[index - 1] || false;
                            }
                            if (prevElement) {
                                prevElement.focus();
                            }
                        }
                    }
                    
                    // Go to first item on home key
                    if (e.key === 'Home') {
                        focusableElements[0].focus();
                    }
                    
                    // Go to last item on end key
                    if (e.key === 'End') {
                        focusableElements[focusableElements.length - 1].focus();
                    }
                }
            });
        }
        
        // Click events
        // ============
        if (settings.openOnClick) {
            document.addEventListener('click', (e) => {
                const target = e.target;
                
                // Close the menu when clicking outside
                if (!target.closest('.' + settings.initiated_class)) {
                    const currentOpenSubNav = menu.querySelector('[aria-expanded="true"]');
                    if (currentOpenSubNav) {
                        closeSubNav(currentOpenSubNav);
                    }
                }
            });
        }
    }
    
    /**
     * Initialize Plugin
     * @public
     * @param {Object} options User settings
     */
    exports.init = function (options) {
        // feature test
        if (!supports) {
            document.documentElement.className += ' ' + settings.noresponsivemenuclass;
            return;
        }
        settings = extend(defaults, options || {}); // Merge user options with defaults
        initialize(settings);
    };
    
    // Public APIs
    return exports;
    
});
