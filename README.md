Vanilla JS Responsive Menu
==========================

A vanilla JS responsive menu plugin. Mobile first, accessible, customizable

#### Demo
* https://robinpoort.github.io/vanilla-js-responsive-menu/

Features
========

* Accessible friendly
* compressed 4kb
* Regular menu on older browsers or when JS is disabled / broken

Use
===

To make sure that menu items don't show for a split second on mobile sized screens add the following (or just use [Modernizr](https://modernizr.com/)):

```
<body class="no-js">
<script type="text/javascript">function hasClass(e,t){return e.className.match(new RegExp("(\\s|^)"+t+"(\\s|$)"))}var el=document.body;var cl="no-js";if(hasClass(el,cl)){var reg=new RegExp("(\\s|^)"+cl+"(\\s|$)");el.className=el.className.replace(reg," js")}</script>
```

Basic markup:

```
<div class="navigation_container">
    <ul>
        <li><a href="#">Item</a></li>
    </ul>
</div>
```

*Note:* two things are important here:

1.  make sure you have a wrapper around the menu with the "navigation_container" class. When changed also change this in the CSS (or SCSS, can be done by using variables) file
2.  Use an unordered list as your menu

*Tips:*

1.  Add an "active" or "current" class to the active `<li>` element to make sure the sub-items show correctly when JS disabled/broken

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

### menu

The 'hiding' container. Either your `<ul>` or some surrounding element

default: First found `<ul>` within the wrapper

### initiated_class

The class to attach to the wrapper when menu is initiated

default: 'rm-initiated'

### before_element

The element where the toggle button will be put before

default: The first child of the wrapper element

### toggletype

HTML element of the main toggle button

default: 'button'

### toggleclass

The class of the main toggle button

default: 'rm-togglebutton'

### togglecontent

The value / text / html on the main toggle button

default: 'menu'

### subtoggletype

HTML element of the sub toggle buttons

default: 'button'

### subtoggleclass

The class of the sub toggle buttons

default: 'rm-subtoggle'

### subtogglecontent

The value / text / html on the sub toggle buttons

default: '+'

### sticky

Use a sticky menu?

default: false

### absolute

Make the toggling menu absolute positioned

default: false

### hideclass

The class to add to elements that need to be hidden. Hiding happens with CSS

default: 'rm-closed'

### openclass

The class to add to elements that need to be displayed. Displaying happens with CSS

default: 'rm-opened'

### openbodyclass

Class that gets toggled to the `<body>` element when using the main toggle

default: 'has-opened-menu'

### focusedclass

The class used for accessibility

default: 'rm-focused'

### animateopenclass

Class that gets added when opening the menu. All animations should be done manually by using CSS

default: 'is-opening'

### animatecloseclass

Class that gets added when closing the menu. All animations should be done manually by using CSS

default: 'is-closing'

### animateduration

Duration of the main toggle. Should be the same as CSS animation / transition

default: 0

### subanimateopenclass

Class that gets added when opening sub menu items. All animations should be done manually by using CSS

default: 'is-opening'

### subanimatecloseclass

Class that gets added when closing sub menu items. All animations should be done manually by using CSS

default: 'is-closing'

### subanimateduration

Duration of the main toggle. Should be the same as CSS animation / transition

default: 0

### parentclass

Class that gets added to parent `<li>` items

default: 'rm-parent'

### fullmenuclass

Class that gets added when the menu is not the mobile menu but the collapsed full width menu (desktop)

default: 'rm-fullmenu'

### absolutemenuclass

Absolute menu class (only used when 'absolute' setting is being used)

default: 'rm-absolutemenu'

### bodyoverflowhiddenclass

Class to add to body when menu is overflowing (only used when 'fixed' setting is being used)

default: 'rm-bodyoverflowhidden'

### menuoverflowautoclass

Class to add to the wrapper viewportheight is larger than menuheight (only used when 'fixed' setting is being used)

default: 'rm-menuoverflowauto'

### stickyclass

Fixed menu class (only used when 'fixed' setting is being used)

default: 'rm-sticky'

### stickyinitiatedclass

Sticky initiated class (only used when 'fixed' setting is being used)

default: 'rm-sticky-initiated'

### noresponsivemenuclass

Class added to the body when feature test fails. This can be used to ceate additional styling / javascript

default: 'rm-no-responsive-menu'

### mobileindicatorid

The id of the element that indicates wether the menu is mobile or not

default: 'rm-mobile-indicator'

## Events

### onAfterInit: function() {}
### onBeforeToggleOpen: function() {}
### onAfterToggleOpen: function() {}
### onBeforeToggleClose: function() {}
### onAfterToggleClose: function() {}
### onBeforeSubToggleOpen: function() {}
### onAfterSubToggleOpen: function() {}
### onBeforeSubToggleClose: function() {}
### onAfterSubToggleClose: function() {}
