import Tab from '../Tab'
import Transitions from '../../helpers/Transitions'
import Colors from '../../helpers/Colors'

export default class Tabs {
  constructor () {
    const self = this
    
    // The timer for closing tabs system.
    this.timer = {
      canReset: false
    }
    this.cursor = {}
    this.dragData = {}
    this.transitions = []

    this.elements = {}

    this.elements.tabs = div({ className: 'tabs' }, app.rootElement)

    this.elements.bottomBorder = div({ className: 'tabs-bottom-border' }, this.elements.tabs)

    this.elements.handle = div({ className: 'tabs-handle' }, this.elements.tabs)

    this.elements.tabbar = div({ className: 'tabbar' }, this.elements.tabs)

    this.elements.addButton = div({ className: 'tabs-add-button' }, this.elements.tabbar)
    this.elements.addButton.addEventListener('click', (e) => {
      self.addTab()
    })

    window.addEventListener('resize', (e) => {
      self.setWidths(false)
      self.setPositions(false, false)
    })

    this.addTab()

    // Start the timer.
    this.timer.timer = setInterval(function () { // Invoke the function each 3 seconds.
      if (self.timer.canReset && self.timer.time === 3) { // If can calculate widths for all tabs.
        // Calculate widths and positions for all tabs.
        self.setWidths()
        self.setPositions()

        self.timer.canReset = false
      }
      self.timer.time += 1
    }, 1000)

    window.addEventListener('mouseup', function () {
      if (self.dragData.tab != null && !self.dragData.tab.pinned) {
        self.dragData.canDrag = false
        self.dragData.canDrag2 = false

        self.elements.addButton.css('display', 'block')

        self.setPositions()

        if (tabs[tabs.indexOf(self.dragData.tab) - 1] != null) {
          tabs[tabs.indexOf(self.dragData.tab) - 1].elements.rightSmallBorder.css('display', 'none')
        }
        if (tabs[tabs.indexOf(self.dragData.tab) + 1] != null) {
          tabs[tabs.indexOf(self.dragData.tab) + 1].elements.leftSmallBorder.css('display', 'none')
        }
        for (var i = 0; i < tabs.length; i++) {
          tabs[i].elements.leftSmallBorder.css('display', 'none')
        }
        removeEventListener('mousemove', self.onMouseMove)
      }
    })

    window.addEventListener('mousemove', function (e) {
      self.cursor.x = e.pageX
      self.cursor.y = e.pageY
      app.cursor.x = e.pageX
      app.cursor.y = e.pageY
    })

    currentWindow.on('maximize', (e) => {
      self.elements.handle.css({
        left: 0,
        top: 0,
        right: 0,
        height: '100%'
      })
    })

    currentWindow.on('unmaximize', (e) => {
      self.elements.handle.css({
        left: 4,
        top: 4,
        right: 4,
        height: 'calc(100% - 4px)'
      })
    })

    // Fixes #1 issue.
    // Custom mouseenter and mouseleave event.
    var previousTab = null
    setInterval(function () {
      let tab = self.getTabFromMousePoint(null, self.cursor.x, self.cursor.y)

      // Mouse leave.
      if (previousTab !== null && previousTab !== tab) {
        if (previousTab.hovered) {
          previousTab.hovered = false
          if (!previousTab.selected) {
            previousTab.appendTransition('background-color')
            previousTab.elements.tab.css('background-color', 'transparent')
            previousTab.elements.close.css({
              opacity: 0,
              transition: '0.2s opacity'
            })
            previousTab.setTitleMaxWidth(false)
          }
        }
      }

      // Mouse enter.
      if (tab != null) {
        if (!tab.hovered) {
          tab.hovered = true
          previousTab = tab
          if (!tab.selected) {
            let rgba = Colors.shadeColor(Colors.rgbToHex(self.elements.tabs.css('background-color')), 0.05)
            tab.appendTransition('background-color')

            tab.elements.tab.css('background-color', rgba)

            tab.timeoutHover = setTimeout(function () {
              clearTimeout(tab.timeoutHover)
              tab.removeTransition('background-color')
            }, tabsAnimationData.hoverDuration * 1000)

            tab.setTitleMaxWidth(true)

            if (!tab.pinned) {
              tab.elements.close.css({
                opacity: 1,
                transition: '0.2s opacity'
              })
            }
          }
        }
      }
    }, 1)
  }

