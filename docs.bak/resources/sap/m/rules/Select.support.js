/*!
 * OpenUI5
 * (c) Copyright 2009-2021 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/support/library","sap/ui/model/BindingMode"],function(e,t){"use strict";var i=e.Categories,n=e.Severity,o=e.Audiences;var s=100;var d={id:"selectItemsSizeLimit",audiences:[o.Control],categories:[i.Usability],enabled:true,minversion:"1.28",title:"Select: Items have size limit of 100",description:"The 'items' model imposes a default size limit of 100",resolution:"Use the sap.ui.model.Model.prototype.setSizeLimit to adjust the size limit of the 'items' model if you expect more than 100 items",resolutionurls:[{text:"API Reference for sap.ui.model.Model",href:"https://sapui5.hana.ondemand.com/#/api/sap.ui.model.Model"}],check:function(e,t,i){i.getElementsByClassName("sap.m.Select").forEach(function(t){var i=t.getBinding("items"),o=i&&i.oModel;if(o&&o.iSizeLimit===s){var d=t.getId(),a=t.getMetadata().getElementName();e.addIssue({severity:n.Low,details:"Select '"+a+"' ("+d+") model has a default limit of 100 items",context:{id:d}})}})}};var a={id:"selectedKeyBindingRule",audiences:[o.Control],categories:[i.Bindings],enabled:true,minversion:"1.64",title:"Select: 'selectedKey' property incorrectly bound to item which is bound to the 'items' aggregation",description:"Binding the 'selectedKey' property to the 'items' aggregation results in a non-working Select "+"control in TwoWay binding mode. When the user changes the selected item, the key of the bound item "+"(under the list bound to the 'items' aggregation) also changes, resulting in an incorrect change of the "+"selected item.",resolution:"If binding of 'selectedKey' is necessary, bind it to a model entry which is not bound to the "+"'items' aggregation of the Select control.",check:function(e,i,o){o.getElementsByClassName("sap.m.Select").forEach(function(i){var o,s,d,a,l,r,c;if(i.isBound("selectedKey")&&i.isBound("items")){d=i.getBinding("selectedKey").getModel();a=i.getBinding("items").getModel();if(d&&a&&d.getId()===a.getId()&&d.getDefaultBindingMode()===t.TwoWay){l=i.getBindingPath("selectedKey");r=i.getBindingPath("items");c=l.replace(r,"");if(l.indexOf(r)===0&&c.length>0&&c[0]==="/"){o=i.getId();s=i.getMetadata().getElementName();e.addIssue({severity:n.High,details:"Select '"+s+"' ("+o+") 'selectedKey' property incorrectly bound to item which is bound to the 'items' aggregation",context:{id:o}})}}}})}};return[d,a]},true);