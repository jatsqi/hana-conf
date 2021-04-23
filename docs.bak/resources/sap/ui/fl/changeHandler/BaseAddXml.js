/*!
 * OpenUI5
 * (c) Copyright 2009-2021 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/changeHandler/Base","sap/base/util/LoaderExtensions","sap/ui/fl/changeHandler/common/revertAddedControls"],function(e,t,r){"use strict";var n={};n.applyChange=function(r,a,o,i){var g=e.instantiateFragment(r,o);var s=o.modifier;var f=o.view;var c=i.aggregationName;var h=s.findAggregation(a,c);if(!h){n._destroyArrayOfControls(g);throw new Error("The given Aggregation is not available in the given control: "+s.getId(a))}var d=r.getModuleName();var u=t.loadResource(d,{dataType:"text"});var l=i.index;var m=[];g.forEach(function(e,t){if(!s.validateType(e,h,a,u,t)){n._destroyArrayOfControls(g);throw new Error("The content of the xml fragment does not match the type of the targetAggregation: "+h.type)}});g.forEach(function(e,t){s.insertAggregation(a,c,e,l+t,f,i.skipAdjustIndex);m.push({id:s.getId(e),aggregationName:c})});r.setRevertData(m);return g};n.revertChange=r;n._throwMissingAttributeError=function(e){throw new Error("Attribute missing from the change specific content'"+e+"'")};n._destroyArrayOfControls=function(e){e.forEach(function(e){if(e.destroy){e.destroy()}})};n.completeChangeContent=function(e,t,r){if(!r){r=e.getDefinition();if(!r.content){r.content={}}}if(t.fragmentPath){r.content.fragmentPath=t.fragmentPath}else{n._throwMissingAttributeError("fragmentPath")}var a=r.reference.replace(/\.Component/g,"").replace(/\./g,"/");a+="/changes/";a+=r.content.fragmentPath;e.setModuleName(a)};return n},true);