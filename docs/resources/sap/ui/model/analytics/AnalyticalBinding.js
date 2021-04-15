/*!
 * OpenUI5
 * (c) Copyright 2009-2021 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(
    [
        "sap/ui/model/TreeBinding",
        "sap/ui/model/ChangeReason",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/ui/model/FilterProcessor",
        "sap/ui/model/FilterType",
        "sap/ui/model/Sorter",
        "sap/ui/model/odata/CountMode",
        "sap/ui/model/TreeAutoExpandMode",
        "./odata4analytics",
        "./BatchResponseCollector",
        "./AnalyticalVersionInfo",
        "sap/base/util/isEmptyObject",
        "sap/base/util/uid",
        "sap/ui/thirdparty/jquery",
        "sap/base/Log"
    ],
    function (e, t, i, r, s, n, a, o, u, l, d, h, p, f, g, y) {
        "use strict"
        var c = "sap.ui.model.analytics.AnalyticalBinding",
            v = y.getLogger(c)
        function m(e) {
            var t = new l.QueryResultRequest(e.oAnalyticalQueryResult),
                i,
                r,
                s,
                n,
                a,
                o,
                u,
                d,
                h = e.mParameters.select.split(","),
                p = R(h, e.sPath)
            t.setAggregationLevel(e.aMaxAggregationLevel)
            t.setMeasures(e.aMeasureName)
            Object.keys(e.oDimensionDetailsSet).forEach(function (i) {
                s = e.oDimensionDetailsSet[i]
                t.includeDimensionKeyTextAttributes(
                    i,
                    true,
                    s.textPropertyName !== undefined,
                    s.aAttributeName
                )
            })
            Object.keys(e.oMeasureDetailsSet).forEach(function (i) {
                o = e.oMeasureDetailsSet[i]
                t.includeMeasureRawFormattedValueUnit(
                    i,
                    o.rawValuePropertyName !== undefined,
                    o.formattedValuePropertyName !== undefined,
                    o.unitPropertyName !== undefined
                )
            })
            r = t.getURIQueryOptionValue("$select")
            if (r) {
                i = r.split(",")
                for (n = 0, u = i.length; n < u; n++) {
                    d = i[n]
                    a = h.indexOf(d)
                    if (a < 0) {
                        v.warning(
                            "Ignored the 'select' binding parameter, because" +
                                " it does not contain the property '" +
                                d +
                                "'",
                            e.sPath
                        )
                        p = true
                    } else {
                        h.splice(a, 1)
                    }
                }
            }
            for (n = 0, u = h.length; n < u; n++) {
                d = h[n]
                s = e.oAnalyticalQueryResult.findDimensionByPropertyName(d)
                if (s && e.oDimensionDetailsSet[s.getName()] === undefined) {
                    _(e.sPath, d, s)
                    p = true
                }
                o = e.oAnalyticalQueryResult.findMeasureByPropertyName(d)
                if (o && e.oMeasureDetailsSet[o.getName()] === undefined) {
                    _(e.sPath, d, o)
                    p = true
                }
            }
            return p ? [] : h
        }
        function _(e, t, i) {
            var r =
                i instanceof sap.ui.model.analytics.odata4analytics.Dimension
                    ? "dimension"
                    : "measure"
            if (i.getName() === t) {
                v.warning(
                    "Ignored the 'select' binding parameter, because it contains" +
                        " the " +
                        r +
                        " property '" +
                        t +
                        "' which is not contained in the analytical info (see updateAnalyticalInfo)",
                    e
                )
            } else {
                v.warning(
                    "Ignored the 'select' binding parameter, because the property '" +
                        t +
                        "' is associated with the " +
                        r +
                        " property '" +
                        i.getName() +
                        "' which is not contained in the analytical" +
                        " info (see updateAnalyticalInfo)",
                    e
                )
            }
        }
        function R(e, t) {
            var i,
                r = false,
                s,
                n
            for (s = 0, n = e.length; s < n; s++) {
                e[s] = e[s].trim()
            }
            for (s = e.length - 1; s >= 0; s--) {
                i = e[s]
                if (e.indexOf(i) !== s) {
                    v.warning(
                        "Ignored the 'select' binding parameter, because it" +
                            " contains the property '" +
                            i +
                            "' multiple times",
                        t
                    )
                    e.splice(s, 1)
                    r = true
                }
            }
            return r
        }
        var I = e.extend("sap.ui.model.analytics.AnalyticalBinding", {
            constructor: function (t, i, r, s, n, a) {
                e.call(this, t, i, r, n, a)
                this.aAdditionalSelects = []
                this.sEntitySetName = a && a.entitySet ? a.entitySet : undefined
                this.bArtificalRootContext = false
                this.aApplicationFilter = this._convertDeprecatedFilterObjects(
                    n
                )
                this.aControlFilter = undefined
                this.aSorter = s ? s : []
                this.aMaxAggregationLevel = []
                this.aAggregationLevel = []
                this.oPendingRequests = {}
                this.oPendingRequestHandle = []
                this.oGroupedRequests = {}
                this.bUseBatchRequests =
                    a && a.useBatchRequests === true ? true : false
                this.bProvideTotalSize =
                    a && a.provideTotalResultSize === false ? false : true
                this.bProvideGrandTotals =
                    a && a.provideGrandTotals === false ? false : true
                this.bReloadSingleUnitMeasures =
                    a && a.reloadSingleUnitMeasures === false ? false : true
                this.bUseAcceleratedAutoExpand =
                    a && a.useAcceleratedAutoExpand === false ? false : true
                this.bNoPaging = a && a.noPaging === true ? true : false
                this.iTotalSize = -1
                this.mServiceKey = {}
                this.mServiceLength = {}
                this.mServiceFinalLength = {}
                this.mKeyIndex = {}
                this.mFinalLength = this.mServiceFinalLength
                this.mLength = {}
                this.mMultiUnitKey = {}
                this.aMultiUnitLoadFactor = {}
                this.bNeedsUpdate = false
                this.bApplySortersToGroups = true
                this.sLastAutoExpandMode = undefined
                this.mEntityKey = {}
                this.sCustomParams = this.oModel.createCustomParams({
                    custom: this.mParameters.custom
                })
                this.oAnalyticalQueryResult = null
                this.aAnalyticalInfo = []
                this.mAnalyticalInfoByProperty = {}
                this.aBatchRequestQueue = []
                if (a && a.countMode == o.None) {
                    v.fatal(
                        "requested count mode is ignored; OData requests will include $inlinecout options"
                    )
                } else if (
                    a &&
                    (a.countMode == o.Request || a.countMode == o.Both)
                ) {
                    v.warning(
                        "default count mode is ignored; OData requests will include $inlinecout options"
                    )
                } else if (this.oModel.sDefaultCountMode == o.Request) {
                    v.warning(
                        "default count mode is ignored; OData requests will include $inlinecout options"
                    )
                }
                this.iModelVersion = h.getVersion(this.oModel)
                if (this.iModelVersion === null) {
                    v.error(
                        "The AnalyticalBinding does not support Models other than sap.ui.model.odata.ODataModel version 1 or 2."
                    )
                    return
                }
                this.aAllDimensionSortedByName = null
                this.aInitialAnalyticalInfo =
                    a == undefined ? [] : a.analyticalInfo
                this.bInitial = true
            }
        })
        function M(e, t) {
            return function () {
                if (!e.__supportUID) {
                    e.__supportUID = f()
                }
                return {
                    type: c,
                    analyticalError: t,
                    analyticalBindingId: e.__supportUID
                }
            }
        }
        I.prototype.setContext = function (e) {
            var i
            if (this.oContext !== e) {
                this.oContext = e
                if (!this.isRelative()) {
                    return
                }
                this.oDataState = null
                this.bApplySortersToGroups = true
                this.iTotalSize = -1
                this._abortAllPendingRequests()
                i = this.getResolvedPath()
                if (i) {
                    this.resetData()
                    this._initialize()
                    this._fireChange({ reason: t.Context })
                } else {
                    this.bInitial = true
                }
            }
        }
        I.prototype.initialize = function () {
            if (
                this.oModel.oMetadata &&
                this.oModel.oMetadata.isLoaded() &&
                this.isInitial()
            ) {
                var e = this.isRelative()
                if (!e || (e && this.oContext)) {
                    this._initialize()
                }
                this._fireRefresh({ reason: t.Refresh })
            }
            return this
        }
        I.prototype._initialize = function () {
            if (this.oModel.oMetadata && this.oModel.oMetadata.isLoaded()) {
                this.bInitial = false
                this.oAnalyticalQueryResult = this.oModel
                    .getAnalyticalExtensions()
                    .findQueryResultByName(this._getEntitySet())
                if (!this.oAnalyticalQueryResult) {
                    throw (
                        "Error in AnalyticalBinding - The QueryResult '" +
                        this._getEntitySet() +
                        "' could not be retrieved. Please check your service definition."
                    )
                }
                this.updateAnalyticalInfo(this.aInitialAnalyticalInfo)
                this.aAllDimensionSortedByName = this.oAnalyticalQueryResult
                    .getAllDimensionNames()
                    .concat([])
                    .sort()
                this._fireRefresh({ reason: t.Refresh })
            }
        }
        I.prototype.getRootContexts = function (e) {
            if (this.isInitial()) {
                return []
            }
            var t =
                e && e.numberOfExpandedLevels ? e.numberOfExpandedLevels + 1 : 1
            var i = null
            var r = this._getRequestId(I._requestType.groupMembersQuery, {
                groupId: null
            })
            if (
                this.bArtificalRootContext &&
                !this._cleanupGroupingForCompletedRequest(r)
            ) {
                return i
            }
            i = this._getContextsForParentContext(null)
            if (i.length == 1) {
                return i
            }
            if (t <= 1) {
                if (t == 1) {
                    this._considerRequestGrouping([
                        r,
                        this._getRequestId(I._requestType.groupMembersQuery, {
                            groupId: "/"
                        })
                    ])
                    this.getNodeContexts(this.getModel().getContext("/"), {
                        startIndex: e.startIndex,
                        length: e.length,
                        threshold: e.threshold,
                        level: 0,
                        numberOfExpandedLevels: 0
                    })
                }
            } else {
                var s = this._prepareGroupMembersAutoExpansionRequestIds(
                    "/",
                    e.numberOfExpandedLevels
                )
                s.push(r)
                this._considerRequestGrouping(s)
                this.getNodeContexts(this.getModel().getContext("/"), {
                    startIndex: e.startIndex,
                    length: e.length,
                    threshold: e.threshold,
                    level: 0,
                    numberOfExpandedLevels: e.numberOfExpandedLevels
                })
            }
            if (i.length > 1) {
                v.fatal(
                    "assertion failed: grand total represented by a single entry"
                )
            }
            return i
        }
        I.prototype.getNodeContexts = function (e, t) {
            if (this.isInitial()) {
                return []
            }
            var i, r, s, n, a, o
            if (typeof t == "object") {
                i = t.startIndex
                r = t.length
                s = t.threshold
                n = t.level
                a = t.numberOfExpandedLevels
                o = t.supressRequest
            } else {
                i = arguments[1]
                r = arguments[2]
                s = arguments[3]
                n = arguments[4]
                a = arguments[5]
                o = arguments[6]
            }
            var u = this._getContextsForParentContext(e, i, r, s, n, a, o)
            return u
        }
        I.prototype.ContextsAvailabilityStatus = { ALL: 2, SOME: 1, NONE: 0 }
        I.prototype.hasAvailableNodeContexts = function (e, t) {
            var i = this._getGroupIdFromContext(e, t)
            if (this._getKeys(i) != undefined) {
                if (this.mFinalLength[i] == true) {
                    return I.prototype.ContextsAvailabilityStatus.ALL
                } else {
                    return I.prototype.ContextsAvailabilityStatus.SOME
                }
            } else {
                return I.prototype.ContextsAvailabilityStatus.NONE
            }
        }
        I.prototype.getGroupSize = function (e, t) {
            if (e === undefined) {
                return 0
            }
            var i = this._getGroupIdFromContext(e, t)
            return this.mFinalLength[i] ? this.mLength[i] : -1
        }
        I.prototype.getTotalSize = function () {
            if (!this.bProvideTotalSize) {
                v.fatal(
                    "total size of result explicitly turned off, but getter invoked"
                )
            }
            return +this.iTotalSize
        }
        I.prototype.hasChildren = function (e, t) {
            if (e === undefined) {
                return false
            }
            if (e == null) {
                return true
            }
            var i = t.level
            if (i == 0) {
                return true
            }
            if (this.aAggregationLevel.length < i) {
                return false
            }
            return (
                this.aMaxAggregationLevel.indexOf(
                    this.aAggregationLevel[i - 1]
                ) <
                this.aMaxAggregationLevel.length - 1
            )
        }
        I.prototype.hasMeasures = function () {
            var e = false
            for (var t in this.oMeasureDetailsSet) {
                if (this.oMeasureDetailsSet.hasOwnProperty(t)) {
                    e = true
                    break
                }
            }
            return e
        }
        I.prototype.getDimensionDetails = function () {
            return this.oDimensionDetailsSet
        }
        I.prototype.getMeasureDetails = function () {
            return this.oMeasureDetailsSet
        }
        I.prototype.providesGrandTotal = function () {
            return this.bProvideGrandTotals
        }
        I.prototype.getProperty = function (e) {
            if (this.isInitial()) {
                return {}
            }
            return this.oAnalyticalQueryResult
                .getEntityType()
                .findPropertyByName(e)
        }
        I.prototype.getFilterablePropertyNames = function () {
            if (this.isInitial()) {
                return []
            }
            return this.oAnalyticalQueryResult
                .getEntityType()
                .getFilterablePropertyNames()
        }
        I.prototype.getSortablePropertyNames = function () {
            if (this.isInitial()) {
                return []
            }
            return this.oAnalyticalQueryResult
                .getEntityType()
                .getSortablePropertyNames()
        }
        I.prototype.getPropertyLabel = function (e) {
            if (this.isInitial()) {
                return ""
            }
            return this.oAnalyticalQueryResult
                .getEntityType()
                .getLabelOfProperty(e)
        }
        I.prototype.getPropertyHeading = function (e) {
            if (this.isInitial()) {
                return ""
            }
            return this.oAnalyticalQueryResult
                .getEntityType()
                .getHeadingOfProperty(e)
        }
        I.prototype.getPropertyQuickInfo = function (e) {
            if (this.isInitial()) {
                return ""
            }
            return this.oAnalyticalQueryResult
                .getEntityType()
                .getQuickInfoOfProperty(e)
        }
        I.prototype.isMeasure = function (e) {
            return this.aMeasureName && this.aMeasureName.indexOf(e) !== -1
        }
        I.prototype.filter = function (e, r) {
            if (!e) {
                e = []
            }
            if (e instanceof i) {
                e = [e]
            }
            e = this._convertDeprecatedFilterObjects(e)
            if (r == n.Application) {
                this.aApplicationFilter = e
            } else {
                this.aControlFilter = e
            }
            this.iTotalSize = -1
            this._abortAllPendingRequests()
            this.resetData()
            this.bApplySortersToGroups = true
            this._fireRefresh({ reason: t.Filter })
            return this
        }
        I.prototype.getFilterInfo = function (e) {
            var t = s.combineFilters(
                this.aControlFilter,
                this.aApplicationFilter
            )
            if (t) {
                return t.getAST(e)
            }
            return null
        }
        I.prototype.sort = function (e) {
            if (e instanceof a) {
                e = [e]
            }
            this.aSorter = e ? e : []
            this._abortAllPendingRequests()
            this.resetData(undefined, { reason: t.Sort })
            this._fireRefresh({ reason: t.Sort })
            return this
        }
        I.prototype.getGroupName = function (e, t) {
            if (e === undefined) {
                return ""
            }
            var i = this.aAggregationLevel[t - 1],
                r = this.oAnalyticalQueryResult.findDimensionByPropertyName(i),
                s =
                    this.mAnalyticalInfoByProperty[i] &&
                    this.mAnalyticalInfoByProperty[i].formatter,
                n = e.getProperty(i),
                a,
                o,
                u,
                l,
                d,
                h,
                p,
                f
            if (r && this.oDimensionDetailsSet[i].textPropertyName) {
                d = r.getTextProperty()
            }
            if (d) {
                h = d.name
                f =
                    this.mAnalyticalInfoByProperty[h] &&
                    this.mAnalyticalInfoByProperty[h].formatter
                p = e.getProperty(h)
                a = s ? s(n, p) : n
                o = f ? f(p, n) : p
            } else {
                a = s ? s(n) : n
            }
            l = r.getLabelText && r.getLabelText()
            u = (l ? l + ": " : "") + a
            if (o) {
                u += " - " + o
            }
            return u
        }
        I.prototype.updateAnalyticalInfo = function (e, i) {
            var r,
                s,
                n,
                a,
                o = this
            function u(e) {
                var t = e.level,
                    i = e.name
                a = a || n.getAllHierarchyPropertyNames()
                a.forEach(function (r) {
                    var s = o.oAnalyticalQueryResult
                            .findDimensionByPropertyName(r)
                            .getHierarchy(),
                        a = null,
                        u = s.getNodeIDProperty().name,
                        l
                    if (u === i) {
                        a = d(s)
                    } else {
                        l = s.getNodeExternalKeyProperty()
                        if (l && l.name === i) {
                            a = d(s)
                            a.nodeExternalKeyName = i
                        } else {
                            l = n.getTextPropertyOfProperty(u)
                            if (l && l.name === i) {
                                a = d(s)
                                a.nodeTextName = i
                            }
                        }
                    }
                    if (a && "level" in e) {
                        if (typeof t === "number") {
                            if ("level" in a && a.level !== t) {
                                throw new Error(
                                    "Multiple different level filter for hierarchy '" +
                                        u +
                                        "' defined"
                                )
                            }
                            a.level = t
                            a.grouped = !!e.grouped
                        } else {
                            throw new Error(
                                "The level of '" +
                                    u +
                                    "' has to be an integer value"
                            )
                        }
                    }
                })
            }
            function d(e) {
                var t = e.getNodeIDProperty().name,
                    i,
                    r = o.mHierarchyDetailsByName[t]
                if (!r) {
                    i = e.getNodeLevelProperty()
                    r = {
                        dimensionName: e.getNodeValueProperty().name,
                        nodeIDName: t,
                        nodeLevelName: i && i.name
                    }
                    o.mHierarchyDetailsByName[t] = r
                }
                return r
            }
            if (
                !this.oModel.oMetadata ||
                !this.oModel.oMetadata.isLoaded() ||
                this.isInitial()
            ) {
                this.aInitialAnalyticalInfo = e
                return
            }
            r = l.helper.deepEqual(
                this._aLastChangedAnalyticalInfo,
                e,
                function (e) {
                    o.mAnalyticalInfoByProperty[e.name].formatter = e.formatter
                }
            )
            if (r) {
                this._aLastChangedAnalyticalInfo = []
                for (var h = 0; h < e.length; h++) {
                    this._aLastChangedAnalyticalInfo[h] = g.extend({}, e[h])
                }
            }
            if (r < 2) {
                if (i || r) {
                    setTimeout(
                        function () {
                            this._fireChange({ reason: t.Change })
                        }.bind(this),
                        0
                    )
                }
                return
            }
            var p = this.oDimensionDetailsSet || {},
                f = this.oMeasureDetailsSet || {}
            this.mAnalyticalInfoByProperty = {}
            this.aMaxAggregationLevel = []
            this.aAggregationLevel = []
            this.aMeasureName = []
            if (this.iAnalyticalInfoVersionNumber == undefined) {
                this.iAnalyticalInfoVersionNumber = 1
            } else if (this.iAnalyticalInfoVersionNumber > 999) {
                this.iAnalyticalInfoVersionNumber = 1
            } else {
                this.iAnalyticalInfoVersionNumber =
                    this.iAnalyticalInfoVersionNumber + 1
            }
            this.oMeasureDetailsSet = {}
            this.oDimensionDetailsSet = {}
            this.aAdditionalSelects = []
            this.mHierarchyDetailsByName = {}
            n = this.oAnalyticalQueryResult.getEntityType()
            for (var c = 0; c < e.length; c++) {
                var _ = this.oAnalyticalQueryResult.findDimensionByPropertyName(
                    e[c].name
                )
                if (_ && (e[c].inResult == true || e[c].visible == true)) {
                    e[c].dimensionPropertyName = _.getName()
                    s = this.oDimensionDetailsSet[_.getName()]
                    if (!s) {
                        s = {}
                        s.name = _.getName()
                        s.aAttributeName = []
                        s.grouped = false
                        this.oDimensionDetailsSet[_.getName()] = s
                        this.aMaxAggregationLevel.push(s.name)
                        if (e[c].grouped == true) {
                            this.aAggregationLevel.push(s.name)
                        }
                    }
                    if (e[c].grouped == true) {
                        if (
                            !this.getSortablePropertyNames() ||
                            this.getSortablePropertyNames().indexOf(
                                _.getName()
                            ) == -1
                        ) {
                            v.fatal(
                                "property " +
                                    _.getName() +
                                    " must be sortable in order to be used as grouped dimension"
                            )
                        }
                        s.grouped = true
                    }
                    if (_.getName() == e[c].name) {
                        s.keyPropertyName = e[c].name
                    }
                    var R = _.getTextProperty()
                    if (R && R.name == e[c].name) {
                        s.textPropertyName = e[c].name
                    }
                    if (_.findAttributeByName(e[c].name)) {
                        s.aAttributeName.push(e[c].name)
                    }
                    s.analyticalInfo = e[c]
                }
                var I = this.oAnalyticalQueryResult.findMeasureByPropertyName(
                    e[c].name
                )
                if (I && (e[c].inResult == true || e[c].visible == true)) {
                    e[c].measurePropertyName = I.getName()
                    var M = this.oMeasureDetailsSet[I.getName()]
                    if (!M) {
                        M = {}
                        M.name = I.getName()
                        this.oMeasureDetailsSet[I.getName()] = M
                        this.aMeasureName.push(M.name)
                    }
                    if (I.getRawValueProperty().name == e[c].name) {
                        M.rawValuePropertyName = e[c].name
                    }
                    var q = I.getFormattedValueProperty()
                    if (q && q.name == e[c].name) {
                        M.formattedValuePropertyName = e[c].name
                    }
                    M.analyticalInfo = e[c]
                }
                if (!_ && !I) {
                    u(e[c])
                }
                this.mAnalyticalInfoByProperty[e[c].name] = e[c]
            }
            Object.keys(this.mHierarchyDetailsByName).forEach(function (e) {
                var t = o.mHierarchyDetailsByName[e]
                if (!("level" in t)) {
                    delete o.mHierarchyDetailsByName[e]
                    if (v.isLoggable(y.Level.INFO)) {
                        v.info(
                            "No level specified for hierarchy node '" +
                                e +
                                "'; ignoring hierarchy",
                            ""
                        )
                    }
                } else if (!o.oDimensionDetailsSet[e]) {
                    o.oDimensionDetailsSet[e] = {
                        aAttributeName: [],
                        grouped: t.grouped,
                        isHierarchyDimension: true,
                        name: e
                    }
                    o.aMaxAggregationLevel.push(e)
                    if (t.grouped) {
                        o.aAggregationLevel.push(e)
                    }
                }
            })
            for (var b in this.oMeasureDetailsSet) {
                var x = this.oAnalyticalQueryResult
                    .findMeasureByName(b)
                    .getUnitProperty()
                if (x) {
                    this.oMeasureDetailsSet[b].unitPropertyName = x.name
                }
            }
            var S =
                Object.keys(p).sort().join(";") !==
                Object.keys(this.oDimensionDetailsSet).sort().join(";")
            if (S) {
                this.iTotalSize = -1
            }
            if (
                S ||
                Object.keys(f).sort().join(";") !==
                    Object.keys(this.oMeasureDetailsSet).sort().join(";")
            ) {
                this.bApplySortersToGroups = true
            }
            this.aAnalyticalInfo = e
            this.resetData()
            this.bNeedsUpdate = false
            if (this.mParameters.select) {
                this.aAdditionalSelects = m(this)
            }
            if (i) {
                this._fireChange({ reason: t.Change })
            }
        }
        I.prototype.getAnalyticalInfoForColumn = function (e) {
            return this.mAnalyticalInfoByProperty[e]
        }
        I.prototype.loadGroups = function (e) {
            var t = []
            for (var i in e) {
                t.push(i)
                this._resetData(i)
                var r = e[i]
                for (var s = 0; s < r.length; s++) {
                    var n = r[s]
                    this._getContextsForParentGroupId(
                        i,
                        n.startIndex,
                        n.length,
                        n.threshold
                    )
                }
                var a = []
                for (var o = -1, u; (u = t[++o]) !== undefined; ) {
                    a.push(
                        this._getRequestId(I._requestType.groupMembersQuery, {
                            groupId: u
                        })
                    )
                }
                this._considerRequestGrouping(a)
            }
        }
        I.prototype.getAnalyticalQueryResult = function () {
            return this.oAnalyticalQueryResult
        }
        I._requestType = {
            groupMembersQuery: 1,
            totalSizeQuery: 2,
            groupMembersAutoExpansionQuery: 3,
            levelMembersQuery: 4,
            reloadMeasuresQuery: 5
        }
        I._artificialRootContextGroupId = "artificialRootContext"
        I._addHierarchyLevelFilters = function (e, t) {
            e.forEach(function (e) {
                t.removeConditions(e.propertyName)
                t.addCondition(e.propertyName, r.EQ, e.level)
            })
        }
        I.prototype._getContextsForParentContext = function (
            e,
            t,
            i,
            r,
            s,
            n,
            a
        ) {
            if (e === undefined) {
                return []
            }
            if (e && e.getPath() == "/" + I._artificialRootContextGroupId) {
                e = this.getModel().getContext("/")
            }
            var o = this._getGroupIdFromContext(e, s)
            return this._getContextsForParentGroupId(o, t, i, r, n, a)
        }
        I.prototype._getContextsForParentGroupId = function (e, t, i, r, s, n) {
            if (e === undefined) {
                return []
            }
            if (!t) {
                t = 0
            }
            if (!i) {
                i = this.oModel.iSizeLimit
            }
            if (this.mFinalLength[e] && this.mLength[e] < t + i) {
                i = this.mLength[e] - t
                if (i < 0) {
                    v.fatal(
                        "invalid start index greater than total group length passed"
                    )
                }
            }
            if (!r) {
                r = 0
            }
            if (!s) {
                s = 0
            }
            if (e == null) {
                if (s > 0) {
                    v.fatal(
                        "invalid request to determine nodes of root context"
                    )
                    return null
                }
            } else {
                if (
                    this._getGroupIdLevel(e) >= this.aAggregationLevel.length &&
                    s > 0
                ) {
                    v.fatal(
                        "invalid request to determine nodes of context with group ID " +
                            e
                    )
                    return null
                }
                if (
                    this._getGroupIdLevel(e) + s >
                    this.aAggregationLevel.length
                ) {
                    s =
                        this.aAggregationLevel.length -
                        this._getGroupIdLevel(e) -
                        1
                }
            }
            var a = [],
                o,
                u,
                l,
                d
            var h = e == null ? 0 : this._getGroupIdLevel(e) + 1
            if (!this.aMultiUnitLoadFactor[h]) {
                this.aMultiUnitLoadFactor[h] = 1
            }
            var p = s > 0 && e != null
            if (p) {
                var f = this._getGroupIdLevel(e)
                var g = f + s
                var y = true
                if (!n) {
                    l = this._calculateRequiredGroupExpansion(e, g, t, i + r)
                    y = l.groupId_Missing == null
                    y =
                        y ||
                        l.groupId_Missing.length < e.length ||
                        l.groupId_Missing.substring(0, e.length) != e
                }
                if (y) {
                    a = this._getLoadedContextsForGroup(e, t, i)
                } else {
                    d = i + r
                }
                o = !y
                d = Math.ceil(d * this.aMultiUnitLoadFactor[h])
            } else {
                a = this._getLoadedContextsForGroup(e, t, i, n)
                o = false
                if (!n) {
                    if (this._oWatermark && e === this._oWatermark.groupID) {
                        r = 1e4
                    }
                    u = this._calculateRequiredGroupSection(e, t, i, r)
                    var c = u.length > 0 && i < u.length
                    o =
                        (a.length != i &&
                            !(
                                this.mFinalLength[e] &&
                                a.length >= this.mLength[e] - t
                            )) ||
                        c
                    u.length = Math.ceil(
                        u.length * this.aMultiUnitLoadFactor[h]
                    )
                }
            }
            if (!o) {
                this._cleanupGroupingForCompletedRequest(
                    this._getRequestId(I._requestType.groupMembersQuery, {
                        groupId: e
                    })
                )
            }
            var m = false
            if (this.oModel.getServiceMetadata()) {
                if (o) {
                    var _ =
                        this.bProvideTotalSize &&
                        this.iTotalSize == -1 &&
                        !this._isRequestPending(
                            this._getRequestId(I._requestType.totalSizeQuery)
                        )
                    m = true
                    var R
                    if (this.bUseBatchRequests) {
                        if (p) {
                            R = this._prepareGroupMembersAutoExpansionRequestIds(
                                e,
                                s
                            )
                            for (var M = -1, q; (q = R[++M]) !== undefined; ) {
                                if (this._isRequestPending(q)) {
                                    m = false
                                    break
                                }
                            }
                            if (m) {
                                this.aBatchRequestQueue.push([
                                    I._requestType
                                        .groupMembersAutoExpansionQuery,
                                    e,
                                    l,
                                    d,
                                    s
                                ])
                            }
                        } else {
                            m =
                                u.length &&
                                !this._isRequestPending(
                                    this._getRequestId(
                                        I._requestType.groupMembersQuery,
                                        { groupId: e }
                                    )
                                )
                            if (m) {
                                this.aBatchRequestQueue.push([
                                    I._requestType.groupMembersQuery,
                                    e,
                                    u.startIndex,
                                    u.length
                                ])
                                R = [
                                    this._getRequestId(
                                        I._requestType.groupMembersQuery,
                                        { groupId: e }
                                    )
                                ]
                            }
                        }
                        if (m && _) {
                            R.push(
                                this._getRequestId(
                                    I._requestType.totalSizeQuery
                                )
                            )
                            this._considerRequestGrouping(R)
                            this.aBatchRequestQueue.push([
                                I._requestType.totalSizeQuery
                            ])
                        }
                        if (m) {
                            if (e == null) {
                                this._abortAllPendingRequests()
                            }
                            Promise.resolve().then(
                                I.prototype._processRequestQueue.bind(this)
                            )
                        }
                    } else {
                        var b
                        if (p) {
                            R = this._prepareGroupMembersAutoExpansionRequestIds(
                                e,
                                s
                            )
                            for (var x = -1, S; (S = R[++x]) !== undefined; ) {
                                if (this._isRequestPending(S)) {
                                    m = false
                                    break
                                }
                            }
                            if (m) {
                                b = this._prepareGroupMembersAutoExpansionQueryRequest(
                                    I._requestType
                                        .groupMembersAutoExpansionQuery,
                                    e,
                                    l,
                                    d,
                                    s
                                )
                            }
                        } else {
                            m =
                                u.length &&
                                !this._isRequestPending(
                                    this._getRequestId(
                                        I._requestType.groupMembersQuery,
                                        { groupId: e }
                                    )
                                )
                            if (m) {
                                b = this._prepareGroupMembersQueryRequest(
                                    I._requestType.groupMembersQuery,
                                    e,
                                    u.startIndex,
                                    u.length
                                )
                                R = [b.sRequestId]
                            }
                        }
                        if (m) {
                            if (e == null) {
                                this._abortAllPendingRequests()
                            }
                            this._executeQueryRequest(b)
                            if (_ && !b.bIsFlatListRequest) {
                                R.push(
                                    this._getRequestId(
                                        I._requestType.totalSizeQuery
                                    )
                                )
                                this._considerRequestGrouping(R)
                                this._executeQueryRequest(
                                    this._prepareTotalSizeQueryRequest(
                                        I._requestType.totalSizeQuery
                                    )
                                )
                            }
                        }
                    }
                }
            }
            return a
        }
        I.prototype._getHierarchyLevelFiltersAndAddRecursiveHierarchy = function (
            e,
            t
        ) {
            var i,
                r = [],
                s = this
            if (t === null) {
                return r
            }
            i = Object.keys(this.mHierarchyDetailsByName)
            if (i.length > 0 && t !== "/") {
                v.error(
                    "Hierarchy cannot be requested for members of a group",
                    t
                )
                return r
            }
            i.forEach(function (t) {
                var i = s.mHierarchyDetailsByName[t]
                e.addRecursiveHierarchy(
                    i.dimensionName,
                    !!i.nodeExternalKeyName,
                    !!i.nodeTextName
                )
                r.push({ propertyName: i.nodeLevelName, level: i.level })
            })
            return r
        }
        I.prototype._getNonHierarchyDimensions = function (e) {
            var t = this
            return e.filter(function (e) {
                return !t.oDimensionDetailsSet[e].isHierarchyDimension
            })
        }
        I.prototype._processRequestQueue = function (e) {
            if (e === undefined || e === null) {
                e = this.aBatchRequestQueue || []
            }
            if (e.length == 0) {
                return
            }
            var t = []
            var i = false
            var r, s, n
            for (r = -1; (n = e[++r]) !== undefined; ) {
                if (n[0] == I._requestType.groupMembersQuery) {
                    s = I.prototype._prepareGroupMembersQueryRequest.apply(
                        this,
                        n
                    )
                    i = i || s.bIsFlatListRequest
                    t.push(s)
                }
            }
            for (r = -1; (n = e[++r]) !== undefined; ) {
                s = null
                switch (n[0]) {
                    case I._requestType.groupMembersQuery:
                        continue
                    case I._requestType.totalSizeQuery:
                        if (!i) {
                            s = I.prototype._prepareTotalSizeQueryRequest.apply(
                                this,
                                n
                            )
                            t.push(s)
                        }
                        break
                    case I._requestType.groupMembersAutoExpansionQuery:
                        s = I.prototype._prepareGroupMembersAutoExpansionQueryRequest.apply(
                            this,
                            n
                        )
                        for (
                            var a = -1, o;
                            (o =
                                s.aGroupMembersAutoExpansionRequestDetails[
                                    ++a
                                ]) !== undefined;

                        ) {
                            t.push(o)
                        }
                        break
                    case I._requestType.reloadMeasuresQuery: {
                        var u = n[1]
                        for (var l = -1, d; (d = u[++l]) !== undefined; ) {
                            t.push(d)
                        }
                        break
                    }
                    default:
                        v.fatal("unhandled request type " + e[r][0])
                        continue
                }
            }
            if (t.length > 1) {
                this._executeBatchRequest(t)
            } else {
                this._executeQueryRequest(t[0])
            }
            if (e === this.aBatchRequestQueue) {
                this.aBatchRequestQueue = []
            }
        }
        I.prototype._prepareGroupMembersQueryRequest = function (e, t, i, s) {
            var n = [],
                a = [],
                o
            var u = new l.QueryResultRequest(this.oAnalyticalQueryResult)
            u.setResourcePath(this._getResourcePath())
            u.getSortExpression().clear()
            var d = 0,
                h = -1
            if (t) {
                n = this._getGroupIdComponents(t)
                d = h = n.length
                var p = 0
                for (var f = 0, g = 0; f < d; g++) {
                    if (
                        this.oDimensionDetailsSet[this.aMaxAggregationLevel[g]]
                            .grouped == false
                    ) {
                        ++p
                    } else {
                        ++f
                    }
                }
                d = h = d + p
                if (this.aMaxAggregationLevel.length > 0) {
                    while (
                        this.oDimensionDetailsSet[this.aMaxAggregationLevel[h]]
                            .grouped == false
                    ) {
                        if (++h == this.aMaxAggregationLevel.length) {
                            break
                        }
                    }
                }
            }
            var y = h >= this.aMaxAggregationLevel.length - 1
            o = this._getHierarchyLevelFiltersAndAddRecursiveHierarchy(u, t)
            var c = this.aMaxAggregationLevel.slice(0, h + 1)
            var m = this._getNonHierarchyDimensions(c)
            u.setAggregationLevel(m)
            for (var _ = 0; _ < m.length; _++) {
                var R = this.oDimensionDetailsSet[m[_]]
                var M = R.textPropertyName != undefined
                u.includeDimensionKeyTextAttributes(
                    R.name,
                    true,
                    M,
                    R.aAttributeName
                )
                if (R.grouped) {
                    a.push({ sPath: m[_], bDescending: false })
                }
            }
            var q = u.getFilterExpression()
            q.clear()
            if (this.aApplicationFilter) {
                q.addUI5FilterConditions(this.aApplicationFilter)
            }
            if (this.aControlFilter) {
                q.addUI5FilterConditions(this.aControlFilter)
            }
            if (d >= 1) {
                for (var b = 0, x = n.length; b < x; b++) {
                    q.removeConditions(this.aAggregationLevel[b])
                    q.addCondition(this.aAggregationLevel[b], r.EQ, n[b])
                }
            }
            I._addHierarchyLevelFilters(o, q)
            var S
            var A
            var P
            var L
            var N = []
            if (
                t != null ||
                this.bProvideGrandTotals ||
                (this._canApplySortersToGroups() && this.aSorter.length > 0)
            ) {
                u.setMeasures(this.aMeasureName)
                for (var D in this.oMeasureDetailsSet) {
                    L = this.oMeasureDetailsSet[D]
                    if (!y && this._isSkippingTotalForMeasure(D)) {
                        S = false
                        A = false
                        P = false
                    } else {
                        S = L.rawValuePropertyName != undefined
                        A = L.formattedValuePropertyName != undefined
                        P = L.unitPropertyName != undefined
                        if (P) {
                            if (N.indexOf(L.unitPropertyName) == -1) {
                                N.push(L.unitPropertyName)
                            }
                        }
                    }
                    u.includeMeasureRawFormattedValueUnit(L.name, S, A, P)
                }
                for (var G in m) {
                    var Q
                    if ((Q = N.indexOf(m[G])) != -1) {
                        N.splice(Q, 1)
                    }
                }
            }
            if (t) {
                this._addSorters(u.getSortExpression(), a)
            }
            if (s == 0) {
                v.fatal("unhandled case: load 0 entities of sub group")
            }
            var F = this._getKeyIndexMapping(t, i)
            if (!this.bNoPaging) {
                u.setResultPageBoundaries(
                    F.iServiceKeyIndex + 1,
                    F.iServiceKeyIndex + s
                )
            }
            u.setRequestOptions(null, !this.mFinalLength[t])
            return {
                iRequestType: e,
                sRequestId: this._getRequestId(
                    I._requestType.groupMembersQuery,
                    { groupId: t }
                ),
                oAnalyticalQueryRequest: u,
                sGroupId: t,
                aSelectedUnitPropertyName: N,
                aAggregationLevel: c,
                bIsFlatListRequest: y && d == 0,
                bIsLeafGroupsRequest: y,
                iStartIndex: i,
                iLength: s,
                oKeyIndexMapping: F
            }
        }
        I.prototype._prepareTotalSizeQueryRequest = function (e) {
            var t
            var i = new l.QueryResultRequest(this.oAnalyticalQueryResult)
            i.setResourcePath(this._getResourcePath())
            t = this._getHierarchyLevelFiltersAndAddRecursiveHierarchy(i, "/")
            i.setAggregationLevel(
                this._getNonHierarchyDimensions(this.aMaxAggregationLevel)
            )
            i.setMeasures([])
            var r = i.getFilterExpression()
            r.clear()
            if (this.aApplicationFilter) {
                r.addUI5FilterConditions(this.aApplicationFilter)
            }
            if (this.aControlFilter) {
                r.addUI5FilterConditions(this.aControlFilter)
            }
            I._addHierarchyLevelFilters(t, r)
            i.setRequestOptions(null, null, true)
            i.setRequestOptions(null, true)
            return {
                iRequestType: e,
                sRequestId: this._getRequestId(I._requestType.totalSizeQuery),
                oAnalyticalQueryRequest: i
            }
        }
        I.prototype._prepareGroupMembersAutoExpansionQueryRequest = function (
            e,
            t,
            s,
            n,
            a
        ) {
            var o = this
            var u = function (e, t) {
                var s = []
                if (e.groupId_Missing == null) {
                    v.fatal("missing group Id not present")
                    return s
                }
                var n = o._getGroupIdComponents(e.groupId_Missing)
                var a = n.length
                if (a > t) {
                    v.fatal(
                        "the given group ID is too deep for requested level for auto expansion"
                    )
                    return s
                }
                var u = []
                for (var l = 0; l < a; l++) {
                    var d = o.aAggregationLevel[l]
                    var h = n[l]
                    var p = o._getFilterOperatorMatchingPropertySortOrder(d)
                    u[l] = new i(d, p, h)
                }
                var f = null
                if (e.startIndex_Missing > 0) {
                    var y = o._getKey(
                        e.groupId_Missing,
                        e.startIndex_Missing - 1
                    )
                    var c = o.oModel.getObject("/" + y)
                    var m = o.aAggregationLevel[a]
                    var _ = c[m]
                    f = new i(
                        m,
                        o._getFilterOperatorMatchingPropertySortOrder(m, false),
                        _
                    )
                }
                for (var R = 0; R < t; R++) {
                    var I = []
                    var M = Math.min(a, R + 1)
                    for (var q = 0; q < M; q++) {
                        var b = []
                        var x = Math.min(a, q + 1)
                        var S = e.startIndex_Missing > 0
                        for (var A = 0; A < x; A++) {
                            var P = new i("x", r.EQ, "x")
                            P = g.extend(true, P, u[A])
                            if (x > 1 && A < x - 1) {
                                P.sOperator = r.EQ
                            }
                            if (A == a - 1 && R > a - 1 && !S) {
                                if (P.sOperator == r.GT) {
                                    P.sOperator = r.GE
                                } else {
                                    P.sOperator = r.LE
                                }
                            }
                            b.push(P)
                        }
                        if (b.length > 0) {
                            I.push(new i(b, true))
                            if (R > a - 1 && q == a - 1 && S) {
                                var L = []
                                for (var N = 0; N < b.length; N++) {
                                    var D = new i("x", r.EQ, "x")
                                    D = g.extend(true, D, b[N])
                                    L.push(D)
                                }
                                L[a - 1].sOperator = r.EQ
                                L.push(f)
                                I.push(new i(L, true))
                                break
                            }
                        }
                    }
                    if (I.length > 0) {
                        s[R] = new i(I, false)
                    } else {
                        s[R] = null
                    }
                }
                return s
            }
            var d = function (e, t, i, r, s, n, a, u) {
                var d
                var h = new l.QueryResultRequest(o.oAnalyticalQueryResult)
                h.setResourcePath(o._getResourcePath())
                h.getSortExpression().clear()
                var p = 0,
                    f = -1
                p = f = i - 1
                var g = 0
                for (var y = 0, c = 0; y < p; c++) {
                    if (
                        o.oDimensionDetailsSet[o.aMaxAggregationLevel[c]]
                            .grouped == false
                    ) {
                        ++g
                    } else {
                        ++y
                    }
                }
                p = f = p + g
                if (o.aMaxAggregationLevel.length > 0) {
                    while (
                        o.aMaxAggregationLevel[f] &&
                        o.oDimensionDetailsSet[o.aMaxAggregationLevel[f]]
                            .grouped == false
                    ) {
                        if (++f == o.aMaxAggregationLevel.length) {
                            break
                        }
                    }
                }
                var m = f >= o.aMaxAggregationLevel.length - 1
                d = o._getHierarchyLevelFiltersAndAddRecursiveHierarchy(h, t)
                var _ = o.aMaxAggregationLevel.slice(0, f + 1)
                h.setAggregationLevel(_)
                for (var R = 0; R < _.length; R++) {
                    var M = o.oDimensionDetailsSet[_[R]]
                    var q = M.textPropertyName != undefined
                    h.includeDimensionKeyTextAttributes(
                        M.name,
                        true,
                        q,
                        M.aAttributeName
                    )
                    if (M.grouped) {
                        h.getSortExpression().addSorter(
                            _[R],
                            l.SortOrder.Ascending
                        )
                    }
                }
                var b = h.getFilterExpression()
                b.clear()
                if (o.aApplicationFilter) {
                    b.addUI5FilterConditions(o.aApplicationFilter)
                }
                if (o.aControlFilter) {
                    b.addUI5FilterConditions(o.aControlFilter)
                }
                if (r) {
                    b.addUI5FilterConditions([r])
                }
                I._addHierarchyLevelFilters(d, b)
                var x
                var S
                var A
                var P
                var L = []
                h.setMeasures(o.aMeasureName)
                for (var N in o.oMeasureDetailsSet) {
                    P = o.oMeasureDetailsSet[N]
                    if (!m && o._isSkippingTotalForMeasure(N)) {
                        x = false
                        S = false
                        A = false
                    } else {
                        x = P.rawValuePropertyName != undefined
                        S = P.formattedValuePropertyName != undefined
                        A = P.unitPropertyName != undefined
                        if (A) {
                            if (L.indexOf(P.unitPropertyName) == -1) {
                                L.push(P.unitPropertyName)
                            }
                        }
                    }
                    h.includeMeasureRawFormattedValueUnit(P.name, x, S, A)
                }
                for (var D in _) {
                    var G
                    if ((G = L.indexOf(_[D])) != -1) {
                        L.splice(G, 1)
                    }
                }
                var Q = h.getSortExpression()
                for (var F = 0; F < o.aSorter.length; F++) {
                    if (o.aSorter[F]) {
                        Q.addSorter(
                            o.aSorter[F].sPath,
                            o.aSorter[F].bDescending
                                ? l.SortOrder.Descending
                                : l.SortOrder.Ascending
                        )
                    }
                }
                if (n == 0) {
                    v.fatal("unhandled case: load 0 entities of sub group")
                }
                var T = s
                if (!u) {
                    T = 0
                } else {
                    var C = 0
                    for (var K in o.mServiceKey) {
                        if (K.split("/").length === i + 1) {
                            C += o.mServiceKey[K].length
                        }
                    }
                    T = Math.max(T, C)
                }
                if (!o.bNoPaging) {
                    h.setResultPageBoundaries(T + 1, T + n)
                }
                return {
                    iRequestType: e,
                    sRequestId: null,
                    oAnalyticalQueryRequest: h,
                    iLevel: i,
                    aSelectedUnitPropertyName: L,
                    aAggregationLevel: _,
                    bIsFlatListRequest: m,
                    bIsLeafGroupsRequest: m,
                    iStartIndex: s,
                    iLength: n,
                    bAvoidLengthUpdate: a
                }
            }
            var h = []
            var p = []
            if (!s) {
                v.fatal("no first missing group member specified")
            }
            var f = this._getGroupIdLevel(t) + a + 1
            var y = o._getGroupIdComponents(s.groupId_Missing)
            var c = y.length
            var m = u(s, f)
            var _
            for (var R = 1; R <= f; R++) {
                var M
                if (R >= c + 2) {
                    M = 0
                    _ = undefined
                } else if (R == c + 1) {
                    M = s.startIndex_Missing
                    _ = s.groupId_Missing
                } else if (c > 0) {
                    if (R == c) {
                        _ = s.groupId_Missing
                    } else {
                        _ = this._getGroupIdAncestors(
                            s.groupId_Missing,
                            -(c - R)
                        )[0]
                    }
                    var q = this._getGroupIdAncestors(
                        s.groupId_Missing,
                        -(c - R + 1)
                    )[0]
                    if (!q) {
                        v.fatal(
                            "failed to determine group id at parent level; group ID = " +
                                t +
                                ", level = " +
                                R
                        )
                    }
                    M = this._findKeyIndex(q, this.mEntityKey[_])
                    if (M == -1) {
                        v.fatal(
                            "failed to determine position of value " +
                                _ +
                                " in group " +
                                q
                        )
                    }
                    _ = q
                    M++
                }
                var b = n > R ? Math.ceil((n - R) / (f - R + 1)) : n
                var x = m[R - 1]
                if (this.bUseAcceleratedAutoExpand) {
                    var S = d(
                        I._requestType.levelMembersQuery,
                        t,
                        R,
                        x,
                        M,
                        b,
                        false,
                        x == null ? true : false
                    )
                    S.sGroupId_Missing_AtLevel = _
                    S.sRequestId = this._getRequestId(
                        I._requestType.levelMembersQuery,
                        { groupId: t, level: R }
                    )
                    h.push(S)
                    p.push(S.sRequestId)
                } else if (x && x.aFilters.length > 0) {
                    if (!x._bMultiFilter || x.bAnd) {
                        v.fatal(
                            "level filter in wrong shape; cannot break it up"
                        )
                    }
                    for (var A = 0; A < x.aFilters.length; A++) {
                        var P = x.aFilters[A]
                        var L = d(
                            I._requestType.levelMembersQuery,
                            t,
                            R,
                            P,
                            M,
                            b,
                            false,
                            x == null ? true : false
                        )
                        L.sGroupId_Missing_AtLevel = _
                        L.sRequestId = this._getRequestId(
                            I._requestType.levelMembersQuery,
                            { groupId: t, level: R, tupleIndex: A }
                        )
                        h.push(L)
                        p.push(L.sRequestId)
                    }
                } else {
                    var N = d(
                        I._requestType.levelMembersQuery,
                        t,
                        R,
                        null,
                        M,
                        b,
                        false,
                        x == null ? true : false
                    )
                    N.sGroupId_Missing_AtLevel = _
                    N.sRequestId = this._getRequestId(
                        I._requestType.levelMembersQuery,
                        { groupId: t, level: R }
                    )
                    h.push(N)
                    p.push(N.sRequestId)
                }
            }
            return {
                iRequestType: e,
                aRequestId: p,
                aGroupMembersAutoExpansionRequestDetails: h,
                sGroupId: t,
                iLength: n
            }
        }
        I.prototype._prepareReloadMeasurePropertiesQueryRequest = function (
            e,
            t,
            s
        ) {
            var n = new l.QueryResultRequest(this.oAnalyticalQueryResult)
            n.setResourcePath(this._getResourcePath())
            n.getSortExpression().clear()
            var a = t.aAggregationLevel
            n.setAggregationLevel(a)
            var o = t.bIsLeafGroupsRequest
            var u = n.getFilterExpression()
            u.clear()
            if (this.aApplicationFilter) {
                u.addUI5FilterConditions(this.aApplicationFilter)
            }
            if (this.aControlFilter) {
                u.addUI5FilterConditions(this.aControlFilter)
            }
            var d = []
            for (var h = 0; h < a.length; h++) {
                var p = new i(a[h], r.EQ, s.oEntry[a[h]])
                d.push(p)
            }
            u.addUI5FilterConditions(d)
            var f
            var g
            var y
            var c
            var v = []
            n.setMeasures(s.aReloadMeasurePropertyName)
            for (var m in this.oMeasureDetailsSet) {
                c = this.oMeasureDetailsSet[m]
                if (
                    !s.aReloadMeasurePropertyName ||
                    s.aReloadMeasurePropertyName.indexOf(c.name) == -1
                ) {
                    continue
                }
                if (!o && this._isSkippingTotalForMeasure(m)) {
                    f = false
                    g = false
                    y = false
                } else {
                    f = c.rawValuePropertyName != undefined
                    g = c.formattedValuePropertyName != undefined
                    y = c.unitPropertyName != undefined
                    if (y) {
                        if (v.indexOf(c.unitPropertyName) == -1) {
                            v.push(c.unitPropertyName)
                        }
                    }
                }
                n.includeMeasureRawFormattedValueUnit(c.name, f, g, y)
            }
            for (var _ in a) {
                var R
                if ((R = v.indexOf(a[_])) != -1) {
                    v.splice(R, 1)
                }
            }
            return {
                iRequestType: e,
                sRequestId: this._getRequestId(
                    I._requestType.reloadMeasuresQuery,
                    { multiUnitEntryKey: this.oModel.getKey(s.oEntry) }
                ),
                oAnalyticalQueryRequest: n,
                aSelectedUnitPropertyName: v,
                aAggregationLevel: a,
                oMultiUnitRepresentative: s
            }
        }
        I.prototype._prepareGroupMembersAutoExpansionRequestIds = function (
            e,
            t
        ) {
            var i = this._getGroupIdLevel(e) + 1
            var r = i + t
            var s = []
            for (var n = i; n <= r; n++) {
                s.push(
                    this._getRequestId(I._requestType.levelMembersQuery, {
                        groupId: e,
                        level: n
                    })
                )
            }
            return s
        }
        I.prototype._getQueryODataRequestOptions = function (e, t, i) {
            var r
            i = i || {}
            try {
                e.getFilterExpression().checkValidity()
            } catch (e) {
                v.fatal("filter expression is not valid", e.toString())
                return undefined
            }
            var s = e.getURIQueryOptionValue("$select")
            var n = e.getURIQueryOptionValue("$filter")
            var a = e.getURIQueryOptionValue("$orderby")
            var o = e.getURIQueryOptionValue("$skip")
            var u = e.getURIQueryOptionValue("$top")
            var l = e.getURIQueryOptionValue("$inlinecount")
            if (t && this.aAdditionalSelects.length > 0) {
                s = (s ? s.split(",") : [])
                    .concat(this.aAdditionalSelects)
                    .join(",")
            }
            if (this.mParameters && this.mParameters["filter"]) {
                if (n === null) {
                    n = this.mParameters["filter"]
                } else {
                    n += "and (" + this.mParameters["filter"] + ")"
                }
            }
            var d = []
            if (s !== null) {
                d.push("$select=" + s)
            }
            if (n !== null) {
                d.push("$filter=" + n)
            }
            if (a !== null) {
                d.push("$orderby=" + a)
            }
            if (o !== null) {
                d.push("$skip=" + o)
            }
            if (u !== null) {
                d.push("$top=" + u)
            }
            if (l !== null) {
                d.push("$inlinecount=" + l)
            }
            if (i.encode === true) {
                for (r = 0; r < d.length; r++) {
                    d[r] = d[r].replace(/\ /g, "%20")
                }
            }
            return d
        }
        I.prototype._executeBatchRequest = function (e) {
            var t = this.iAnalyticalInfoVersionNumber,
                i,
                r = this
            var s = [],
                n = []
            function a() {
                r.fireDataReceived({ __simulateAsyncAnalyticalBinding: true })
            }
            var o = new d()
            function u(e, t) {
                o.success(t)
            }
            function l(e, t) {
                o.error(t || e)
            }
            this.bNeedsUpdate = true
            for (var p = 0; p < e.length; p++) {
                var f = e[p]
                if (f.aAggregationLevel && f.aAggregationLevel.length > 0) {
                    this.bNeedsUpdate = false
                }
            }
            for (var g = -1, y; (y = e[++g]) !== undefined; ) {
                var c = y.oAnalyticalQueryRequest,
                    m = y.sGroupId
                if (c.getURIQueryOptionValue("$select") == null) {
                    this.fireDataRequested({
                        __simulateAsyncAnalyticalBinding: true
                    })
                    m = null
                    this.mServiceLength[m] = this.mLength[m] = 1
                    this.mServiceFinalLength[m] = true
                    this._setServiceKey(
                        this._getKeyIndexMapping(m, 0),
                        I._artificialRootContextGroupId
                    )
                    setTimeout(a)
                    this.bArtificalRootContext = true
                    continue
                }
                var _ = c.getURIToQueryResultEntries()
                if (!this.oContext && _[0] !== "/") {
                    _ = "/" + _
                }
                if (!this._isRequestPending(y.sRequestId)) {
                    this._registerNewRequest(y.sRequestId)
                    if (this.iModelVersion === h.V1) {
                        s.push(
                            this.oModel.createBatchOperation(
                                _.replace(/\ /g, "%20"),
                                "GET"
                            )
                        )
                    } else if (this.iModelVersion === h.V2) {
                        var R = this._getQueryODataRequestOptions(
                            c,
                            y.bIsLeafGroupsRequest,
                            { encode: true }
                        )
                        if (this.sCustomParams) {
                            R.push(this.sCustomParams)
                        }
                        var M = this.oModel.read(_.replace(/\ /g, "%20"), {
                            success: u,
                            error: l,
                            context: this.oContext,
                            urlParameters: R
                        })
                        s.push(M)
                    }
                    n.push(y)
                }
            }
            if (s.length > 0) {
                v.debug(
                    "AnalyticalBinding: executing batch request with " +
                        n.length +
                        " operations"
                )
                var q
                i = this._getIdForNewRequestHandle()
                this.fireDataRequested()
                if (this.iModelVersion === h.V1) {
                    this.oModel.addBatchReadOperations(s)
                    q = this.oModel.submitBatch(b, x, true, true)
                    this.oModel.fireRequestSent({
                        url: this.oModel.sServiceUrl + "/$batch",
                        type: "POST",
                        async: true,
                        info: "",
                        infoObject: {}
                    })
                } else {
                    q = {
                        abort: function () {
                            for (var e = 0; e < s.length; e++) {
                                s[e].abort()
                            }
                        }
                    }
                    o.setup({
                        executedRequests: n,
                        binding: this,
                        success: b,
                        error: x
                    })
                }
                this._registerNewRequestHandle(i, q)
            }
            function b(e, s) {
                r._deregisterHandleOfCompletedRequest(i)
                if (n.length != e.__batchResponses.length) {
                    v.fatal(
                        "assertion failed: received " +
                            e.__batchResponses.length +
                            " responses for " +
                            n.length +
                            " read operations in the batch request"
                    )
                }
                if (t != r.iAnalyticalInfoVersionNumber) {
                    for (var a = 0; a < n.length; a++) {
                        var o = n[a].sRequestId
                        if (o !== undefined) {
                            r._deregisterCompletedRequest(o)
                            r._cleanupGroupingForCompletedRequest(o)
                        }
                    }
                    r.fireDataReceived({ data: [] })
                    return
                }
                var u = 0
                for (var l = 0; l < e.__batchResponses.length; l++) {
                    if (e.__batchResponses[l].data != undefined) {
                        if (e.__batchResponses[l].data.results.length == 0) {
                            u++
                        }
                        switch (n[l].iRequestType) {
                            case I._requestType.groupMembersQuery:
                                r._processGroupMembersQueryResponse(
                                    n[l],
                                    e.__batchResponses[l].data
                                )
                                break
                            case I._requestType.totalSizeQuery:
                                r._processTotalSizeQueryResponse(
                                    n[l],
                                    e.__batchResponses[l].data
                                )
                                break
                            case I._requestType.levelMembersQuery:
                                r._processLevelMembersQueryResponse(
                                    n[l],
                                    e.__batchResponses[l].data
                                )
                                break
                            case I._requestType.reloadMeasuresQuery:
                                r._processReloadMeasurePropertiesQueryResponse(
                                    n[l],
                                    e.__batchResponses[l].data
                                )
                                break
                            default:
                                v.fatal(
                                    "invalid request type " + n[l].iRequestType
                                )
                                continue
                        }
                    }
                    r._deregisterCompletedRequest(n[l].sRequestId)
                    r._cleanupGroupingForCompletedRequest(n[l].sRequestId)
                }
                if (r.mParameters && r.mParameters.numberOfExpandedLevels > 0) {
                    if (u == e.__batchResponses.length) {
                        r.mLength["/"] = 0
                        r.mFinalLength["/"] = true
                    }
                }
                var d = true
                var p
                r.fireDataReceived({ data: e })
                var f = {}
                if (r.iModelVersion === h.V1) {
                    p = r.oModel._getBatchErrors(e)
                    if (p.length > 0) {
                        d = false
                        f = r.oModel._handleError(p[0])
                    }
                    r.oModel.fireRequestCompleted({
                        url: s.requestUri,
                        type: "POST",
                        async: true,
                        info: "",
                        infoObject: {},
                        success: d,
                        errorobject: d ? {} : f
                    })
                    if (d) {
                        r.oModel.checkUpdate()
                    }
                }
            }
            function x(e) {
                if (e && e.statusText != "abort") {
                    r._deregisterHandleOfCompletedRequest(i)
                    for (var s = -1, a; (a = n[++s]) !== undefined; ) {
                        r._deregisterCompletedRequest(a.sRequestId)
                        r._cleanupGroupingForCompletedRequest(a.sRequestId)
                    }
                }
                if (t != r.iAnalyticalInfoVersionNumber) {
                    return
                }
                var o = e
                if (r.iModelVersion === h.V1) {
                    o = r.oModel._handleError(e)
                }
                r.oModel.fireRequestCompleted({
                    url: "",
                    type: "POST",
                    async: true,
                    info: "",
                    infoObject: {},
                    success: false,
                    errorobject: o
                })
                if (r.iModelVersion === h.V1) {
                    r.oModel.fireRequestFailed(o)
                }
                r.fireDataReceived()
            }
        }
        I.prototype._executeQueryRequest = function (e) {
            if (
                e.iRequestType == I._requestType.groupMembersAutoExpansionQuery
            ) {
                for (
                    var t = -1, i;
                    (i = e.aGroupMembersAutoExpansionRequestDetails[++t]) !==
                    undefined;

                ) {
                    this._executeQueryRequest(i)
                }
                return
            }
            var r = this.iAnalyticalInfoVersionNumber
            var s = e.oAnalyticalQueryRequest,
                n = e.sGroupId
            var a = s.getURIToQueryResultEntitySet()
            var o = this._getQueryODataRequestOptions(s, e.bIsLeafGroupsRequest)
            if (!o) {
                return
            }
            var u = this
            if (s.getURIQueryOptionValue("$select") == null) {
                this.fireDataRequested({
                    __simulateAsyncAnalyticalBinding: true
                })
                n = null
                this.mServiceLength[n] = this.mLength[n] = 1
                this.mServiceFinalLength[n] = true
                this._setServiceKey(
                    this._getKeyIndexMapping(n, 0),
                    I._artificialRootContextGroupId
                )
                this.bNeedsUpdate = true
                setTimeout(function () {
                    if (u._cleanupGroupingForCompletedRequest(e.sRequestId)) {
                        u.fireDataReceived({
                            __simulateAsyncAnalyticalBinding: true
                        })
                    }
                })
                this.bArtificalRootContext = true
                return
            }
            this._registerNewRequest(e.sRequestId)
            this.fireDataRequested()
            for (var l = 0; l < o.length; l++) {
                o[l] = o[l].replace(/\ /g, "%20")
            }
            v.debug("AnalyticalBinding: executing query request")
            var d = this._getIdForNewRequestHandle()
            if (this.iModelVersion === h.V1) {
                this.oModel._loadData(a, o, f, y, false, c, g)
            } else {
                if (this.sCustomParams) {
                    o.push(this.sCustomParams)
                }
                var p = this.oModel.read(a.replace(/ /g, "%20"), {
                    success: f,
                    error: y,
                    context: this.oContext,
                    urlParameters: o
                })
                u._registerNewRequestHandle(d, p)
            }
            function f(t) {
                u._deregisterHandleOfCompletedRequest(d)
                if (r != u.iAnalyticalInfoVersionNumber) {
                    u._deregisterCompletedRequest(e.sRequestId)
                    return
                }
                switch (e.iRequestType) {
                    case I._requestType.groupMembersQuery:
                        u._processGroupMembersQueryResponse(e, t)
                        break
                    case I._requestType.totalSizeQuery:
                        u._processTotalSizeQueryResponse(e, t)
                        break
                    case I._requestType.levelMembersQuery:
                        u._processLevelMembersQueryResponse(e, t)
                        break
                    case I._requestType.reloadMeasuresQuery:
                        u._processReloadMeasurePropertiesQueryResponse(e, t)
                        break
                    default:
                        v.fatal("invalid request type " + e.iRequestType)
                        break
                }
                u._deregisterCompletedRequest(e.sRequestId)
                if (u.iModelVersion === h.V2) {
                    g(t)
                }
            }
            function g(t) {
                if (r != u.iAnalyticalInfoVersionNumber) {
                    return
                }
                if (u._cleanupGroupingForCompletedRequest(e.sRequestId)) {
                    u.fireDataReceived({ data: t })
                }
            }
            function y(t) {
                if (t && t.statusText == "abort") {
                    u.fireDataReceived()
                    return
                }
                u._deregisterHandleOfCompletedRequest(d)
                u._deregisterCompletedRequest(e.sRequestId)
                u._cleanupGroupingForCompletedRequest(e.sRequestId)
                if (r != u.iAnalyticalInfoVersionNumber) {
                    return
                }
                u.fireDataReceived()
            }
            function c(e) {
                u._registerNewRequestHandle(d, e)
            }
        }
        I.prototype._abortAllPendingRequests = function () {
            this._abortAllPendingRequestsByHandle()
            this._clearAllPendingRequests()
        }
        I.prototype._processGroupMembersQueryResponse = function (e, t) {
            var i,
                r = e.sGroupId,
                s = this.aSorter.length > 0,
                n = e.aSelectedUnitPropertyName,
                a = e.aAggregationLevel,
                o = e.oKeyIndexMapping.iIndex,
                u = e.oKeyIndexMapping.iServiceKeyIndex,
                l = e.iLength,
                d = e.oKeyIndexMapping,
                h = r == null ? 0 : this._getGroupIdLevel(r) + 1,
                p = n.length > 0,
                f,
                g,
                y,
                c = 0,
                m,
                _,
                R = []
            var q = t.results.length
            if (r === null && q > 1 && this._canApplySortersToGroups()) {
                this._warnNoSortingOfGroups(
                    s ? "binding is refreshed" : undefined
                )
                if (s) {
                    setTimeout(this.refresh.bind(this), 0)
                    return
                }
            }
            var b = this._getServiceKeys(r, d.iIndex - 1)
            f = undefined
            if (b && b.length > 0) {
                for (var x = 0, S = b.length; x < S; x++) {
                    t.results[x - S] = this.oModel.getObject("/" + b[x])
                }
                var A = t.results[-b.length]
                f = ""
                for (var P = 0; P < a.length; P++) {
                    f += A[a[P]] + "|"
                }
            }
            m = b && b.length == 1
            for (var L = 0; L < q; L++) {
                var N = t.results[L]
                if (p) {
                    g = ""
                    for (var D = 0; D < a.length; D++) {
                        g += N[a[D]] + "|"
                    }
                    if (f == g) {
                        this._warnNoSortingOfGroups()
                        if (y === undefined) {
                            if (L == 0) {
                                y = -b.length
                                d.iServiceKeyIndex -= b.length - 1
                            } else {
                                y = L - 1
                            }
                        }
                        var G = -1,
                            Q = t.results[L - 1]
                        for (var F = 0; F < n.length; F++) {
                            if (Q[n[F]] != N[n[F]]) {
                                G = F
                                break
                            }
                        }
                        if (G == -1) {
                            v.fatal(
                                "assertion failed: no deviating units found for result entries " +
                                    (L - 1) +
                                    " and " +
                                    L,
                                null,
                                null,
                                M(this, "NO_DEVIATING_UNITS")
                            )
                        }
                    }
                    if ((f != g || L == q - 1) && y !== undefined) {
                        var T = []
                        for (var C = y; C < L; C++) {
                            T.push(t.results[C])
                        }
                        if (f == g) {
                            T.push(t.results[L])
                        }
                        var K = []
                        for (var E = 0; E < n.length; E++) {
                            var O = n[E]
                            for (var U = 1; U < T.length; U++) {
                                if (T[U - 1][O] != T[U][O]) {
                                    K.push(O)
                                    break
                                }
                            }
                        }
                        var w = this._createMultiUnitRepresentativeEntry(
                            r,
                            t.results[y],
                            n,
                            K,
                            e.bIsFlatListRequest
                        )
                        if (w.aReloadMeasurePropertyName.length > 0) {
                            _ = this._prepareReloadMeasurePropertiesQueryRequest(
                                I._requestType.reloadMeasuresQuery,
                                e,
                                w
                            )
                            if (
                                _.oAnalyticalQueryRequest &&
                                _.oAnalyticalQueryRequest.getURIQueryOptionValue(
                                    "$select"
                                ) != null
                            ) {
                                R.push(_)
                            }
                        }
                        var V = this._setAdjacentMultiUnitKeys(d, w, T)
                        var B
                        if (w.bIsNewEntry) {
                            B = T.length - 1
                        } else {
                            B = V
                        }
                        if (m) {
                            m = false
                        }
                        if (B < 0) {
                            v.fatal(
                                "assertion failed: iDiscardedEntriesCount must be non-negative"
                            )
                        }
                        c += B
                        var k = this.oModel._getKey(w.oEntry)
                        var H = this.oModel.getContext("/" + k)
                        this._getGroupIdFromContext(H, h)
                        this.mEntityKey[i] = k
                        y = undefined
                        if (f != g) {
                            m = this._setServiceKey(d, this.oModel._getKey(N))
                        }
                    } else if (f != g) {
                        m = this._setServiceKey(d, this.oModel._getKey(N))
                    }
                    f = g
                } else {
                    this._setServiceKey(d, this.oModel._getKey(N))
                }
                if (!e.bIsLeafGroupsRequest) {
                    var z = this._getKey(r, d.iIndex - 1)
                    i = this._getGroupIdFromContext(
                        this.oModel.getContext("/" + z),
                        h
                    )
                    this.mEntityKey[i] = z
                }
            }
            var j = []
            if (this.bReloadSingleUnitMeasures && R.length > 0) {
                if (this.bUseBatchRequests) {
                    this.aBatchRequestQueue.push([
                        I._requestType.reloadMeasuresQuery,
                        R
                    ])
                    Promise.resolve().then(
                        I.prototype._processRequestQueue.bind(this)
                    )
                } else {
                    for (var $ = 0; $ < R.length; $++) {
                        var Z = R[$]
                        this._executeQueryRequest(Z)
                    }
                }
                for (var W = 0; W < R.length; W++) {
                    var J = R[W]
                    j.push(J.sRequestId)
                }
                this._considerRequestGrouping(j)
            }
            if (b && b.length > 0) {
                for (var X = 0, Y = b.length; X < Y; X++) {
                    delete t.results[X - Y]
                }
            }
            if (p) {
                c += this._mergeLoadedKeyIndexWithSubsequentIndexes(
                    d,
                    a,
                    n,
                    e.bIsFlatListRequest
                )
            }
            if (!e.bAvoidLengthUpdate) {
                var ee = false
                if (t.__count) {
                    this.mServiceLength[r] = parseInt(t.__count)
                    this.mLength[r] = this.mServiceLength[r] - c
                    this.mFinalLength[r] = true
                    if (e.bIsFlatListRequest) {
                        this.iTotalSize = t.__count
                    }
                    ee = true
                }
                if (
                    !(r in this.mServiceLength) ||
                    this.mServiceLength[r] < u + q
                ) {
                    this.mServiceLength[r] = u + q
                    this.mLength[r] = o + q - c
                    this.mFinalLength[r] = false
                }
                if (q < l || l === undefined) {
                    this.mServiceLength[r] = u + q
                    this.mLength[r] = o + d.iIndex - o
                    this.mFinalLength[r] = true
                    ee = true
                }
                if (q == 0) {
                    this.mLength[r] = this.mServiceLength[r] = 0
                    this.mFinalLength[r] = true
                    ee = true
                }
                if (!ee && this.mLength[r] !== undefined && c > 0) {
                    this.mLength[r] -= c
                }
            }
            this.bNeedsUpdate = true
            if (c > 0) {
                if (t.results.length - c > 0) {
                    this.aMultiUnitLoadFactor[a.length] =
                        t.results.length / (t.results.length - c)
                }
                if (this.aMultiUnitLoadFactor[a.length] < 1.5) {
                    this.aMultiUnitLoadFactor[a.length] = 2
                }
            }
            v.info(
                "MultiUnit Situation in Group (" +
                    r +
                    "), discarded: " +
                    c +
                    ", load-factor is now: " +
                    this.aMultiUnitLoadFactor[a.length]
            )
        }
        I.prototype._processTotalSizeQueryResponse = function (e, t) {
            if (t.__count == undefined) {
                v.fatal("missing entity count in query result")
                return
            }
            this.iTotalSize = t.__count
        }
        I.prototype._processLevelMembersQueryResponse = function (e, t) {
            var i = this
            var r, s
            var n = function (n, a) {
                var o = {
                    iRequestType: I._requestType.groupMembersQuery,
                    sRequestId: i._getRequestId(
                        I._requestType.groupMembersQuery,
                        { groupId: r }
                    ),
                    oAnalyticalQueryRequest: e.oAnalyticalQueryRequest,
                    sGroupId: r,
                    aSelectedUnitPropertyName: e.aSelectedUnitPropertyName,
                    aAggregationLevel: e.aAggregationLevel,
                    bIsFlatListRequest: e.bIsFlatListRequest,
                    bIsLeafGroupsRequest: e.bIsLeafGroupsRequest,
                    iStartIndex: n ? e.iStartIndex : 0,
                    iLength: e.iLength,
                    bAvoidLengthUpdate: e.bAvoidLengthUpdate
                }
                if (
                    n &&
                    e.iStartIndex > 0 &&
                    (e.sGroupId_Missing_AtLevel != o.sGroupId ||
                        i._getKeys(o.sGroupId) === undefined)
                ) {
                    var u = i._getParentGroupId(o.sGroupId)
                    var l = i._findKeyIndex(u, i.mEntityKey[o.sGroupId])
                    if (l < 0) {
                        v.fatal(
                            "assertion failed: failed to determine position of " +
                                o.sGroupId +
                                " in group " +
                                u
                        )
                    } else if (!l) {
                        i.mFinalLength[e.sGroupId_Missing_AtLevel] = true
                    } else if (i._getKey(u, l - 1) !== undefined) {
                        var d = i._getKey(u, l - 1)
                        var h = i._getGroupIdFromContext(
                            i.oModel.getContext("/" + d),
                            i._getGroupIdLevel(o.sGroupId)
                        )
                        i.mFinalLength[h] = true
                        o.iStartIndex = 0
                    }
                }
                if (a) {
                    o.iLength = s.length
                }
                o.oKeyIndexMapping = i._getKeyIndexMapping(
                    o.sGroupId,
                    o.iStartIndex
                )
                var p = g.extend(true, {}, t)
                p.results = s
                i._processGroupMembersQueryResponse(o, p)
            }
            if (t.results.length == 0) {
                return
            }
            r = this._getGroupIdFromContext(
                this.oModel.getContext("/" + this.oModel._getKey(t.results[0])),
                e.iLevel - 1
            )
            s = []
            var a = true
            for (var o = 0; o < t.results.length; o++) {
                var u = t.results[o]
                var l = this.oModel.getContext(
                    "/" + this.oModel._getKey(t.results[o])
                )
                var d = this._getGroupIdFromContext(l, e.iLevel - 1)
                if (r == d) {
                    s.push(u)
                    if (o < t.results.length - 1) {
                        continue
                    }
                }
                n(a, t.results.length == e.iLength && o == t.results.length - 1)
                a = false
                if (r != d) {
                    s = [u]
                }
                r = d
            }
            if (t.results.length > 1 && s.length == 1) {
                n(a, t.results.length == e.iLength)
            }
        }
        I.prototype._processReloadMeasurePropertiesQueryResponse = function (
            e,
            t
        ) {
            var i = e.oMultiUnitRepresentative
            var r = this.oModel.getKey(i.oEntry)
            if (t.results.length != 1) {
                v.fatal(
                    "assertion failed: more than one entity for reloaded measure properties of entity with key " +
                        r
                )
                return
            }
            var s = t.results[0]
            var n = this.oModel.getObject("/" + r)
            if (!n) {
                v.fatal("assertion failed: no entity found with key " + r)
                return
            }
            var a = i.aReloadMeasurePropertyName
            for (var o = 0; o < a.length; o++) {
                n[a[o]] = s[a[o]]
            }
        }
        I.prototype._getLoadedContextsForGroup = function (e, t, i, r) {
            var s = [],
                n,
                a,
                o = this._getKeys(e),
                u
            if (!o) {
                return s
            }
            if (!t) {
                t = 0
            }
            if (!i) {
                i = this.oModel.iSizeLimit
                if (this.mFinalLength[e]) {
                    i = this.mLength[e]
                }
            }
            if (r) {
                a = t || 0
                u = o(a)
                while (u) {
                    n = this.oModel.getContext("/" + u)
                    s.push(n)
                    a++
                    u = o(a)
                }
                return s
            }
            for (a = t; a < t + i; a++) {
                u = o(a)
                if (!u) {
                    break
                }
                n = this.oModel.getContext("/" + u)
                s.push(n)
            }
            return s
        }
        I.prototype._calculateRequiredGroupSection = function (e, t, i, r) {
            var s = this._getKeys(e)
            if (t >= r) {
                t -= r
                i += r
            } else {
                i += t
                t = 0
            }
            i += r
            if (this.mFinalLength[e] && t + i > this.mLength[e]) {
                i = this.mLength[e] - t
            }
            if (s) {
                while (i && s(t)) {
                    t += 1
                    i -= 1
                }
                while (i && s(t + i - 1)) {
                    i -= 1
                }
            }
            return { startIndex: t, length: i }
        }
        I.prototype._calculateRequiredGroupExpansion = function (e, t, i, r) {
            var s = { groupId_Missing: null, length_Missing: 0 }
            var n = this
            var a = function (e, t, i, r) {
                var o = n._getGroupIdLevel(e)
                if (o == t) {
                    var u = n._getLoadedContextsForGroup(e, i, r)
                    var l = i + u.length - 1
                    if (u.length >= r) {
                        return s
                    } else if (n.mFinalLength[e]) {
                        if (u.length >= n.mLength[e]) {
                            return {
                                groupId_Missing: null,
                                length_Missing: r - u.length
                            }
                        } else {
                            return {
                                groupId_Missing: e,
                                startIndex_Missing: l + 1,
                                length_Missing: r - u.length
                            }
                        }
                    } else {
                        return {
                            groupId_Missing: e,
                            startIndex_Missing: l + 1,
                            length_Missing: r - u.length
                        }
                    }
                }
                var d = n._getLoadedContextsForGroup(e, i, r)
                var h = r,
                    p = i + d.length - 1
                for (var f = -1, g; (g = d[++f]) !== undefined; ) {
                    h--
                    var y = a(n._getGroupIdFromContext(g, o + 1), t, 0, h)
                    if (y.groupId_Missing == null) {
                        if (y.length_Missing == 0) {
                            return y
                        } else {
                            h = y.length_Missing
                        }
                    } else {
                        return y
                    }
                    if (h == 0) {
                        break
                    }
                }
                if (n.mFinalLength[e] || h == 0) {
                    return { groupId_Missing: null, length_Missing: h }
                } else {
                    return {
                        groupId_Missing: e,
                        startIndex_Missing: p + 1,
                        length_Missing: h
                    }
                }
            }
            var o = this._getGroupIdLevel(e)
            if (o == t + 1) {
                e = this._getParentGroupId(e)
                --o
            }
            if (e == null || o > t) {
                return s
            }
            var u = r,
                l = i
            while (e != null) {
                var d = a(e, t, l, u)
                if (d.groupId_Missing != null) {
                    return d
                } else if (d.length_Missing == 0) {
                    return d
                } else {
                    var h = false
                    while (!h) {
                        var p = this._getParentGroupId(e)
                        if (p == null) {
                            e = p
                            --o
                            break
                        }
                        var f = this.mEntityKey[e]
                        if (!f) {
                            return s
                        }
                        var g = this._findKeyIndex(p, f)
                        if (g == -1) {
                            return s
                        }
                        if (g == this._getKeyCount(p) - 1) {
                            if (this.mFinalLength[p]) {
                                e = p
                                --o
                                continue
                            } else {
                                return {
                                    groupId_Missing: p,
                                    startIndex_Missing: g + 1,
                                    length_Missing: u
                                }
                            }
                        } else {
                            f = this._getKey(p, g + 1)
                            e = this._getGroupIdFromContext(
                                this.oModel.getContext("/" + f),
                                o
                            )
                            h = true
                        }
                    }
                    l = 0
                    u = d.length_Missing
                }
            }
            return { groupId_Missing: null, length_Missing: u }
        }
        I.prototype._getResourcePath = function () {
            return this.isRelative() ? this.getResolvedPath() : this.sPath
        }
        I.prototype._getEntitySet = function () {
            var e = this.sEntitySetName
            if (!e) {
                e = this.sPath.split("/")[1]
                if (e.indexOf("(") != -1) {
                    e = e.split("(")[0] + "Results"
                }
            }
            return e
        }
        I.prototype._getEffectiveSortOrder = function (e) {
            for (var t = 0; t < this.aSorter.length; t++) {
                if (this.aSorter[t] && this.aSorter[t].sPath == e) {
                    return this.aSorter[t].bDescending
                        ? l.SortOrder.Descending
                        : l.SortOrder.Ascending
                }
            }
            return null
        }
        I.prototype._getFilterOperatorMatchingPropertySortOrder = function (
            e,
            t
        ) {
            var i
            switch (this._getEffectiveSortOrder(e)) {
                case l.SortOrder.Ascending:
                    if (t) {
                        i = r.GE
                    } else {
                        i = r.GT
                    }
                    break
                case l.SortOrder.Descending:
                    if (t) {
                        i = r.LE
                    } else {
                        i = r.LT
                    }
                    break
                default:
                    i = r.GT
            }
            return i
        }
        I.prototype._convertDeprecatedFilterObjects = function (e) {
            if (!e) {
                return e
            }
            var t = sap.ui.require("sap/ui/model/odata/Filter")
            if (typeof t === "function") {
                for (var i = 0, r = e.length; i < r; i++) {
                    if (e[i] instanceof t) {
                        e[i] = e[i].convert()
                    }
                }
            }
            return e
        }
        I.prototype._getGroupIdFromContext = function (e, t) {
            if (!e) {
                return null
            }
            var i = "/"
            var r = null
            if (t > this.aAggregationLevel.length) {
                v.fatal(
                    "assertion failed: aggregation level deeper than number of current aggregation levels"
                )
            }
            for (var s = 0; s < t; s++) {
                r = e.getProperty(this.aAggregationLevel[s])
                if (r != null) {
                    if (r.__edmType === "Edm.Time") {
                        r = r.ms
                    }
                    i += encodeURIComponent(r) + "/"
                } else {
                    i += "@/"
                }
            }
            return i
        }
        I.prototype._getGroupIdLevel = function (e) {
            if (e == null) {
                v.fatal(
                    "assertion failed: no need to determine level of group ID = null"
                )
                return -1
            }
            return e.split("/").length - 2
        }
        I.prototype._getGroupIdComponents = function (e) {
            if (e == null) {
                return null
            }
            var t = e.split("/")
            var i = []
            for (var r = 1; r < t.length - 1; r++) {
                if (t[r] == "@") {
                    i[r - 1] = null
                } else {
                    i[r - 1] = decodeURIComponent(t[r])
                }
            }
            return i
        }
        I.prototype._getGroupIdAncestors = function (e, t) {
            if (!t) {
                return []
            }
            if (e == null) {
                v.fatal("group ID null does not have ancestors")
                return []
            }
            if (e == "/") {
                if (Math.abs(t) == 1) {
                    return [null]
                } else {
                    v.fatal(
                        "invalid level count " +
                            t +
                            " for ancestors of groupId " +
                            e
                    )
                    return []
                }
            }
            var i = e.split("/")
            var r = [],
                s = ""
            var n = 0,
                a = i.length - 3
            if (t > 0) {
                if (t - 1 > a) {
                    v.fatal(
                        "invalid level count " +
                            t +
                            " for ancestors of groupId " +
                            e
                    )
                } else {
                    a = t - 1
                }
            } else if (-(t + 1) > a) {
                v.fatal(
                    "invalid level count " +
                        t +
                        " for ancestors of groupId " +
                        e
                )
            } else {
                n = a + 1 + t
                for (var o = 0; o < n; o++) {
                    s += i[o] + "/"
                }
            }
            for (var u = n; u <= a; u++) {
                s += i[u] + "/"
                r.push(s)
            }
            return r
        }
        I.prototype._getParentGroupId = function (e) {
            return this._getGroupIdAncestors(e, -1)[0]
        }
        I.prototype._removeDuplicatesFromStringArray = function (e) {
            var t = {}
            for (var i = 0; i < e.length; i++) {
                t[e[i]] = true
            }
            var r = []
            for (var s in t) {
                r.push(s)
            }
            return r
        }
        I.prototype._getIdForNewRequestHandle = function () {
            if (this.oPendingRequestHandle === undefined) {
                this.oPendingRequestHandle = []
            }
            for (var e = 0; e < this.oPendingRequestHandle.length; e++) {
                if (this.oPendingRequestHandle[e] === undefined) {
                    return e
                }
            }
            this.oPendingRequestHandle[
                this.oPendingRequestHandle.length
            ] = undefined
            return this.oPendingRequestHandle.length - 1
        }
        I.prototype._registerNewRequestHandle = function (e, t) {
            if (this.oPendingRequestHandle[e] !== undefined) {
                v.fatal("request handle ID already in use")
            }
            this.oPendingRequestHandle[e] = t
        }
        I.prototype._deregisterHandleOfCompletedRequest = function (e) {
            if (p(this.oPendingRequestHandle)) {
                v.warning(
                    "No request handles to be cleared. Previous abort/resetData?"
                )
                return
            }
            if (this.oPendingRequestHandle[e] === undefined) {
                v.fatal("no handle found for this request ID")
            }
            this.oPendingRequestHandle[e] = undefined
        }
        I.prototype._abortAllPendingRequestsByHandle = function () {
            for (var e = 0; e < this.oPendingRequestHandle.length; e++) {
                if (this.oPendingRequestHandle[e]) {
                    if (this.oPendingRequestHandle[e] !== undefined) {
                        this.oPendingRequestHandle[e].abort()
                    }
                }
            }
            this.oPendingRequestHandle = []
        }
        I.prototype._getRequestId = function (e, t) {
            switch (e) {
                case I._requestType.groupMembersQuery:
                    if (t.groupId === undefined) {
                        v.fatal("missing group ID")
                    }
                    return (
                        I._requestType.groupMembersQuery +
                        (t.groupId == null ? "" : t.groupId)
                    )
                case I._requestType.levelMembersQuery:
                    if (t.level === undefined) {
                        v.fatal("missing level")
                    }
                    if (t.groupId === undefined) {
                        v.fatal("missing groupId")
                    }
                    return (
                        "" +
                        I._requestType.levelMembersQuery +
                        t.level +
                        (t.tupleIndex ? "-" + t.tupleIndex : "")
                    )
                case I._requestType.totalSizeQuery:
                    return I._requestType.totalSizeQuery
                case I._requestType.reloadMeasuresQuery:
                    if (!t.multiUnitEntryKey) {
                        v.fatal("missing multi unit entry key")
                    }
                    return (
                        I._requestType.reloadMeasuresQuery + t.multiUnitEntryKey
                    )
                default:
                    v.fatal("invalid request type " + e)
                    return -1
            }
        }
        I.prototype._registerNewRequest = function (e) {
            if (e == undefined || e == "") {
                v.fatal("missing request ID")
                return
            }
            if (!this.oPendingRequests[e]) {
                this.oPendingRequests[e] = 1
            } else {
                ++this.oPendingRequests[e]
            }
        }
        I.prototype._considerRequestGrouping = function (e) {
            for (var t = -1, i; (i = e[++t]) !== undefined; ) {
                if (this.oGroupedRequests[i] === undefined) {
                    this.oGroupedRequests[i] = {}
                }
                var r = this.oGroupedRequests[i]
                for (var s = 0; s < e.length; s++) {
                    r[e[s]] = true
                }
            }
        }
        I.prototype._isRequestPending = function (e) {
            return (
                this.oPendingRequests[e] != undefined &&
                this.oPendingRequests[e] > 0
            )
        }
        I.prototype._deregisterCompletedRequest = function (e) {
            if (p(this.oPendingRequests)) {
                v.warning(
                    "There are no pending requests which could be set to 'completed'."
                )
                return
            }
            if (!this.oPendingRequests[e]) {
                v.fatal("assertion failed: there is no pending request ID " + e)
            }
            if (this.oPendingRequests[e] == 1) {
                delete this.oPendingRequests[e]
            } else {
                --this.oPendingRequests[e]
            }
        }
        I.prototype._cleanupGroupingForCompletedRequest = function (e) {
            if (this._isRequestPending(e)) {
                return false
            }
            var t = true
            if (this.oGroupedRequests[e] != undefined) {
                for (var i in this.oGroupedRequests[e]) {
                    if (this.oPendingRequests[i]) {
                        t = false
                        break
                    }
                }
            }
            if (t) {
                var r = this.oGroupedRequests[e]
                delete this.oGroupedRequests[e]
                for (var s in r) {
                    if (s != e) {
                        this._cleanupGroupingForCompletedRequest(s)
                    }
                }
            }
            return t
        }
        I.prototype._getKeyIndexMapping = function (e, t) {
            var i,
                r,
                s,
                n = this.mKeyIndex[e],
                a = { sGroupId: e, iIndex: t, iServiceKeyIndex: t },
                o = this.mServiceKey[e]
            if (n !== undefined) {
                if (n[t] !== undefined) {
                    a.iServiceKeyIndex = n[t] === "ZERO" ? 0 : Math.abs(n[t])
                    return a
                }
                r = t
                if (r > 0) {
                    while (--r > 0) {
                        if (n[r] !== undefined) {
                            break
                        }
                    }
                }
                if (r == 0) {
                    s = 0
                } else {
                    if (n[r] >= 0) {
                        s = n[r]
                    } else if (n[r + 1] === undefined) {
                        s = -n[r]
                        while (o[s + 1] !== undefined) {
                            ++s
                        }
                    } else {
                        s = Math.abs(n[r + 1]) - 1
                    }
                    if (o[s] === undefined) {
                        v.fatal(
                            "assertion failed: no service key at iLastOccupiedServiceKeyIndex = " +
                                s
                        )
                    }
                }
                i = t - r
                a.iServiceKeyIndex = s + i
            }
            return a
        }
        I.prototype._moveKeyIndexMapping = function (e, t) {
            return this._getKeyIndexMapping(e.sGroupId, e.iIndex + t)
        }
        I.prototype._getKey = function (e, t) {
            var i = this.mKeyIndex[e][t]
            if (i === undefined) {
                return undefined
            }
            if (i >= 0) {
                return this.mServiceKey[e][i]
            }
            if (this.mMultiUnitKey[e] === undefined) {
                v.fatal(
                    "assertion failed: missing expected multi currency key for group with ID " +
                        e
                )
                return null
            }
            var r = this.mMultiUnitKey[e][t]
            if (r === undefined) {
                v.fatal(
                    "assertion failed: missing expected multi currency key for group with ID " +
                        e +
                        " at pos " +
                        t
                )
                return null
            }
            return r
        }
        I.prototype._getKeys = function (e) {
            if (this.mKeyIndex[e] === undefined) {
                return undefined
            }
            var t = this
            return function (i) {
                return t._getKey(e, i)
            }
        }
        I.prototype._getServiceKeys = function (e, t) {
            var i = this.mKeyIndex[e]
            if (i === undefined) {
                return undefined
            }
            var r = this.mServiceKey[e],
                s = i[t]
            if (s === undefined) {
                return undefined
            }
            if (s >= 0) {
                return [r[s]]
            }
            var n = []
            if (i[t + 1] === undefined) {
                s = i[t] == "ZERO" ? 0 : -i[t]
                while (r[s] !== undefined) {
                    n.push(r[s++])
                }
            } else {
                s = i[t] == "ZERO" ? 0 : -i[t]
                for (var a = s, o = Math.abs(i[t + 1]); a < o; a++) {
                    n.push(r[a])
                }
            }
            return n
        }
        I.prototype._getKeyCount = function (e) {
            if (this.mKeyIndex[e] === undefined) {
                return undefined
            }
            return this.mKeyIndex[e].length
        }
        I.prototype._findKeyIndex = function (e, t) {
            var i = this.mKeyIndex[e]
            var r = this.mServiceKey[e]
            var s = this.mMultiUnitKey[e]
            for (var n = 0; n < this.mLength[e]; n++) {
                if (i[n] < 0 || i[n] === "ZERO") {
                    if (s[n] == t) {
                        return n
                    }
                } else if (r[i[n]] == t) {
                    return n
                }
            }
            return -1
        }
        I.prototype._setServiceKey = function (e, t) {
            if (!this.mServiceKey[e.sGroupId]) {
                this.mServiceKey[e.sGroupId] = []
            }
            if (!this.mKeyIndex[e.sGroupId]) {
                this.mKeyIndex[e.sGroupId] = []
            }
            var i =
                this.mServiceKey[e.sGroupId][e.iServiceKeyIndex] === undefined
            this.mServiceKey[e.sGroupId][e.iServiceKeyIndex++] = t
            this.mKeyIndex[e.sGroupId][e.iIndex++] = e.iServiceKeyIndex - 1
            return i
        }
        I.prototype._setAdjacentMultiUnitKeys = function (e, t, i) {
            if (!this.mServiceKey[e.sGroupId]) {
                this.mServiceKey[e.sGroupId] = []
            }
            if (!this.mKeyIndex[e.sGroupId]) {
                this.mKeyIndex[e.sGroupId] = []
            }
            if (!this.mMultiUnitKey[e.sGroupId]) {
                this.mMultiUnitKey[e.sGroupId] = []
            }
            --e.iIndex
            --e.iServiceKeyIndex
            this.mMultiUnitKey[e.sGroupId][e.iIndex] = this.oModel._getKey(
                t.oEntry
            )
            this.mKeyIndex[e.sGroupId][e.iIndex++] =
                e.iServiceKeyIndex > 0 ? -e.iServiceKeyIndex : "ZERO"
            var r = 0
            for (var s = 0; s < i.length; s++) {
                if (!this.mServiceKey[e.sGroupId][e.iServiceKeyIndex]) {
                    ++r
                }
                this.mServiceKey[e.sGroupId][
                    e.iServiceKeyIndex++
                ] = this.oModel._getKey(i[s])
            }
            return r
        }
        I.prototype._mergeLoadedKeyIndexWithSubsequentIndexes = function (
            e,
            t,
            i,
            r
        ) {
            var s = this.mKeyIndex[e.sGroupId],
                n = this.mServiceKey[e.sGroupId],
                a = this.mMultiUnitKey[e.sGroupId],
                o = 0,
                u = e.iServiceKeyIndex,
                l = e.iIndex
            var d, h
            if (s === undefined) {
                return o
            }
            var p = false
            var f = n[u - 1],
                g = n[u]
            if (g === undefined) {
                return o
            }
            if (f === undefined) {
                v.fatal(
                    "assertion failed: missing expected entry before given key index"
                )
                return o
            }
            var y = this.oModel.getObject("/" + f)
            var c = this.oModel.getObject("/" + g)
            var m = "",
                _ = ""
            for (var R = 0; R < t.length; R++) {
                m += y[t[R]] + "|"
                _ += c[t[R]] + "|"
            }
            p = m == _
            var I = l
            if (I >= this.mLength[e.sGroupId]) {
                v.fatal(
                    "assertion failed: service key exists,but no corresponding key index found"
                )
                return o
            }
            while (s[I] === undefined || Math.abs(s[I]) < u) {
                ++I
            }
            if (p) {
                if (Math.abs(s[I]) == u && s[I] < 0) {
                    if (I > l) {
                        if (s[l - 1] < 0) {
                            a[I] = undefined
                            s.splice(l, I - l + 1)
                            a.splice(l, I - l + 1)
                        } else {
                            s[l - 1] = -s[l - 1]
                            a[l - 1] = a[I]
                            a[I] = undefined
                            s.splice(l, I - l + 1)
                            a.splice(l, I - l + 1)
                            o = 1
                        }
                    }
                } else if (Math.abs(s[I]) > u) {
                    var M = I - 1
                    if (s[M] > 0) {
                        d = this._createMultiUnitRepresentativeEntry(
                            e.sGroupId,
                            y,
                            i,
                            undefined,
                            r
                        )
                        h = this.oModel._getKey(d.oEntry)
                        s[M] = -s[M]
                        a[M] = h
                        if (M > l) {
                            s.splice(l, M - l)
                            a.splice(l, M - l)
                        }
                        if (d.bIsNewEntry) {
                            o = 1
                        } else {
                            o = 0
                        }
                    } else if (s[l - 1] < 0) {
                        if (I > l) {
                            a[M] = undefined
                            s.splice(l, M - l + 1)
                            a.splice(l, M - l + 1)
                        }
                    } else {
                        s[l - 1] = -s[l - 1]
                        a[l - 1] = a[M]
                        a[M] = undefined
                        s.splice(l, M - l + 1)
                        a.splice(l, M - l + 1)
                    }
                } else if (s[I] == u) {
                    if (I > l) {
                        if (s[l - 1] < 0) {
                            s.splice(l, I - l + 1)
                            a.splice(l, I - l + 1)
                            o = 1
                        } else {
                            d = this._createMultiUnitRepresentativeEntry(
                                e.sGroupId,
                                y,
                                i,
                                undefined,
                                r
                            )
                            h = this.oModel._getKey(d.oEntry)
                            if (!d.bIsNewEntry) {
                                v.fatal(
                                    "assertion failed: multi-unit entry already existed before"
                                )
                            }
                            s[l - 1] = -s[l - 1]
                            a[l - 1] = h
                            s.splice(l, I - l + 1)
                            a.splice(l, I - l + 1)
                            o = 1
                        }
                    }
                } else {
                    v.fatal("assertion failed: uncovered case detected")
                    return o
                }
            } else if (s[I] > u) {
                v.fatal(
                    "unstable query result for group ID " +
                        e.sGroupId +
                        ": entries have been removed or added. Complete reload required"
                )
            } else if (I - l > 0) {
                s.splice(l, I - l)
                a.splice(l, I - l)
            }
            return o
        }
        I.prototype._createMultiUnitRepresentativeEntry = function (
            e,
            t,
            i,
            r,
            s
        ) {
            var n = g.extend(true, {}, t)
            var a = []
            for (var o in this.oMeasureDetailsSet) {
                var u = this.oMeasureDetailsSet[o]
                if (!s && this._isSkippingTotalForMeasure(o)) {
                    if (u.rawValuePropertyName != undefined) {
                        n[u.rawValuePropertyName] = undefined
                    }
                    if (u.formattedValuePropertyName != undefined) {
                        n[u.formattedValuePropertyName] = undefined
                    }
                } else {
                    if (u.rawValuePropertyName != undefined) {
                        n[u.rawValuePropertyName] = null
                    }
                    if (u.formattedValuePropertyName != undefined) {
                        n[u.formattedValuePropertyName] = "*"
                    }
                }
                if (r) {
                    if (
                        !u.unitPropertyName ||
                        r.indexOf(u.unitPropertyName) == -1
                    ) {
                        a.push(u.rawValuePropertyName || u.name)
                    }
                }
            }
            for (var l = 0; l < i.length; l++) {
                if (r.indexOf(i[l]) != -1) {
                    n[i[l]] = "*"
                }
            }
            var d = ""
            for (var h = 0; h < this.aAllDimensionSortedByName.length; h++) {
                var p = n[this.aAllDimensionSortedByName[h]]
                var f = p === "" ? '""' : p
                f = f === undefined ? "" : f
                d += encodeURIComponent(f) + ","
            }
            d += "-multiple-units-not-dereferencable"
            var y
            if (
                this.mMultiUnitKey[e] &&
                (y = this.mMultiUnitKey[e].indexOf(d)) != -1
            ) {
                return {
                    oEntry: this.oModel.getObject("/" + d),
                    bIsNewEntry: false,
                    iIndex: y,
                    aReloadMeasurePropertyName: a
                }
            }
            n.__metadata.uri = d
            delete n.__metadata["self"]
            delete n.__metadata["self_link_extensions"]
            n["^~volatile"] = true
            this.oModel._importData(n, {}, {})
            var c = this.oModel._getKey(n)
            this.oModel.getContext("/" + c)["_volatile"] = true
            return {
                oEntry: n,
                bIsNewEntry: true,
                aReloadMeasurePropertyName: a
            }
        }
        I.prototype._clearAllPendingRequests = function () {
            this.oPendingRequests = {}
            this.oGroupedRequests = {}
        }
        I.prototype.resetData = function (e) {
            var t = e ? e.getPath() : undefined
            this._resetData(t)
        }
        I.prototype._resetData = function (e) {
            if (e) {
                delete this.mServiceKey[e]
                delete this.mServiceLength[e]
                delete this.mServiceFinalLength[e]
                delete this.mKeyIndex[e]
                delete this.mLength[e]
                delete this.mMultiUnitKey[e]
                delete this.mEntityKey[e]
            } else {
                this.mServiceKey = {}
                this.mServiceLength = {}
                this.mServiceFinalLength = {}
                this.mFinalLength = this.mServiceFinalLength
                this.mKeyIndex = {}
                this.mLength = {}
                this.mMultiUnitKey = {}
                this.mEntityKey = {}
            }
        }
        I.prototype.refresh = function (e) {
            I.prototype._refresh.apply(this, arguments)
        }
        I.prototype._refresh = function (e, i, r) {
            var s = false
            if (!e) {
                if (r) {
                    var n = this.getResolvedPath()
                    var a = this.oModel.oMetadata._getEntityTypeByPath(n)
                    if (a && a.entityType in r) {
                        s = true
                    }
                }
                if (i && !s) {
                    g.each(this.mServiceKey, function (e, t) {
                        g.each(t, function (e, t) {
                            if (t in i) {
                                s = true
                                return false
                            }
                        })
                        if (s) {
                            return false
                        }
                    })
                }
                if (!i && !r) {
                    s = true
                }
            }
            if (e || s) {
                this.iTotalSize = -1
                this._abortAllPendingRequests()
                this.resetData()
                this.bNeedsUpdate = false
                this._fireRefresh({ reason: t.Refresh })
            }
        }
        I.prototype.checkUpdate = function (e, i) {
            var r = false
            if (!e) {
                if (this.bNeedsUpdate || !i) {
                    r = true
                } else {
                    g.each(this.mServiceKey, function (e, t) {
                        g.each(t, function (e, t) {
                            if (t in i) {
                                r = true
                                return false
                            }
                        })
                        if (r) {
                            return false
                        }
                    })
                }
            }
            if (e || r) {
                this.bNeedsUpdate = false
                this._fireChange({ reason: t.Change })
            }
        }
        I.prototype.getDownloadUrl = function (e) {
            var t, i, r
            var s = new l.QueryResultRequest(this.oAnalyticalQueryResult)
            s.setResourcePath(this._getResourcePath())
            var n = []
            var a = []
            for (var o in this.oDimensionDetailsSet) {
                n.push(o)
            }
            s.setAggregationLevel(n)
            for (var u in this.oDimensionDetailsSet) {
                var d = this.oDimensionDetailsSet[u]
                var h = d.textPropertyName != undefined
                s.includeDimensionKeyTextAttributes(
                    d.name,
                    true,
                    h,
                    d.aAttributeName
                )
            }
            for (var p in this.oMeasureDetailsSet) {
                a.push(p)
            }
            s.setMeasures(a)
            for (var f in this.oMeasureDetailsSet) {
                var g = this.oMeasureDetailsSet[f]
                var y = g.rawValuePropertyName != undefined
                var c = g.formattedValuePropertyName != undefined
                var v = g.unitPropertyName != undefined
                s.includeMeasureRawFormattedValueUnit(g.name, y, c, v)
            }
            var m = s.getSortExpression()
            m.clear()
            for (var _ = 0; _ < this.aSorter.length; _++) {
                if (this.aSorter[_]) {
                    m.addSorter(
                        this.aSorter[_].sPath,
                        this.aSorter[_].bDescending
                            ? l.SortOrder.Descending
                            : l.SortOrder.Ascending
                    )
                }
            }
            var R = s.getFilterExpression()
            R.clear()
            if (this.aApplicationFilter) {
                R.addUI5FilterConditions(this.aApplicationFilter)
            }
            if (this.aControlFilter) {
                R.addUI5FilterConditions(this.aControlFilter)
            }
            var I = s.getURIToQueryResultEntitySet()
            var M = this._getQueryODataRequestOptions(s, true)
            if (!M) {
                return undefined
            }
            var q = []
            for (var b = 0, x = this.aAnalyticalInfo.length; b < x; b++) {
                var S = this.aAnalyticalInfo[b]
                if (
                    (S.visible || S.inResult) &&
                    S.name !== "" &&
                    S.name !== q[q.length - 1]
                ) {
                    q.push(S.name)
                    if (
                        this.oMeasureDetailsSet[S.name] != undefined &&
                        this.oMeasureDetailsSet[S.name].unitPropertyName !=
                            undefined
                    ) {
                        q.push(this.oMeasureDetailsSet[S.name].unitPropertyName)
                    }
                }
            }
            for (var A = 0, P = M.length; A < P; A++) {
                if (/^\$select/i.test(M[A])) {
                    if (this.mParameters.select) {
                        t = M[A].slice(8).split(",")
                        for (r = 0; r < t.length; r++) {
                            i = t[r]
                            if (q.indexOf(i) === -1) {
                                q.push(i)
                            }
                        }
                    }
                    M[A] = "$select=" + q.join(",")
                    break
                }
            }
            if (e) {
                M.splice(0, 0, "$format=" + encodeURIComponent(e))
            }
            if (this.sCustomParams) {
                M.push(this.sCustomParams)
            }
            if (I) {
                return this.oModel
                    ._createRequestUrl(I, null, M)
                    .replace(/ /g, "%20")
            }
        }
        I.prototype._addSorters = function (e, t) {
            var i = this._canApplySortersToGroups()
                ? [].concat(this.aSorter).concat(t)
                : [].concat(t).concat(this.aSorter)
            i.forEach(function (t) {
                e.addSorter(
                    t.sPath,
                    t.bDescending
                        ? l.SortOrder.Descending
                        : l.SortOrder.Ascending
                )
            })
        }
        I.prototype._canApplySortersToGroups = function () {
            var e = this._autoExpandMode
            if (this.bApplySortersToGroups) {
                if (this.aSorter.length > 0) {
                    if (e !== this.sLastAutoExpandMode && e !== u.Sequential) {
                        v.warning(
                            "Applying sorters to groups is only possible with auto" +
                                " expand mode 'Sequential'; current mode is: " +
                                e,
                            this.sPath
                        )
                    }
                    this.sLastAutoExpandMode = e
                }
                return e === u.Sequential
            }
            return false
        }
        I.prototype._warnNoSortingOfGroups = function (e) {
            var t
            if (this.bApplySortersToGroups) {
                t =
                    "Detected a multi-unit case, so sorting is only possible on leaves"
                if (e) {
                    t += "; " + e
                }
                v.warning(t, this.sPath)
            }
            this.bApplySortersToGroups = false
        }
        I.prototype._isSkippingTotalForMeasure = function (e) {
            var t = this.mAnalyticalInfoByProperty[e]
            return !!t && t.total == false
        }
        I.Logger = v
        return I
    }
)
