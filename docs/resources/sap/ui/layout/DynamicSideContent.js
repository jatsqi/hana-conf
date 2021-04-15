/*!
 * OpenUI5
 * (c) Copyright 2009-2021 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(
    [
        "sap/ui/thirdparty/jquery",
        "sap/ui/core/Control",
        "sap/ui/core/ResizeHandler",
        "sap/ui/core/delegate/ScrollEnablement",
        "sap/ui/layout/library",
        "./DynamicSideContentRenderer"
    ],
    function (t, e, i, s, n, r) {
        "use strict"
        var o = n.SideContentPosition
        var a = n.SideContentFallDown
        var h = n.SideContentVisibility
        var l = e.extend("sap.ui.layout.DynamicSideContent", {
            metadata: {
                library: "sap.ui.layout",
                properties: {
                    showSideContent: {
                        type: "boolean",
                        group: "Appearance",
                        defaultValue: true
                    },
                    showMainContent: {
                        type: "boolean",
                        group: "Appearance",
                        defaultValue: true
                    },
                    sideContentVisibility: {
                        type: "sap.ui.layout.SideContentVisibility",
                        group: "Appearance",
                        defaultValue: h.ShowAboveS
                    },
                    sideContentFallDown: {
                        type: "sap.ui.layout.SideContentFallDown",
                        group: "Appearance",
                        defaultValue: a.OnMinimumWidth
                    },
                    equalSplit: {
                        type: "boolean",
                        group: "Appearance",
                        defaultValue: false
                    },
                    containerQuery: {
                        type: "boolean",
                        group: "Behavior",
                        defaultValue: false
                    },
                    sideContentPosition: {
                        type: "sap.ui.layout.SideContentPosition",
                        group: "Appearance",
                        defaultValue: o.End
                    },
                    mcSpan: {
                        type: "int",
                        defaultValue: 0,
                        visibility: "hidden"
                    },
                    scSpan: {
                        type: "int",
                        defaultValue: 0,
                        visibility: "hidden"
                    }
                },
                defaultAggregation: "mainContent",
                events: {
                    breakpointChanged: {
                        parameters: { currentBreakpoint: { type: "string" } }
                    }
                },
                aggregations: {
                    mainContent: {
                        type: "sap.ui.core.Control",
                        multiple: true
                    },
                    sideContent: { type: "sap.ui.core.Control", multiple: true }
                },
                designTime:
                    "sap/ui/layout/designtime/DynamicSideContent.designtime",
                dnd: { draggable: false, droppable: true }
            }
        })
        var d = "S",
            p = "M",
            u = "L",
            C = "XL",
            S = "sapUiHidden",
            _ = "sapUiDSCSpan12",
            c = "sapUiDSCMCFixed",
            g = "sapUiDSCSCFixed",
            f = 3,
            y = 4,
            b = 6,
            w = 8,
            V = 9,
            M = 12,
            m = "Invalid Breakpoint. Expected: S, M, L or XL",
            k = "SCGridCell",
            B = "MCGridCell",
            P = 720,
            v = 1024,
            z = 1440
        l.prototype.setSideContentVisibility = function (t, e) {
            this.setProperty("sideContentVisibility", t, true)
            if (!e && this.$().length) {
                this._setResizeData(this.getCurrentBreakpoint())
                this._changeGridState()
            }
            return this
        }
        l.prototype.setShowSideContent = function (t, e) {
            if (t === this.getShowSideContent()) {
                return this
            }
            this.setProperty("showSideContent", t, true)
            this._SCVisible = t
            if (!e && this.$().length) {
                this._setResizeData(
                    this.getCurrentBreakpoint(),
                    this.getEqualSplit()
                )
                if (this._currentBreakpoint === d) {
                    this._MCVisible = true
                }
                this._changeGridState()
            }
            return this
        }
        l.prototype.setShowMainContent = function (t, e) {
            if (t === this.getShowMainContent()) {
                return this
            }
            this.setProperty("showMainContent", t, true)
            this._MCVisible = t
            if (!e && this.$().length) {
                this._setResizeData(
                    this.getCurrentBreakpoint(),
                    this.getEqualSplit()
                )
                if (this._currentBreakpoint === d) {
                    this._SCVisible = true
                }
                this._changeGridState()
            }
            return this
        }
        l.prototype.isSideContentVisible = function () {
            if (this._currentBreakpoint === d) {
                return this._SCVisible && this.getProperty("showSideContent")
            } else {
                return this.getProperty("showSideContent")
            }
        }
        l.prototype.isMainContentVisible = function () {
            if (this._currentBreakpoint === d) {
                return this._MCVisible && this.getProperty("showMainContent")
            } else {
                return this.getProperty("showMainContent")
            }
        }
        l.prototype.setEqualSplit = function (t) {
            this._MCVisible = true
            this._SCVisible = true
            this.setProperty("equalSplit", t, true)
            if (this._currentBreakpoint) {
                this._setResizeData(this._currentBreakpoint, t)
                this._changeGridState()
            }
            return this
        }
        l.prototype.addSideContent = function (t) {
            this.addAggregation("sideContent", t, true)
            this._rerenderControl(this.getAggregation("sideContent"), this.$(k))
            return this
        }
        l.prototype.addMainContent = function (t) {
            this.addAggregation("mainContent", t, true)
            this._rerenderControl(this.getAggregation("mainContent"), this.$(B))
            return this
        }
        l.prototype.toggle = function () {
            if (this._currentBreakpoint === d) {
                if (!this.getProperty("showMainContent")) {
                    this.setShowMainContent(true, true)
                    this._MCVisible = false
                }
                if (!this.getProperty("showSideContent")) {
                    this.setShowSideContent(true, true)
                    this._SCVisible = false
                }
                if (this._MCVisible && !this._SCVisible) {
                    this._SCVisible = true
                    this._MCVisible = false
                } else if (!this._MCVisible && this._SCVisible) {
                    this._MCVisible = true
                    this._SCVisible = false
                }
                this._changeGridState()
            }
            return this
        }
        l.prototype.getCurrentBreakpoint = function () {
            return this._currentBreakpoint
        }
        l.prototype.onBeforeRendering = function () {
            this._bSuppressInitialFireBreakPointChange = true
            this._detachContainerResizeListener()
            this._SCVisible =
                this._SCVisible === undefined
                    ? this.getProperty("showSideContent")
                    : this._SCVisible
            this._MCVisible =
                this._MCVisible === undefined
                    ? this.getProperty("showMainContent")
                    : this._MCVisible
            if (!this.getContainerQuery()) {
                this._iWindowWidth = t(window).width()
                this._setBreakpointFromWidth(this._iWindowWidth)
                this._setResizeData(
                    this._currentBreakpoint,
                    this.getEqualSplit()
                )
            }
        }
        l.prototype.onAfterRendering = function () {
            if (this.getContainerQuery()) {
                this._attachContainerResizeListener()
                this._adjustToScreenSize()
            } else {
                var e = this
                t(window).on("resize", function () {
                    e._adjustToScreenSize()
                })
            }
            this._changeGridState()
            this._initScrolling()
        }
        l.prototype.onThemeChanged = function () {
            if (this.getContainerQuery()) {
                this._adjustToScreenSize()
            }
        }
        l.prototype.exit = function () {
            this._detachContainerResizeListener()
            if (this._oSCScroller) {
                this._oSCScroller.destroy()
                this._oSCScroller = null
            }
            if (this._oMCScroller) {
                this._oMCScroller.destroy()
                this._oMCScroller = null
            }
        }
        l.prototype.getScrollDelegate = function (t) {
            var e = t,
                i = this.getParent(),
                s = this._getBreakPointFromWidth(),
                n = this.getShowMainContent() && this._MCVisible,
                r = this.getShowSideContent() && this._SCVisible
            if (s && s !== u && s !== C) {
                if (
                    e &&
                    ((e.sParentAggregationName === "sideContent" && !r) ||
                        (e.sParentAggregationName === "mainContent" && !n))
                ) {
                    return
                } else {
                    while (
                        i &&
                        (!i.getScrollDelegate || !i.getScrollDelegate())
                    ) {
                        i = i.getParent()
                    }
                    return i.getScrollDelegate()
                }
            }
            if (this._oMCScroller && this._oSCScroller) {
                while (e && e.getId() !== this.getId()) {
                    if (e.sParentAggregationName === "mainContent" && n) {
                        return this._oMCScroller
                    }
                    if (e.sParentAggregationName === "sideContent" && r) {
                        return this._oSCScroller
                    }
                    e = e.getParent()
                }
            }
            return
        }
        l.prototype._rerenderControl = function (t, e) {
            if (this.getDomRef()) {
                var i = sap.ui.getCore().createRenderManager()
                this.getRenderer().renderControls(i, t)
                i.flush(e[0])
                i.destroy()
            }
            return this
        }
        l.prototype._initScrolling = function () {
            var t = this.getId(),
                e = t + "-" + k,
                i = t + "-" + B
            if (!this._oSCScroller && !this._oMCScroller) {
                var s = sap.ui.requireSync(
                    "sap/ui/core/delegate/ScrollEnablement"
                )
                this._oSCScroller = new s(this, null, {
                    scrollContainerId: e,
                    horizontal: false,
                    vertical: true
                })
                this._oMCScroller = new s(this, null, {
                    scrollContainerId: i,
                    horizontal: false,
                    vertical: true
                })
            }
        }
        l.prototype._attachContainerResizeListener = function () {
            setTimeout(
                function () {
                    this._sContainerResizeListener = i.register(
                        this,
                        this._adjustToScreenSize.bind(this)
                    )
                }.bind(this),
                0
            )
        }
        l.prototype._detachContainerResizeListener = function () {
            if (this._sContainerResizeListener) {
                i.deregister(this._sContainerResizeListener)
                this._sContainerResizeListener = null
            }
        }
        l.prototype._getBreakPointFromWidth = function (t) {
            if (t <= P && this._currentBreakpoint !== d) {
                return d
            } else if (t > P && t <= v && this._currentBreakpoint !== p) {
                return p
            } else if (t > v && t <= z && this._currentBreakpoint !== u) {
                return u
            } else if (t > z && this._currentBreakpoint !== C) {
                return C
            }
            return this._currentBreakpoint
        }
        l.prototype._setBreakpointFromWidth = function (t) {
            this._currentBreakpoint = this._getBreakPointFromWidth(t)
            if (this._bSuppressInitialFireBreakPointChange) {
                this._bSuppressInitialFireBreakPointChange = false
            } else {
                this.fireBreakpointChanged({
                    currentBreakpoint: this._currentBreakpoint
                })
            }
        }
        l.prototype._adjustToScreenSize = function () {
            if (this.getContainerQuery()) {
                this._iWindowWidth = this.$().parent().width()
            } else {
                this._iWindowWidth = t(window).width()
            }
            this._currentBreakpoint = this._getBreakPointFromWidth(
                this._iWindowWidth
            )
            this._setResizeData(this._currentBreakpoint, this.getEqualSplit())
            this._changeGridState()
            this._setBreakpointFromWidth(this._iWindowWidth)
        }
        l.prototype._setResizeData = function (t, e) {
            var i = this.getSideContentVisibility(),
                s = this.getSideContentFallDown()
            if (!e) {
                switch (t) {
                    case d:
                        this._setSpanSize(M, M)
                        if (
                            this.getProperty("showSideContent") &&
                            this.getProperty("showMainContent") &&
                            this._MCVisible
                        ) {
                            this._SCVisible = i === h.AlwaysShow
                        }
                        this._bFixedSideContent = false
                        break
                    case p:
                        var n = Math.ceil((33.333 / 100) * this._iWindowWidth)
                        if (
                            s === a.BelowL ||
                            s === a.BelowXL ||
                            (n <= 320 && s === a.OnMinimumWidth)
                        ) {
                            this._setSpanSize(M, M)
                            this._bFixedSideContent = false
                        } else {
                            this._setSpanSize(y, w)
                            this._bFixedSideContent = true
                        }
                        this._SCVisible =
                            i === h.ShowAboveS || i === h.AlwaysShow
                        this._MCVisible = true
                        break
                    case u:
                        if (s === a.BelowXL) {
                            this._setSpanSize(M, M)
                        } else {
                            this._setSpanSize(y, w)
                        }
                        this._SCVisible =
                            i === h.ShowAboveS ||
                            i === h.ShowAboveM ||
                            i === h.AlwaysShow
                        this._MCVisible = true
                        this._bFixedSideContent = false
                        break
                    case C:
                        this._setSpanSize(f, V)
                        this._SCVisible = i !== h.NeverShow
                        this._MCVisible = true
                        this._bFixedSideContent = false
                        break
                    default:
                        throw new Error(m)
                }
            } else {
                switch (t) {
                    case d:
                        this._setSpanSize(M, M)
                        this._SCVisible = false
                        break
                    default:
                        this._setSpanSize(b, b)
                        this._SCVisible = true
                        this._MCVisible = true
                }
                this._bFixedSideContent = false
            }
            return this
        }
        l.prototype._shouldSetHeight = function () {
            var t, e, i, s, n, r, o
            t = this.getProperty("scSpan") + this.getProperty("mcSpan") === M
            e = this._MCVisible && this._SCVisible
            i = !this._MCVisible && this._SCVisible
            s = this._MCVisible && !this._SCVisible
            n = i || s
            r = this._fixedSideContent
            o = this.getSideContentVisibility() === h.NeverShow
            return (t && e) || n || r || o
        }
        l.prototype._changeGridState = function () {
            var t = this.$(k),
                e = this.$(B),
                i = this.getProperty("showMainContent"),
                s = this.getProperty("showSideContent")
            if (this._bFixedSideContent) {
                t.removeClass().addClass(g)
                e.removeClass().addClass(c)
            } else {
                t.removeClass(g)
                e.removeClass(c)
            }
            if (this._SCVisible && this._MCVisible && s && i) {
                if (!this._bFixedSideContent) {
                    e.removeClass().addClass(
                        "sapUiDSCSpan" + this.getProperty("mcSpan")
                    )
                    t.removeClass().addClass(
                        "sapUiDSCSpan" + this.getProperty("scSpan")
                    )
                }
                if (this._shouldSetHeight()) {
                    t.css("height", "100%").css("float", "left")
                    e.css("height", "100%").css("float", "left")
                } else {
                    t.css("height", "auto").css("float", "none")
                    e.css("height", "auto").css("float", "none")
                }
            } else if (!this._SCVisible && !this._MCVisible) {
                e.addClass(S)
                t.addClass(S)
            } else if (this._MCVisible && i) {
                e.removeClass().addClass(_)
                t.addClass(S)
            } else if (this._SCVisible && s) {
                t.removeClass().addClass(_)
                e.addClass(S)
            } else if (!i && !s) {
                e.addClass(S)
                t.addClass(S)
            }
            e.addClass("sapUiDSCM")
            t.addClass("sapUiDSCS")
        }
        l.prototype._setSpanSize = function (t, e) {
            this.setProperty("scSpan", t)
            this.setProperty("mcSpan", e)
        }
        return l
    }
)
