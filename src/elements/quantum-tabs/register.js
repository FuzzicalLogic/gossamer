(function registerComponent() {

    Polymer({ is: 'quantum-tabs',
    // Component LifeCycle
        created: onElementCreated,
        attached: onElementAttached,
        ready: onElementReady,
        detached: onElementDetached,
    // Element Attributes
        hostAttributes: {
            role: "tablist",
        },
    // Component Properties
        properties: {
            listPosition: {
                type: String,
                value: "top",
                observer: "onPositionChanged",
                reflectToAtribute: true,
            },
            selectedIndex: {
                type: Number,
                value: 0,
                observer: "onTabIndexChanged",
                reflectToAttribute: true,
            },
            topics: {
                type: Array,
                notify: true,
                value: function() { return []; },
                //observer: "onTopicsChanged"
            },
            watcher: {
                type: Object,
                value: null,
                observer: "onWatcherChanged"
            }
        },
    // Component Methods
        next: focusNextTab,
        prev: focusPrevTab,
        select: focusTabByIndex,
    // Component Observers
        onPositionChanged: onTabListPositionChanged,
        onTopicsChanged: function() {
            //console.log('Topics Changed');

        },
        onTabIndexChanged: onSelectedTabChanged,
        onWatcherChanged: onWatcherChanged
    });

// -----------------------------------------------------------------------------
//  ELEMENT LIFECYCLE FUNCTIONS
// -----------------------------------------------------------------------------
    function onElementCreated() {
        //this.async(attachListListeners);
        //this.async(attachListObserver);
    }

    function onElementReady() {
    }

    function onElementAttached() {
        this.addEventListener('click', onTabsClicked);
        //this.async(initializeTabs);
        initializeTabs.call(this);
    }

    function onElementDetached() {
        this.removeEventListener('click', onTabsClicked);
    }

// -----------------------------------------------------------------------------
//  ELEMENT PROPERTY OBSERVERS
// -----------------------------------------------------------------------------
    function onTopicsChanged(newValue, oldValue) {

    }

    function onSelectedTabChanged(newValue, oldValue) {
    // Clear the old Selected Tab
        var el = this.children.item(oldValue);
        if (el !== null && "undefined" !== typeof el) {
            el.tabIndex = -1;
            el.setAttribute('aria-selected', 'false');
        };
    }

    function onTabListPositionChanged(newValue, oldValue) {
        switch (newValue) {
        case "top":
        case "bottom":
        case "left":
        case "right":
            if (oldValue)
                Array.prototype.children.forEach(function(tab) {
                    resizeTabContent.call(tab, newValue, oldValue);
                });
            break;
        default:
            console.warn('Element <soft-tabs> only accepts list-position of:\n "top","left", "bottom", or "right".');
            this.listPosition = "top";
        }
    }

    function onWatcherChanged(newValue, oldValue) {
        if (oldValue instanceof MutationObserver)
            oldValue.disconnect();

        if (newValue instanceof MutationObserver)
            this.watcher.observe(this, {
                childList: true
            });
    }
// -----------------------------------------------------------------------------
//  ELEMENT METHOD FUNCTIONS
// -----------------------------------------------------------------------------
    function focusPrevTab() {
        var i = Array.prototype.indexOf.call(this.children, document.activeElement);
        i -= 1;
        if (i < 0)
            i = this.children.length - 1;

        this.children[i].focus();
    }

    function focusNextTab() {
        var i = Array.prototype.indexOf.call(this.children, document.activeElement);
        i += 1;
        if (i >= this.children.length)
            i = 0;

        this.children[i].focus();
    }

    function focusTabByIndex(index) {
        if (index > 0 && index < this.children.length)
            this.children[index].focus();
    }

    function focusTabByName() {

    }

    function focusTabContent(label) {
        if ("undefined" === typeof index) {

        }
    }

// -----------------------------------------------------------------------------
//  LOCAL DOCUMENT OBSERVERS
// -----------------------------------------------------------------------------
    function watchChildren(records) {
        records.forEach(eachRecords.bind(this));
    }

    function eachRecords(record) {
        if (record.type !== "childList") return;

        if (record.addedNodes.length)
            iterateAdditions.call(this, record.addedNodes);

        if (record.removedNodes.length)
            iterateRemovals.call(this, record.removedNodes);

    }

    function iterateAdditions(additions) {
        var v, k, n = additions.length;
        for (k = 0; k < n; k++) {
            v = additions[k];
            if (v.nodeType != 1)
                continue;
            eachAddition.call(this, v);
        }
    }

    function eachAddition(node) {
        var tab = node.firstElementChild;
        console.log(node);
    // Adds Switch and Expanded to only nodes that have a group
        if (label && label.nextElementSibling) {
            node.setAttribute('aria-expanded', "false");
            toggle = document.createElement('span');
            toggle.classList.add('Switch');
            Polymer.dom(label).appendChild(toggle);
        }
    }

    function clearTabIndex(node) {
        if (node !== document.activeElement);
            node.tabIndex = -1;
        Array.prototype.forEach.call(node.children, clearTabIndex);
    }

    function iterateRemovals(removals) {
        var v, k, n = removals.length;
        for (k = 0; k < n; k++) {
            v = removals[k];
            eachRemoval.call(this, v)
            //console.log('Removed: ' + v.nodeType);
            //console.log(v);
        }
    }

    function eachRemoval(node) {

    }

// -----------------------------------------------------------------------------
//  KEYBOARD LISTENER FUNCTIONS
// -----------------------------------------------------------------------------
    function onKeyUp(e) {
        var iTab = this.selectedIndex,
            elShiftTo = Polymer.dom(this).children[iTab];

        if (e.ctrlKey) {
            switch (e.which) {
            case 38:
                e.preventDefault();
                e.stopPropagation();
                if (document.activeElement !== elShiftTo)
                    elShiftTo.focus();
                break;
            case 40:
                e.preventDefault();
                e.stopPropagation();
                if (document.activeElement !== Polymer.dom(elShiftTo).children[1])
                    Polymer.dom(elShiftTo).children[1].focus();
                break;
            default:
                console.log(e);
            }
        }
    }

    function onTabKeyUp(e) {
        var listPos,
            parent = Polymer.dom(this).parentElement;
        if (!this.ctrlKey && !this.shiftKey && !this.altKey) {
            listPos = this.parentElement.listPosition;
            switch (e.which) {
            case 37:
                if (listPos === "top" || listPos === "bottom") {
                    e.preventDefault();
                    e.stopPropagation();
                    parent.prev();
                }
                break;
            case 38:
                if (listPos === "left" || listPos === "right") {
                    e.preventDefault();
                    e.stopPropagation();
                    parent.prev();
                }
                break;
            case 39:
                if (listPos === "top" || listPos === "bottom") {
                    e.preventDefault();
                    e.stopPropagation();
                    parent.next();
                }
                break;
            case 40:
                if (listPos === "left" || listPos === "right") {
                    e.preventDefault();
                    e.stopPropagation();
                    parent.next();
                }
                break;
            }
        }
    }

// -----------------------------------------------------------------------------
//  MOUSE LISTENER FUNCTIONS
// -----------------------------------------------------------------------------
    function onTabClicked(e) {
        //e.preventDefault();
        //e.stopPropagation();
        if (document.activeElement !== this)
            this.focus();
    }

    function onTabsClicked(event) {
        var i, tab;
        if (event.path) {
            i = event.path.indexOf(this);
            if (i > 0)
                tab = event.path[--i];

            tab.tabIndex = -1;
            tab.addEventListener('focus', onTabFocused);
            tab.focus();
        }
    }

// -----------------------------------------------------------------------------
//  FOCUS MANAGEMENT FUNCTIONS
// -----------------------------------------------------------------------------
    function onFocus() {
        this.tabIndex = -1;
        Polymer.dom(this).children[this.selectedIndex].focus();
    }

    function onBlurTab() {

    }

    function onTabFocused() {
        this.removeEventListener('focus', onTabFocused);
        var i = Array.prototype.indexOf.call(this.parentElement.children, this);

        resizeTabContent.call(this, this.parentElement.listPosition);

        if (this.tabIndex !== 0)
            this.tabIndex = 0;
        if (this.getAttribute('aria-selected') !== 'true')
            this.setAttribute('aria-selected', 'true');
        if (this.parentElement.selectedIndex !== i)
            this.parentElement.selectedIndex = i;
    }


// -----------------------------------------------------------------------------
//  PRIVATE HELPER FUNCTIONS
// -----------------------------------------------------------------------------
    function attachListListeners() {
        this.tabIndex = 0;
    // Mouse Listener
        this.addEventListener('click', onTabClicked.bind(this));
    // Keyboard Listeners
        this.addEventListener('keyup', onKeyUp.bind(this));

        this.addEventListener('focus', onFocus);
    }

    function attachListObserver() {
        this.watcher = new MutationObserver(watchChildren.bind(this));
    }

    function initializeTabs() {
        Array.prototype.forEach.call(Polymer.dom(this).children, initializeTab);
        if (Polymer.dom(this).children[0]) {
            Polymer.dom(this).children[0].tabIndex = 0;
            Polymer.dom(this).children[0].setAttribute('aria-selected', 'true');
        }
    }

    function initializeTab(tab) {
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-selected', 'false');

        tab.addEventListener('click', onTabClicked);
        tab.addEventListener('focus', onTabFocused);
        tab.addEventListener('keyup', onTabKeyUp);

        tab.tabIndex = -1;
        clearTabIndex(tab.children[0]);
        tab.children[1].tabIndex = -1;
        window.setTimeout(function() {
            resizeTabContent.call(tab, tab.parentElement.listPosition);
        });
    }

    function resizeTabContent(posList, old) {
        if (old)
            removeBorders(this, old);
        calculateBorders(this, posList);
    }

    function removeBorders(element, style) {
        element.children[1].style[style] = "";
    }

    function calculateBorders(element, style) {
        var label, dimension;

        Polymer.dom.flush();
        label = Polymer.dom(element).children[0];
        if (style === "top" || style === "bottom")
            dimension = label.offsetHeight + normalizeStyle(label, 'marginTop') + normalizeStyle(label, 'marginBottom');
        else if (style === "left" || style === "right")
            dimension = label.offsetWidth + normalizeStyle(label, 'marginLeft') + normalizeStyle(label, 'marginRight');

        Polymer.dom(element).children[1].style[style] = dimension + "px";
    }

    function normalizeStyle(element, style) {
        return Math.round(parseFloat(window.getComputedStyle(element)[style]));
    }

}) ();
