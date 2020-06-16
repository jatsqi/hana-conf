/*!
 * OpenUI5
 * (c) Copyright 2009-2020 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/format/NumberFormat","sap/ui/model/SimpleType","sap/ui/model/FormatException","sap/ui/model/ParseException","sap/ui/model/ValidateException","sap/ui/thirdparty/jquery","sap/base/util/isEmptyObject"],function(t,e,o,r,a,i,n){"use strict";var s=e.extend("sap.ui.model.type.Integer",{constructor:function(){e.apply(this,arguments);this.sName="Integer"}});s.prototype.formatValue=function(t,e){var r=t;if(t==undefined||t==null){return null}if(this.oInputFormat){r=this.oInputFormat.parse(t);if(r==null){throw new o("Cannot format float: "+t+" has the wrong format")}}switch(this.getPrimitiveType(e)){case"string":return this.oOutputFormat.format(r);case"int":case"float":case"any":return r;default:throw new o("Don't know how to format Integer to "+e)}};s.prototype.parseValue=function(t,e){var o,a;switch(this.getPrimitiveType(e)){case"string":o=this.oOutputFormat.parse(String(t));if(isNaN(o)){a=sap.ui.getCore().getLibraryResourceBundle();throw new r(a.getText("EnterInt"))}break;case"float":o=Math.floor(t);if(o!=t){a=sap.ui.getCore().getLibraryResourceBundle();throw new r(a.getText("EnterInt"))}break;case"int":o=t;break;default:throw new r("Don't know how to parse Integer from "+e)}if(this.oInputFormat){o=this.oInputFormat.format(o)}return o};s.prototype.validateValue=function(t){if(this.oConstraints){var e=sap.ui.getCore().getLibraryResourceBundle(),o=[],r=[],n=t;if(this.oInputFormat){n=this.oInputFormat.parse(t)}i.each(this.oConstraints,function(t,a){switch(t){case"minimum":if(n<a){o.push("minimum");r.push(e.getText("Integer.Minimum",[a]))}break;case"maximum":if(n>a){o.push("maximum");r.push(e.getText("Integer.Maximum",[a]))}}});if(o.length>0){throw new a(this.combineMessages(r),o)}}};s.prototype.setFormatOptions=function(t){this.oFormatOptions=t;this._createFormats()};s.prototype._handleLocalizationChange=function(){this._createFormats()};s.prototype._createFormats=function(){var e=this.oFormatOptions.source;this.oOutputFormat=t.getIntegerInstance(this.oFormatOptions);if(e){if(n(e)){e={groupingEnabled:false,groupingSeparator:",",decimalSeparator:"."}}this.oInputFormat=t.getIntegerInstance(e)}};return s});