  /** Events */

  /**
   * @event
   * @param {Event} e
   */
  onMouseMove = (e) => {
    let mouseDeltaX = e.pageX - this.dragData.mouseClickX
    const tab = this.dragData.tab
    const tabDiv = tab.elements.tab

    if (Math.abs(mouseDeltaX) > 10 || this.dragData.canDrag2) {
      this.dragData.canDrag2 = true

      if (this.dragData.canDrag && !this.dragData.tab.pinned && !this.dragData.tab.new) {
        tab.removeTransition('left')

        tab.setLeft(this.dragData.tabX + e.clientX - this.dragData.mouseClickX)

        if (tabDiv.getBoundingClientRect().left + tabDiv.offsetWidth > this.elements.tabbar.offsetWidth) {
          tab.setLeft(this.elements.tabbar.offsetWidth - tabDiv.offsetWidth)
        }
        if (tabDiv.getBoundingClientRect().left < this.elements.tabbar.getBoundingClientRect().left) {
          tab.setLeft(this.elements.tabbar.getBoundingClientRect().left)
        }

        this.dragData.tab.findTabToReplace(e.clientX)

        if (tabs.indexOf(this.dragData.tab) === tabs.length - 1) {
          this.elements.addButton.css('display', 'none')
        }

        if (tabs[tabs.indexOf(this.dragData.tab) - 1] != null) {
          tabs[tabs.indexOf(this.dragData.tab) - 1].elements.rightSmallBorder.css('display', 'block')
        }
        if (tabs[tabs.indexOf(this.dragData.tab) + 1] != null) {
          tabs[tabs.indexOf(this.dragData.tab) + 1].elements.leftSmallBorder.css('display', 'block')
        }
      }
    }
  }

  /**
   * Adds tab.
   * @param {Object} data 
   */
  addTab (data = defaultTabOptions) {
    let tab = new Tab(this)
  }

  /**
   * Selects given tab and deselects others.
   * @param {Tab} tab 
   */
  selectTab (tabToSelect) {
    tabs.forEach((tab) => {
      if (tab !== tabToSelect) {
        tab.deselect()
      }
    })
    tabToSelect.select()
  }

  /**
   * Gets widths for all tabs.
   * @return {Number}
   */
  getWidths () {
    let tabbarWidth = this.elements.tabbar.offsetWidth - this.elements.addButton.offsetWidth
    let tabWidth = (tabbarWidth / tabs.length)

    if (tabWidth > 190) {
      tabWidth = 190
    }

    return tabWidth
  }

  /**
   * Sets widths for all tabs.
   */
  setWidths (animation = true) {
    const width = this.getWidths()

    tabs.forEach((tab) => {
      if (animation) {
        tab.appendTransition('width')
      } else {
        tab.removeTransition('width')
      }

      tab.setWidth(width)
      tab.width = width

      tab.elements.icon.css('display', ((tab.selected) ? ((width < 48) ? 'none' : 'block') : 'block'))
    })
  }

  /**
   * Gets positions for all tabs.
   * @return {Object}
   */
  getPositions () {
    let positions = []
    let tempPosition = 0

    tabs.forEach((tab) => {
      positions.push(tempPosition)
      tempPosition += tab.width
    })

    let toReturn = {
      tabPositions: positions,
      addButtonPosition: tempPosition
    }

    return toReturn
  }

  /**
   * Sets positions for all tabs.
   */
  setPositions (animateTabs = true, animateAddButton = true) {
    const positions = this.getPositions()

    tabs.forEach((tab) => {
      if (!tab.blockLeftAnimation && animateTabs) {
        tab.appendTransition('left')
      } else {
        tab.removeTransition('left')
      }
      tab.setLeft(positions.tabPositions[tabs.indexOf(tab)])
    })

    this.setAddButtonAnimation(animateAddButton)
    this.elements.addButton.css('left', positions.addButtonPosition)
  } 

