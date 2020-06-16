/*!
 * OpenUI5
 * (c) Copyright 2009-2020 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["./library","sap/ui/core/Core","sap/ui/core/Control","sap/ui/Device","sap/m/HeaderContainerItemNavigator","sap/ui/core/delegate/ItemNavigation","sap/ui/core/library","sap/ui/core/IntervalTrigger","sap/ui/base/ManagedObject","sap/ui/core/Icon","./HeaderContainerRenderer","sap/base/Log","sap/ui/events/PseudoEvents","sap/ui/thirdparty/jquery","sap/ui/dom/jquery/control","sap/ui/dom/jquery/scrollLeftRTL","sap/ui/dom/jquery/scrollRightRTL","sap/ui/dom/jquery/Selectors"],function(t,e,r,i,o,s,a,n,l,h,c,g,d,p){"use strict";var f=a.Orientation;var u=r.extend("sap.m.HeaderContainerItemContainer",{metadata:{defaultAggregation:"item",properties:{position:{type:"int",defaultValue:null},setSize:{type:"int",defaultValue:null},ariaLabelledBy:{type:"string",defaultValue:null}},aggregations:{item:{type:"sap.ui.core.Control",multiple:false}}},renderer:function(t,e){var r=e.getAggregation("item");if(!r||!r.getVisible()){return}t.write("<div");t.writeControlData(e);t.addClass("sapMHdrCntrItemCntr");t.addClass("sapMHrdrCntrInner");t.writeAttribute("aria-setsize",e.getSetSize());t.writeAttribute("aria-posinset",e.getPosition());t.writeAttribute("role","listitem");if(e.getAriaLabelledBy()){t.writeAttributeEscaped("aria-labelledby",e.getAriaLabelledBy())}t.writeClasses();t.write(">");t.renderControl(r);t.write("</div>")}});var v=r.extend("sap.m.HeaderContainer",{metadata:{interfaces:["sap.m.ObjectHeaderContainer"],library:"sap.m",properties:{scrollStep:{type:"int",defaultValue:300,group:"Behavior"},scrollStepByItem:{type:"int",defaultValue:1,group:"Behavior"},scrollTime:{type:"int",defaultValue:500,group:"Behavior"},showOverflowItem:{type:"boolean",defaultValue:true,group:"Behavior"},showDividers:{type:"boolean",defaultValue:true,group:"Appearance"},orientation:{type:"sap.ui.core.Orientation",defaultValue:f.Horizontal,group:"Appearance"},backgroundDesign:{type:"sap.m.BackgroundDesign",defaultValue:t.BackgroundDesign.Transparent,group:"Appearance"},width:{type:"sap.ui.core.CSSSize",group:"Appearance"},height:{type:"sap.ui.core.CSSSize",group:"Appearance"}},defaultAggregation:"content",aggregations:{content:{type:"sap.ui.core.Control",multiple:true},_scrollContainer:{type:"sap.m.ScrollContainer",multiple:false,visibility:"hidden"},_prevButton:{type:"sap.ui.core.Control",multiple:false,visibility:"hidden"},_nextButton:{type:"sap.ui.core.Control",multiple:false,visibility:"hidden"}},associations:{ariaLabelledBy:{type:"sap.ui.core.Control",multiple:true,singularName:"ariaLabelledBy"}}}});v.prototype.init=function(){this._aItemEnd=[];this._bRtl=sap.ui.getCore().getConfiguration().getRTL();this._oRb=sap.ui.getCore().getLibraryResourceBundle("sap.m");this._oScrollCntr=new t.ScrollContainer(this.getId()+"-scrl-cntnr",{width:"100%",height:"100%",horizontal:!i.system.desktop});this.setAggregation("_scrollContainer",this._oScrollCntr,true);if(i.system.desktop){this._oArrowPrev=new t.Button({id:this.getId()+"-scrl-prev-button",type:t.ButtonType.Transparent,tooltip:this._oRb.getText("HEADERCONTAINER_BUTTON_PREV_SECTION"),press:function(t){t.cancelBubble();this._scroll(this._getScrollValue(false),this.getScrollTime())}.bind(this)}).addStyleClass("sapMHdrCntrBtn").addStyleClass("sapMHdrCntrLeft");this._oArrowPrev._bExcludeFromTabChain=true;this.setAggregation("_prevButton",this._oArrowPrev,true);this._oArrowNext=new t.Button({id:this.getId()+"-scrl-next-button",type:t.ButtonType.Transparent,tooltip:this._oRb.getText("HEADERCONTAINER_BUTTON_NEXT_SECTION"),press:function(t){t.cancelBubble();this._scroll(this._getScrollValue(true),this.getScrollTime())}.bind(this)}).addStyleClass("sapMHdrCntrBtn").addStyleClass("sapMHdrCntrRight");this._oArrowNext._bExcludeFromTabChain=true;this.setAggregation("_nextButton",this._oArrowNext,true)}else if(i.system.phone||i.system.tablet){this._oArrowPrev=new h({id:this.getId()+"-scrl-prev-button"}).addStyleClass("sapMHdrCntrBtn").addStyleClass("sapMHdrCntrLeft");this.setAggregation("_prevButton",this._oArrowPrev,true);this._oArrowNext=new h({id:this.getId()+"-scrl-next-button"}).addStyleClass("sapMHdrCntrBtn").addStyleClass("sapMHdrCntrRight");this.setAggregation("_nextButton",this._oArrowNext,true)}this._oScrollCntr.addDelegate({onAfterRendering:function(){if(i.system.desktop){var t=this._oScrollCntr.getDomRef("scroll");var e=this._oScrollCntr.$("scroll");var r=e.find(".sapMHrdrCntrInner").attr("tabindex","0");if(!this._oItemNavigation){this._oItemNavigation=new o;this.addDelegate(this._oItemNavigation);this._oItemNavigation.attachEvent(s.Events.BorderReached,this._handleBorderReached,this);this._oItemNavigation.attachEvent(s.Events.AfterFocus,this._handleAfterFocus,this);this._oItemNavigation.attachEvent(s.Events.BeforeFocus,this._handleBeforeFocus,this);if(i.browser.msie||i.browser.edge){this._oItemNavigation.attachEvent(s.Events.FocusAgain,this._handleFocusAgain,this)}}this._oItemNavigation.setRootDomRef(t);this._oItemNavigation.setItemDomRefs(r);this._oItemNavigation.setTabIndex0();this._oItemNavigation.setCycling(false);this._handleMobileScrolling()}}.bind(this)});n.addListener(this._checkOverflow,this)};v.prototype.onBeforeRendering=function(){if(!this.getHeight()){g.warning("No height provided",this)}if(!this.getWidth()){g.warning("No width provided",this)}if(i.system.desktop){this._oArrowPrev.setIcon(this.getOrientation()===f.Horizontal?"sap-icon://slim-arrow-left":"sap-icon://slim-arrow-up");this._oArrowNext.setIcon(this.getOrientation()===f.Horizontal?"sap-icon://slim-arrow-right":"sap-icon://slim-arrow-down")}else if(i.system.phone||i.system.tablet){this._oArrowPrev.setSrc(this.getOrientation()===f.Horizontal?"sap-icon://slim-arrow-left":"sap-icon://slim-arrow-up");this._oArrowNext.setSrc(this.getOrientation()===f.Horizontal?"sap-icon://slim-arrow-right":"sap-icon://slim-arrow-down")}};v.prototype.onAfterRendering=function(){this._bRtl=sap.ui.getCore().getConfiguration().getRTL();this._checkOverflow()};v.prototype.exit=function(){if(this._oItemNavigation){this.removeDelegate(this._oItemNavigation);this._oItemNavigation.destroy();this._oItemNavigation=null}n.removeListener(this._checkOverflow,this)};v.prototype.onsaptabnext=function(t){var e=this.$().find(":focusable");var r=e.index(t.target);var i=e.eq(r+1).get(0);var o=this._getParentCell(t.target);var s;if(i){s=this._getParentCell(i)}if(o&&s&&o.id!==s.id||i&&i.id===this.getId()+"-after"||i&&i.id===this.getId()+"-scrl-prev-button"||i&&i.id===this.getId()+"-scrl-next-button"){var a=e.last().get(0);if(a){this._bIgnoreFocusIn=true;a.focus()}}};v.prototype.onsaptabprevious=function(t){this.$().find(".sapMHdrCntrItemCntr").css("border-color","");var e=this.$().find(":focusable");var r=e.index(t.target);var i=e.eq(r-1).get(0);var o=this._getParentCell(t.target);var s;if(i){s=this._getParentCell(i)}if(!s||o&&o.id!==s.id){var a=this.$().attr("tabindex");this.$().attr("tabindex","0");this.$().trigger("focus");if(!a){this.$().removeAttr("tabindex")}else{this.$().attr("tabindex",a)}}};v.prototype.setOrientation=function(t){this.setProperty("orientation",t);if(t===f.Horizontal&&!i.system.desktop){this._oScrollCntr.setHorizontal(true);this._oScrollCntr.setVertical(false)}else if(!i.system.desktop){this._oScrollCntr.setHorizontal(false);this._oScrollCntr.setVertical(true)}return this};v.prototype.validateAggregation=function(t,e,r){return this._callMethodInManagedObject("validateAggregation",t,e,r)};v.prototype.getAggregation=function(t,e,r){return this._callMethodInManagedObject("getAggregation",t,e,r)};v.prototype.setAggregation=function(t,e,r){return this._callMethodInManagedObject("setAggregation",t,e,r)};v.prototype.indexOfAggregation=function(t,e){return this._callMethodInManagedObject("indexOfAggregation",t,e)};v.prototype.insertAggregation=function(t,e,r,i){return this._callMethodInManagedObject("insertAggregation",t,e,r,i)};v.prototype.addAggregation=function(t,e,r){return this._callMethodInManagedObject("addAggregation",t,e,r)};v.prototype.removeAggregation=function(t,e,r){return this._callMethodInManagedObject("removeAggregation",t,e,r)};v.prototype.removeAllAggregation=function(t,e){return this._callMethodInManagedObject("removeAllAggregation",t,e)};v.prototype.destroyAggregation=function(t,e){return this._callMethodInManagedObject("destroyAggregation",t,e)};v.prototype._setScrollInProcess=function(t){this.bScrollInProcess=t};v.prototype._scroll=function(t,e){this._setScrollInProcess(true);setTimeout(this._setScrollInProcess.bind(this,false),e+300);if(this.getOrientation()===f.Horizontal){this._hScroll(t,e)}else{this._vScroll(t,e)}};v.prototype._vScroll=function(t,e){var r=this._oScrollCntr.getDomRef(),i=r.scrollTop,o=r.scrollHeight,s=i+t,a=r.clientHeight,n=parseFloat(this.$("scroll-area").css("padding-top")),l;if(s<=0){l=this._calculateRemainingScrolling(t,e,i);this.$("scroll-area").css("transition","padding "+l+"s");this.$().removeClass("sapMHrdrTopPadding")}else if(s+a+n>=o){l=this._calculateRemainingScrolling(t,e,o-a-i);this.$("scroll-area").css("transition","padding "+l+"s");if(a+t>o&&a!==o){this.$().removeClass("sapMHrdrBottomPadding");this.$().addClass("sapMHrdrTopPadding")}else{this.$().removeClass("sapMHrdrBottomPadding")}}else{this.$("scroll-area").css("transition","padding "+e/1e3+"s")}this._oScrollCntr.scrollTo(0,s,e)};v.prototype._hScroll=function(t,e){var r=this._oScrollCntr.getDomRef();var o,s,a,n,l,h;if(!this._bRtl){s=r.scrollLeft;n=r.scrollWidth;a=r.clientWidth+(i.browser.msie?1:0);o=s+t;l=parseFloat(this.$("scroll-area").css("padding-left"));if(o<=0){h=this._calculateRemainingScrolling(t,e,s);this.$("scroll-area").css("transition","padding "+h+"s");this.$().removeClass("sapMHrdrLeftPadding")}else if(o+r.clientWidth+l>=n){h=this._calculateRemainingScrolling(t,e,n-a-s);this.$("scroll-area").css("transition","padding "+h+"s");if(a+t>n&&a!==n){this.$().removeClass("sapMHrdrRightPadding");this.$().addClass("sapMHrdrLeftPadding")}else{this.$().removeClass("sapMHrdrRightPadding")}}else{this.$("scroll-area").css("transition","padding "+e/1e3+"s")}this._oScrollCntr.scrollTo(o,0,e)}else{o=p(r).scrollRightRTL()+t;this._oScrollCntr.scrollTo(o>0?o:0,0,e)}};v.prototype._collectItemSize=function(){var t=0,e=this._filterVisibleItems(),r=this.getOrientation()===f.Horizontal?"outerWidth":"outerHeight";this._aItemEnd=[];e.forEach(function(e,i){t+=e.$().parent()[r](true);this._aItemEnd[i]=t},this)};v.prototype._getScrollValue=function(t){if(!this._oScrollCntr){return 0}var e=this.getOrientation()===f.Horizontal,r=this._oScrollCntr.$(),i=this.$("prev-button-container"),o=this.$("next-button-container"),s=e?r[0].scrollLeft:r[0].scrollTop,a=0,n=0,l,h=this._filterVisibleItems();var c=function(t){var r=0,s=0;var a=10;if(this._bRtl&&e){if(!i.is(":visible")){s=i.width()}if(!o.is(":visible")){s=o.width()}}for(var n=0;n<h.length&&n<t;n++){r+=g(h[n])}return r!==0?r+a-s:0}.bind(this);var g=function(t){return e?t.$().parent().outerWidth(true):t.$().parent().outerHeight(true)};var d=function(){var t=this._getSize(true),e,r=0;for(var i=a;i<h.length;i++){if(!h[i].$().is(":visible")){e=g(h[i])+c(i)-t-s;for(var o=a;o<h.length&&o<i;o++){if(l+r>e){break}a++;r+=g(h[o])}l+=r;break}}}.bind(this);if(this.getScrollStepByItem()>0){s=e&&this._bRtl?r.scrollRightRTL():s;for(var p=0;p<h.length;p++){n+=g(h[p]);if(n>=s){a=p;break}}a=(t?1:-1)*this.getScrollStepByItem()+a;if(a<0){a=0}if(a>=h.length){a=h.length-1}l=c(a)-s;if(t&&!this.getShowOverflowItem()){d()}return l}return t?this.getScrollStep():-this.getScrollStep()};v.prototype._calculateRemainingScrolling=function(t,e,r){return Math.abs(r*e/(1e3*t))};v.prototype._checkOverflow=function(){if(this.getOrientation()===f.Horizontal){this._checkHOverflow()}else{this._checkVOverflow()}};v.prototype._filterVisibleItems=function(){return this.getContent().filter(function(t){return t.getVisible()})};v.prototype._getFirstItemOffset=function(t){var e=this._filterVisibleItems()[0],r=e&&e.$(),i=r&&r.parent(),o=i&&i[0]&&i[0][t];return o||0};v.prototype._checkVOverflow=function(){var t=this._oScrollCntr.getDomRef(),e,r;if(t){var i=this._getFirstItemOffset("offsetTop");var o=Math.ceil(t.scrollTop);var s=false;var a=false;var n=t.scrollHeight;var l=t.offsetHeight;if(Math.abs(n-l)===1){n=l}if(o>i){s=true}if(n>l&&o+l<n){a=true}a=this._checkForOverflowItem(a);r=this.$("prev-button-container");e=r.is(":visible");if(e&&!s){r.hide();this.$().removeClass("sapMHrdrTopPadding")}if(!e&&s){r.show();this.$().addClass("sapMHrdrTopPadding")}r=this.$("next-button-container");var h=r.is(":visible");if(h&&!a){r.hide();this.$().removeClass("sapMHrdrBottomPadding")}if(!h&&a){r.show();this.$().addClass("sapMHrdrBottomPadding")}}};v.prototype._handleMobileScrolling=function(){if(e.isMobile()){var t=this.$("scrl-cntnr-scroll"),r=this.getOrientation()===f.Horizontal,i=r?"clientX":"clientY",o=0,s=this,a=false;t.on("touchstart",function(t){a=true;o=t.targetTouches[0][i]});t.on("touchmove",function(t){if(a){var e=t.targetTouches[0][i],n=o-e,l=s._oScrollCntr.getDomRef();r?l.scrollLeft+=n:l.scrollTop+=n;o=e;t.preventDefault()}});t.on("touchend",function(){a=false})}};v.prototype._checkHOverflow=function(){var t=this._oScrollCntr.getDomRef(),e;if(t){var r=this._getFirstItemOffset("offsetLeft");var o=Math.ceil(t.scrollLeft);var s=false;var a=false;var n=t.scrollWidth;var l=t.offsetWidth;if(Math.abs(n-l)===1){n=l}if(this._bRtl){var h=p(t).scrollLeftRTL();if(h>(i.browser.msie||i.browser.edge?1:0)){a=true}}else if(o>r){s=true}if(n-5>l){if(this._bRtl){if(p(t).scrollRightRTL()>1){s=true}}else if(o+l<n){a=true}}e=this.$("prev-button-container");a=this._checkForOverflowItem(a);var c=e.is(":visible");if(c&&!s){e.hide();this.$().removeClass("sapMHrdrLeftPadding")}if(!c&&s){e.show();this.$().addClass("sapMHrdrLeftPadding")}e=this.$("next-button-container");var g=e.is(":visible");if(g&&!a){e.hide();this.$().removeClass("sapMHrdrRightPadding")}if(!g&&a){e.show();this.$().addClass("sapMHrdrRightPadding")}}};v.prototype._getSize=function(t){var e=this._oScrollCntr.$(),r=this.getOrientation()===f.Horizontal,i=this.$("next-button-container"),o=!i.is(":visible")&&t,s=r?"width":"height";return e[s]()-(o?i[s]():0)};v.prototype._checkForOverflowItem=function(t){if(this._oScrollCntr&&!this.getShowOverflowItem()){var e=this._oScrollCntr.$(),r=this.getOrientation()===f.Horizontal,i=!r?e[0].scrollTop:this._bRtl?e.scrollRightRTL():e[0].scrollLeft,o=r?"width":"height",s=this._getSize(t),a=this._filterVisibleItems();this._collectItemSize();this._aItemEnd.forEach(function(e,r){var n=a[r].$(),l=n.parent(),h=n.is(":visible");if(t&&e>i+s){if(r===0||this._aItemEnd[r-1]<=i){l.css(o,"auto");n.show()}else if(h){l[o](l[o]());n.hide();t=true}}else{if(!h){l.css(o,"auto");n.show()}}},this)}return t};v.prototype._handleBorderReached=function(t){if(i.browser.msie&&this.bScrollInProcess){return}var e=t.getParameter("index");if(e===0){this._scroll(this._getScrollValue(false),this.getScrollTime())}else if(e===this._filterVisibleItems().length-1){this._scroll(this._getScrollValue(true),this.getScrollTime())}};v.prototype._handleAfterFocus=function(t){var e=t.getParameter("event");if((i.browser.msie||i.browser.edge)&&e.type==="mousedown"&&e.srcControl instanceof sap.m.Input){e.srcControl.focus()}if(i.browser.msie&&this.bScrollInProcess){return}var r=t.getParameter("index");if(r===0){this._scroll(this._getScrollValue(false),this.getScrollTime())}else if(r===this._filterVisibleItems().length-1){this._scroll(this._getScrollValue(true),this.getScrollTime())}};v.prototype._handleFocusAgain=function(t){var e=t.getParameter("event");if((i.browser.msie||i.browser.edge)&&e.type==="mousedown"&&e.srcControl instanceof sap.m.Input){e.srcControl.focus()}t.getParameter("event").preventDefault()};v.prototype._handleBeforeFocus=function(t){var e=t.getParameter("event");if(p(e.target).hasClass("sapMHdrCntrItemCntr")||p(e.target).hasClass("sapMScrollContScroll")||d.events.sapprevious.fnCheck(e)||d.events.sapnext.fnCheck(e)){this.$().find(".sapMHdrCntrItemCntr").css("border-color","")}else{this.$().find(".sapMHdrCntrItemCntr").css("border-color","transparent")}};v.prototype._unWrapHeaderContainerItemContainer=function(t){if(t instanceof u){t=t.getItem()}else if(Array.isArray(t)){for(var e=0;e<t.length;e++){if(t[e]instanceof u){t[e]=t[e].getItem()}}}return t};v._AGGREGATION_FUNCTIONS=["validateAggregation","validateAggregation","getAggregation","setAggregation","indexOfAggregation","removeAggregation"];v._AGGREGATION_FUNCTIONS_FOR_INSERT=["insertAggregation","addAggregation"];v.prototype._callMethodInManagedObject=function(t,e){var i=Array.prototype.slice.call(arguments);if(e==="content"){var o=i[2];i[1]="content";if(o instanceof r){if((v._AGGREGATION_FUNCTIONS?Array.prototype.indexOf.call(v._AGGREGATION_FUNCTIONS,t):-1)>-1&&o.getParent()instanceof u){i[2]=o.getParent()}else if((v._AGGREGATION_FUNCTIONS_FOR_INSERT?Array.prototype.indexOf.call(v._AGGREGATION_FUNCTIONS_FOR_INSERT,t):-1)>-1){i[2]=new u({item:o})}}var s=this._oScrollCntr[t].apply(this._oScrollCntr,i.slice(1));if(t!=="removeAllAggregation"){var a=this._oScrollCntr.getContent();var n=this.getAriaLabelledBy();for(var h=0;h<a.length;h++){var c=a[h];c.setPosition(h+1);c.setSetSize(a.length);c.setAriaLabelledBy(n[h])}}return this._unWrapHeaderContainerItemContainer(s)}else{return l.prototype[t].apply(this,i.slice(1))}};v.prototype._getParentCell=function(t){return p(t).parents(".sapMHrdrCntrInner").andSelf(".sapMHrdrCntrInner").get(0)};v.prototype.onfocusin=function(t){if(this._bIgnoreFocusIn){this._bIgnoreFocusIn=false;return}if(t.target.id===this.getId()+"-after"){this._restoreLastFocused()}};v.prototype._restoreLastFocused=function(){if(!this._oItemNavigation){return}var t=this._oItemNavigation.getItemDomRefs();var e=this._oItemNavigation.getFocusedIndex();var r=p(t[e]);var i=r.control(0)||{};var o=i.getTabbables?i.getTabbables():r.find(":sapTabbable");o.eq(-1).add(r).eq(-1).trigger("focus")};return v});