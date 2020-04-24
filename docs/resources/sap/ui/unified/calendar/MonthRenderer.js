/*!
 * OpenUI5
 * (c) Copyright 2009-2020 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/unified/calendar/CalendarUtils","sap/ui/unified/calendar/CalendarDate","sap/ui/unified/CalendarLegend","sap/ui/unified/CalendarLegendRenderer","sap/ui/core/library","sap/ui/unified/library","sap/base/Log","sap/ui/core/InvisibleText"],function(e,a,t,i,n,r,s,l){"use strict";var d=r.CalendarDayType;var o=n.CalendarType;var c={apiVersion:2};c.render=function(e,a){var t=this.getStartDate(a),i=a.getTooltip_AsString(),n=sap.ui.getCore().getLibraryResourceBundle("sap.ui.unified"),r=a.getId(),s={value:"",append:true},d="",o=a.getWidth();e.openStart("div",a);this.getClass(e,a).forEach(function(a){e.class(a)});if(a._getSecondaryCalendarType()){e.class("sapUiCalMonthSecType")}this.addWrapperAdditionalStyles(e,a);if(i){e.attr("title",i)}if(a._getShowHeader()){s.value=s.value+" "+r+"-Head"}if(a._bCalendar){d+=" "+l.getStaticId("sap.ui.unified","CALENDAR_MONTH_PICKER_OPEN_HINT")+" "+l.getStaticId("sap.ui.unified","CALENDAR_YEAR_PICKER_OPEN_HINT")}if(o){e.style("width",o)}e.accessibilityState(a,{role:"grid",roledescription:n.getText("CALENDAR_DIALOG"),multiselectable:!a.getSingleSelection()||a.getIntervalSelection(),labelledby:s,describedby:d});e.openEnd();if(a.getIntervalSelection()){e.openStart("span",r+"-Start");e.style("display","none");e.openEnd();e.text(n.getText("CALENDAR_START_DATE"));e.close("span");e.openStart("span",r+"-End");e.style("display","none");e.openEnd();e.text(n.getText("CALENDAR_END_DATE"));e.close("span")}this.renderMonth(e,a,t);e.close("div")};c.addWrapperAdditionalStyles=function(){};c.getStartDate=function(e){return e._getDate()};c.getClass=function(e,a){var t=["sapUiCalMonthView"],i=a.getPrimaryCalendarType(),n=a.getShowWeekNumbers();if(i===o.Islamic||!n){t.push("sapUiCalNoWeekNum")}return t};c.renderMonth=function(e,a,t){this.renderHeader(e,a,t);this.renderDays(e,a,t)};c.renderHeader=function(e,a,t){var i=a._getLocaleData();var n=a._getFirstDayOfWeek();this.renderHeaderLine(e,a,i,t);e.openStart("div");e.accessibilityState(null,{role:"row"});e.style("overflow","hidden");e.openEnd();this.renderDayNames(e,a,i,n,7,true,undefined);e.close("div")};c.renderHeaderLine=function(a,t,i,n){e._checkCalendarDate(n);if(t._getShowHeader()){var r=t.getId();var s=t.getPrimaryCalendarType();var l=i.getMonthsStandAlone("wide",s);a.openStart("div",r+"-Head");a.class("sapUiCalHeadText");a.openEnd();a.text(l[n.getMonth()]);a.close("div")}};c.renderDayNames=function(e,a,t,i,n,r,s){var l=a._getFirstDayOfWeek();var d=a.getId();var o="";var c=a.getPrimaryCalendarType();var p=[];if(a._bLongWeekDays||!a._bNamesLengthChecked){p=t.getDaysStandAlone("abbreviated",c)}else{p=t.getDaysStandAlone("narrow",c)}var y=t.getDaysStandAlone("wide",c);this.renderDummyCell(e,"sapUiCalWH","columnheader");for(var g=0;g<n;g++){if(r){o=d+"-WH"+(g+l)%7}else{o=d+"-WH"+g}e.openStart("div",o);e.class("sapUiCalWH");if(g===0){e.class("sapUiCalFirstWDay")}if(s){e.style("width",s)}e.accessibilityState(null,{role:"columnheader",label:y[(g+i)%7]});e.openEnd();e.text(p[(g+i)%7]);e.close("div")}};c.renderDays=function(a,t,i){var n,r,s,l,d,c,p;e._checkCalendarDate(i);if(!i){i=t._getFocusedDate()}c=i.toUTCJSDate().getTime();if(!c&&c!==0){throw new Error("Date is invalid "+t)}l=this.getDayHelper(t,i);r=t._getVisibleDays(i,true);p=t.getShowWeekNumbers();n=t.getPrimaryCalendarType()!==o.Islamic&&p;s=r.length;for(d=0;d<s;d++){if(d%7===0){a.openStart("div");a.attr("role","row");a.openEnd();if(n){this._renderWeekNumber(a,r[d],l)}}this.renderDay(a,t,r[d],l,true,n,-1);if(d%7===6){a.close("div")}}if(s===28){this.renderDummyCell(a,"sapUiCalItem","")}};c.renderDummyCell=function(e,a,t){e.openStart("div");e.class(a);e.attr("role",t);e.style("visibility","hidden");e.attr("tabindex","-1");e.openEnd();e.close("div")};c.getDayHelper=function(e,i){var n,r,l=e._getLocaleData(),d={sLocale:e._getLocale(),oLocaleData:l,iMonth:i.getMonth(),iYear:i.getYear(),iFirstDayOfWeek:e._getFirstDayOfWeek(),iWeekendStart:l.getWeekendStart(),iWeekendEnd:l.getWeekendEnd(),aNonWorkingDays:e._getNonWorkingDays(),sToday:l.getRelativeDay(0),oToday:a.fromLocalJSDate(new Date,e.getPrimaryCalendarType()),sId:e.getId(),oFormatLong:e._getFormatLong(),sSecondaryCalendarType:e._getSecondaryCalendarType(),oLegend:undefined};r=e.getLegend();if(r&&typeof r==="string"){n=sap.ui.getCore().byId(r);if(n){if(!(n instanceof t)){throw new Error(n+" is not an sap.ui.unified.CalendarLegend. "+e)}d.oLegend=n}else{s.warning("CalendarLegend "+r+" does not exist!",e)}}return d};c.renderDay=function(t,n,r,s,l,o,c,p,y){e._checkCalendarDate(r);var g=new a(r,s.sSecondaryCalendarType),f={role:n._getAriaRole(),selected:false,label:"",describedby:""},u=r._bBeforeFirstYear,C="";var S=n._oFormatYyyymmdd.format(r.toUTCJSDate(),true);var D=r.getDay();var b=n._checkDateSelected(r);var m=n._getDateTypes(r);var h=n._checkDateEnabled(r);var v=0;if(u){h=false}t.openStart("div",s.sId+"-"+S);t.class("sapUiCalItem");t.class("sapUiCalWDay"+D);if(p){t.style("width",p)}if(D===s.iFirstDayOfWeek){t.class("sapUiCalFirstWDay")}if(l&&s.iMonth!==r.getMonth()){t.class("sapUiCalItemOtherMonth");f["disabled"]=true}if(r.isSame(s.oToday)){t.class("sapUiCalItemNow");f["label"]=s.sToday+" "}if(b>0){t.class("sapUiCalItemSel");f["selected"]=true}else{f["selected"]=false}if(b===2){t.class("sapUiCalItemSelStart");f["describedby"]=f["describedby"]+" "+s.sId+"-Start"}else if(b===3){t.class("sapUiCalItemSelEnd");f["describedby"]=f["describedby"]+" "+s.sId+"-End"}else if(b===4){t.class("sapUiCalItemSelBetween")}else if(b===5){t.class("sapUiCalItemSelStart");t.class("sapUiCalItemSelEnd");f["describedby"]=f["describedby"]+" "+s.sId+"-Start";f["describedby"]=f["describedby"]+" "+s.sId+"-End"}m.forEach(function(e){if(e.type!==d.None){if(e.type===d.NonWorking){t.class("sapUiCalItemWeekEnd");return}t.class("sapUiCalItem"+e.type);C=e.type;if(e.tooltip){t.attr("title",e.tooltip)}}});if((n.getParent()&&n.getParent().getMetadata().getName()==="sap.ui.unified.CalendarOneMonthInterval"||n.getMetadata().getName()==="sap.ui.unified.calendar.OneMonthDatesRow")&&n.getStartDate()&&r.getMonth()!==n.getStartDate().getMonth()){t.class("sapUiCalItemOtherMonth")}if(!h){t.class("sapUiCalItemDsbl");f["disabled"]=true}if(s.aNonWorkingDays){for(v=0;v<s.aNonWorkingDays.length;v++){if(D===s.aNonWorkingDays[v]){t.class("sapUiCalItemWeekEnd");break}}}else if(D>=s.iWeekendStart&&D<=s.iWeekendEnd||s.iWeekendEnd<s.iWeekendStart&&(D>=s.iWeekendStart||D<=s.iWeekendEnd)){t.class("sapUiCalItemWeekEnd")}t.attr("tabindex","-1");t.attr("data-sap-day",S);if(y){f["label"]=f["label"]+s.aWeekDaysWide[D]+" "}f["label"]=f["label"]+s.oFormatLong.format(r.toUTCJSDate(),true);if(C!==""){i.addCalendarTypeAccInfo(f,C,s.oLegend)}if(s.sSecondaryCalendarType){f["label"]=f["label"]+" "+n._oFormatSecondaryLong.format(g.toUTCJSDate(),true)}t.accessibilityState(null,f);t.openEnd();if(m[0]){t.openStart("div");t.class("sapUiCalSpecialDate");if(m[0].color){t.style("background-color",m[0].color)}t.openEnd();t.close("div")}t.openStart("span");t.class("sapUiCalItemText");if(!!m[0]&&m[0].color){t.class("sapUiCalItemTextCustomColor")}t.openEnd();if(!u){t.text(r.getDate())}t.close("span");if(y){t.openStart("span");t.class("sapUiCalDayName");t.openEnd();t.text(s.aWeekDays[D]);t.close("span")}if(s.sSecondaryCalendarType){t.openStart("span");t.class("sapUiCalItemSecText");t.openEnd();t.text(g.getDate());t.close("span")}t.close("div")};c._renderWeekNumber=function(a,t,i){var n=e.calculateWeekNumber(t.toUTCJSDate(),i.iYear,i.sLocale,i.oLocaleData),r=i.sId+"-WNum-"+n;a.openStart("div",r);a.class("sapUiCalWeekNum");a.accessibilityState(null,{role:"rowheader",labelledby:l.getStaticId("sap.ui.unified","CALENDAR_WEEK")+" "+r});a.openEnd();a.text(n);a.close("div")};return c},true);