  /**
   * Sets add button animation.
   * @param {boolean} flag
   */
  setAddButtonAnimation = (flag) => {
    

    var transition = 'left ' + tabsAnimationData.positioningDuration + 's ' + tabsAnimationData.positioningEasing
    const addButton = this.elements.addButton

    if (addButton != null) {
      if (flag) {
        if (this.transitions.indexOf('left') !== -1) return
        addButton.style['-webkit-transition'] = Transitions.appendTransition(addButton.style['-webkit-transition'], transition)
        this.transitions.push('left')
      } else {
        if (this.transitions.indexOf('left') === -1) return
        addButton.style['-webkit-transition'] = Transitions.removeTransition(addButton.style['-webkit-transition'], transition)
        this.transitions.splice(this.transitions.indexOf('left'), 1)
      }
    }
  }

  /**
   * Gets tab from mouse x point.
   * @param {Tab} callingTab
   * @param {number} cursorX
   * @return {Tab}
   */
  getTabFromMouseX = (callingTab, xPos) => {
    tabs.forEach((tab) => {
      if (tab !== callingTab) {
        if (this.containsX(tab, xPos)) {
          if (!tab.locked) {
            return tab
          }
        }
      }
    })
    return null
  }

  /**
   * Checks if {Tab} contains mouse x position.
   * @param {Tab} tabToCheck
   * @param {number} xPos
   * @return {boolean}
   */
  containsX = (tabToCheck, xPos) => {
    var rect = tabToCheck.elements.tab.getBoundingClientRect()

    if (xPos >= rect.left && xPos <= rect.right) {
      return true
    }

    return false
  }

  /**
   * Gets tab from mouse x and y point.
   * @param {Tab} callingTab
   * @param {number} cursorX
   * @param {number} cursorY
   * @return {Tab}
   */
  getTabFromMousePoint = (callingTab, xPos, yPos) => {
    tabs.forEach((tab) => {
      if (tab !== callingTab) {
        if (this.containsPoint(tab, xPos, yPos)) {
          if (!tab.locked) {
            return tab
          }
        }
      }
    })
    return null
  }

  /**
   * Checks if {Tab} contains mouse x and y position.
   * @param {Tab} tabToCheck
   * @param {number} xPos
   * @param {number} yPos
   * @return {boolean}
   */
  containsPoint = (tabToCheck, xPos, yPos) => {
    var rect = tabToCheck.elements.tab.getBoundingClientRect()

    if (xPos >= rect.left && xPos <= rect.right && yPos <= rect.bottom) {
      return true
    }

    return false
  }

  /**
   * Replaces tabs.
   * @param {number} firstIndex
   * @param {number} secondIndex
   * @param {boolean} changePos
   */
  replaceTabs = (firstIndex, secondIndex, changePos = true) => {
    var firstTab = tabs[firstIndex]
    var secondTab = tabs[secondIndex]

    // Replace tabs in array.
    tabs[firstIndex] = secondTab
    tabs[secondIndex] = firstTab

    // Don't show left small border of replaced tab when the tab is first.
    firstTab.elements.leftSmallBorder.css('display', (tabs.indexOf(firstTab) === 0) ? 'none' : 'block')

    // Change positions of replaced tabs.
    if (changePos) {
      secondTab.updatePosition()
    }
  }

  /**
   * Updates tabs' state (borders etc).
   */
  updateTabs = () => {
    tabs.forEach((tab) => {
      if (!tab.selected) {
        tab.elements.rightSmallBorder.css('display', 'block')
      }
      tab.elements.leftSmallBorder.css('display', 'none')
    })
  }

  /**
   * Gets selected tab.
   * @return {Tab}
   */
  getSelectedTab = () => {
    tabs.forEach((tab) => {
      if (tab.selected) {
        return tabs[i]
      }
    })
    return null
  }
}