Vanilla JS Responsive Menu
==========================

A vanilla JS responsive menu plugin.

Dependencies
------------
Apollo JS | https://github.com/toddmotto/apollo
Load apollo first

Features
========

* Accessible friendly
* compressed 4kb
* Regular menu on older browsers / when JS is disable/broken
* 

Demo
====

* http://www.cssscript.com/demo/responsive-multilevel-navigation-menu-with-vanilla-javascript/

Known issues
============

* Only one menu per page
* On IE6/7 you only get the first layer of menu because pure suckerfisch css menu doesn't work. Add custom JS if you want this to work as well.

Use
===

To make sure that menu items don't show for a split second on mobile sized screens add the following:

```
<body class="no-js">
<script type="text/javascript">function hasClass(e,t){return e.className.match(new RegExp("(\\s|^)"+t+"(\\s|$)"))}var el=document.body;var cl="no-js";if(hasClass(el,cl)){var reg=new RegExp("(\\s|^)"+cl+"(\\s|$)");el.className=el.className.replace(reg," js-enabled")}</script>
```

Basic markup:

```
<div class="navigation_container">
    <ul class="rm-closed">
        <li><a href="#">Item</a></li>
    </ul>
</div>
```

*Note:* three things are important here:

1.  make sure you have a wrapper around the menu with the "navigation_container" class. When changed also change this in the CSS (or SCSS) file
2.  Add a `rm-closed` class to the `menu` setting element (see below). Default is the first `<ul>`. This is the same class as the `hideclass` option (see below) so if you change that also change in CSS file
3.  Use an unordered list as your menu

*Tips:*

1.  Add an "active" or "current" class to the active `<li>` element to make sure the sub-items show correctly when JS disabled/broken
2.  Add a "parent" class to the parent `<li>` to show that an item has children (you still need to style that)

Place following on the bottom of your document:

```
<script type="text/javascript">
    responsivemenu.init({
        wrapper: document.querySelector('.navigation_container')
    });
</script>
```

Options
=======

###wrapper

The container that wraps the menu

default: document.getElementsByTagName('nav')[0],

###menu

The hiding container. Either your `<ul>` or some surrounding element

default: First found `<ul>` within the wrapper

###initiated_class

The class to attach to the wrapper when menu is initiated

default: 'rm-initiated',

###before_element

The element where the toggle button will be put before

default: The first child of the wrapper element

###toggletype

HTML element of the main toggle button

default: 'button',

###toggleclass

The class of the main toggle button

default: 'rm-togglebutton',

###togglecontent

The value / text / html on the main toggle button

default: 'menu',

###subtoggletype

HTML element of the sub toggle buttons

default: 'button',

###subtoggleclass

The class of the sub toggle buttons

default: 'rm-subtoggle',

###subtogglecontent

The value / text / html on the sub toggle buttons

default: '+',

###sticky

Use a sticky menu?

default: 0,

###absolute

Make the toggling menu absolute positioned

default: 0,

###hideclass

The class to add to elements that need to be hidden. Hiding happens with CSS

default: 'rm-closed',

###width

The window width when menu has to become a full menu. You might need to change CSS as well when changing this value

default: 600

###todo: add all settings

For now see the JS file for all the settings.
