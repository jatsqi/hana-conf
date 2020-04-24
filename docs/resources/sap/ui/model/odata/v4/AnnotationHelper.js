/*!
 * OpenUI5
 * (c) Copyright 2009-2020 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["./_AnnotationHelperExpression"],function(e){"use strict";var t=/[\\\{\}:]/,n=/\/\$count$/,r=/\$(?:(?:Annotation)|(?:(?:Navigation)?Property))?Path/,i=/^(.+?\/(\$(?:Annotation)?Path))(\/?)(.*)$/,a=/\$(?:Navigation)?PropertyPath/,o={format:function(t,n){var r,o=n.context.getModel(),s=n.context.getPath();function l(r){if(s.slice(-1)==="/"){s=s.slice(0,-1)}return e.getExpression({asExpression:false,complexBinding:true,formatOptions:n.arguments&&n.arguments[1],ignoreAsPrefix:n.overload&&n.overload.$IsBound&&!s.includes("/$Parameter/")?n.overload.$Parameter[0].$Name+"/":"",model:o,parameters:n.arguments&&n.arguments[0],path:s,prefix:r,value:t,$$valueAsPromise:true})}r=a.exec(s);if(r){throw new Error("Unsupported path segment "+r[0]+" in "+s)}r=i.exec(s);if(r&&s.length>r[1].length){if(i.test(r[4])){throw new Error("Only one $Path or $AnnotationPath segment is supported: "+s)}return o.fetchObject(r[1]).then(function(e){var t,n=r[2]==="$AnnotationPath",i=n?e.split("@")[0]:e;if(!n&&r[3]){i=i+"/"}else if(!i.endsWith("/")){t=i.lastIndexOf("/");i=t<0?"":i.slice(0,t+1)}return l(i)})}return l("")},getNavigationBinding:function(e){e=o.getNavigationPath(e);if(t.test(e)){throw new Error("Invalid OData identifier: "+e)}return e?"{"+e+"}":e},getNavigationPath:function(e){var t;if(!e||e[0]==="@"){return""}if(n.test(e)){return e.slice(0,-7)}t=e.indexOf("@");if(t>-1){e=e.slice(0,t)}if(e[e.length-1]==="/"){e=e.slice(0,-1)}if(e.indexOf(".")>-1){e=e.split("/").filter(function(e){return e.indexOf(".")<0}).join("/")}return e},getValueListType:function(e,t){var n=typeof e==="string"?"/"+t.schemaChildName+"/"+e:t.context.getPath();return t.$$valueAsPromise?t.context.getModel().fetchValueListType(n).unwrap():t.context.getModel().getValueListType(n)},isMultiple:function(e,t){var r;function i(e){return e===true}if(!e||e[0]==="@"){return false}if(n.test(e)){return true}r=e.indexOf("@");if(r>-1){e=e.slice(0,r)}if(e[e.length-1]!=="/"){e+="/"}e="/"+t.schemaChildName+"/"+e+"$isCollection";return t.$$valueAsPromise?t.context.getModel().fetchObject(e).then(i).unwrap():t.context.getObject(e)===true},label:function(e,t){var n;if(e.Label){return o.value(e.Label,{context:t.context.getModel().createBindingContext("Label",t.context)})}if(e.Value&&e.Value.$Path){n=t.context.getModel().createBindingContext("Value/$Path@com.sap.vocabularies.Common.v1.Label",t.context);if(t.$$valueAsPromise){return n.getModel().fetchObject("",n).then(function(e){return o.value(e,{context:n})}).unwrap()}return o.value(n.getObject(""),{context:n})}},resolve$Path:function(e){var t,n,i,a,o,s=e.getPath(),l,u;for(;;){o=s.match(r);if(!o){return s}i=o.index;t=i+o[0].length;l=s.slice(0,t);u=e.getModel().getObject(l);if(typeof u!=="string"){throw new Error("Cannot resolve "+l+" due to unexpected value "+u)}l=s.slice(0,i);n=l.indexOf("@");a=l.lastIndexOf("/",n);if(a===0){l=l.slice(0,n);if(n>1&&u){l+="/"}}else{l=l.slice(0,a+1)}s=l+u+s.slice(t)}},value:function(t,n){var r=n.context.getPath();if(r.slice(-1)==="/"){r=r.slice(0,-1)}return e.getExpression({asExpression:false,complexBinding:false,ignoreAsPrefix:n.overload&&n.overload.$IsBound&&!r.includes("/$Parameter/")?n.overload.$Parameter[0].$Name+"/":"",model:n.context.getModel(),parameters:n.arguments&&n.arguments[0],path:r,prefix:"",value:t,$$valueAsPromise:n.$$valueAsPromise})}};return o},true);