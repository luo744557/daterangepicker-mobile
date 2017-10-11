/**
 * 作者：罗永江
 * 基于jQuery.daterangepicker.js进行的手机端适配，移除了部分功能,添加了星期几的显示功能
 * 本页面以750宽度作为适配宽度，如需更改请自行适配
 * 原插件GitHub地址：https://github.com/longbill/jquery-date-range-picker
 * **/
(function (factory) {
		if (typeof define === 'function' && define.amd) {                             // AMD. 作为AMD模式注册
			define(['jquery', 'moment'], factory);
		} else if (typeof exports === 'object' && typeof module !== 'undefined') {    // CommonJS. 注册为 module
			module.exports = factory(require('jquery'), require('moment')); 
		} else {                                                                      // 浏览器全局可用，搭配jquery/moment
			factory(jQuery, moment);
		}
}(function ($, moment)
{

	$.dateRangePickerLanguages =
	{
		'cn':
		{
			'selected': '已选择:',
			'day':'天',
			'days': '天',
			'apply': '确定',
			'week-1' : '周一',
			'week-2' : '周二',
			'week-3' : '周三',
			'week-4' : '周四',
			'week-5' : '周五',
			'week-6' : '周六',
			'week-7' : '周日',
			'month-name': ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
			'shortcuts' : '快捷选择',
			'past': '过去',
			'following':'将来',
			'previous' : '&nbsp;&nbsp;&nbsp;',
			'prev-week' : '上周',
			'prev-month' : '上个月',
			'prev-year' : '去年',
			'next': '&nbsp;&nbsp;&nbsp;',
			'next-week':'下周',
			'next-month':'下个月',
			'next-year':'明年',
			'less-than' : '所选日期范围不能大于%d天',
			'more-than' : '所选日期范围不能小于%d天',
			'default-more' : '请选择大于%d天的日期范围',
			'default-less' : '请选择小于%d天的日期范围',
			'default-range' : '请选择%d天到%d天的日期范围',
			'default-single':'请选择一个日期',
			'default-default': '请选择一个日期范围'
		}
	};

	$.fn.dateRangePicker = function(opt)
	{
		function setbg(){
//			$("body").css("overflow-y","hidden");
//			$("body,html").css("position","absolute");
		}
		if (!opt) opt = {};
		opt = $.extend(true,
		{
			autoClose: false,
			format: 'YYYY-MM-DD',
			separator: ' to ',
			language: 'auto',
			startOfWeek: 'sunday',// 可手动更改为周一
			getValue: function()
			{
				return $(this).val();
			},
			setValue: function(s)
			{
				if(!$(this).attr('readonly') && !$(this).is(':disabled')){
					$(this).val(s);
				}
			},
			startDate: false,
			endDate: false,
			time: {
				enabled: false
			},
			minDays: 0,
			maxDays: 0,
			showShortcuts: true,
			shortcuts:
			{
				'next-days': [3,5,7],
				'next' : ['week','month','year']
			},
			customShortcuts : [],
			inline:false,
			container:'body',
			alwaysOpen:false,
			singleDate:false,
			lookBehind: false,
			batchMode: false,
			duration: 200,
			stickyMonths: false,
			dayDivAttrs: [],
			dayTdAttrs: [],
			applyBtnClass: ''
		},opt);

		opt.start = false;
		opt.end = false;

		if (opt.startDate && typeof opt.startDate == 'string') opt.startDate = moment(opt.startDate,opt.format).toDate();
		if (opt.endDate && typeof opt.endDate == 'string') opt.endDate = moment(opt.endDate,opt.format).toDate();

		var langs = getLanguages();
		var box;
		var initiated = false;
		var self = this;
		var selfDom = $(self).get(0);

		$(this).unbind('.datepicker').bind('click.datepicker',function(evt)
		{
			var isOpen = box.is(':visible');
			$(document).trigger('click.datepicker');
			evt.stopPropagation();
			if(!isOpen) open(opt.duration);
		});

		init_datepicker.call(this);

		if (opt.alwaysOpen)
		{
			open(0);
		}

		// api绑定
		$(this).data('dateRangePicker',
		{
			setDateRange : function(d1,d2)
			{
				if (typeof d1 == 'string' && typeof d2 == 'string')
				{
					d1 = moment(d1,opt.format).toDate();
					d2 = moment(d2,opt.format).toDate();
				}
				setDateRange(d1,d2);
			},
			clear: clearSelection,
			close: closeDatePicker,
			open: open,
			getDatePicker: getDatePicker,
			destroy: function()
			{
				$(self).unbind('.datepicker');
				$(self).data('dateRangePicker','');
				box.remove();
				$(window).unbind('resize.datepicker',calcPosition);
				$(document).unbind('click.datepicker',closeDatePicker);
			}
		});

		$(window).bind('resize.datepicker',calcPosition);

		return this;

		function init_datepicker()
		{
			var self = this;
			if ($(this).data('date-picker-opened'))
			{
				closeDatePicker();
				return;
			}
			$(this).data('date-picker-opened',true);
			box = createDom().hide();
			$(opt.container).append(box);
			if (!opt.inline)
			{
				calcPosition();
			}
			else
			{
				box.addClass("inline-wrapper").css({position:'static'});
			}

			if (opt.alwaysOpen)
			{
				box.find('.apply-btn').hide();
			}

			var defaultTime = opt.defaultTime ? opt.defaultTime : new Date();
			if (opt.lookBehind) {
				if (opt.startDate && compare_month(defaultTime, opt.startDate) < 0 ) defaultTime = nextMonth(moment(opt.startDate).toDate());
				if (opt.endDate && compare_month(defaultTime,opt.endDate) > 0 ) defaultTime = moment(opt.endDate).toDate();

				showMonth(prevMonth(defaultTime),'month1');
				showMonth(defaultTime,'month2');

			} else {
				if (opt.startDate && compare_month(defaultTime,opt.startDate) < 0 ) defaultTime = moment(opt.startDate).toDate();
				if (opt.endDate && compare_month(nextMonth(defaultTime),opt.endDate) > 0 ) defaultTime = prevMonth(moment(opt.endDate).toDate());

				showMonth(defaultTime,'month1');
				showMonth(nextMonth(defaultTime),'month2');
			}

			if (opt.time.enabled) {
				if ((opt.startDate && opt.endDate) || (opt.start && opt.end)) {
					showTime(moment(opt.start || opt.startDate).toDate(),'time1');
					showTime(moment(opt.end || opt.endDate).toDate(),'time2');
				} else {
					showTime(defaultTime,'time1');
					showTime(defaultTime,'time2');
				}
			}

			//showSelectedInfo();

			var defaultTopText = '';
			if (opt.singleDate)
				defaultTopText = lang('default-single');
			else if (opt.minDays && opt.maxDays)
				defaultTopText = lang('default-range');
			else if (opt.minDays)
				defaultTopText = lang('default-more');
			else if (opt.maxDays)
				defaultTopText = lang('default-less');
			else
				defaultTopText = lang('default-default');

			box.find('.default-top').html( defaultTopText.replace(/\%d/,opt.minDays).replace(/\%d/,opt.maxDays));

			setTimeout(function()
			{
				initiated = true;
			},0);

			box.click(function(evt)
			{
				evt.stopPropagation();
			});

			$(document).bind('click.datepicker',closeDatePicker);

			box.find('.next').click(function()
			{
				if(!opt.stickyMonths) gotoNextMonth(this);
				else gotoNextMonth_stickily(this)
			});

			function gotoNextMonth(self) {
				var isMonth2 = $(self).parents('table').hasClass('month2');
				var month = isMonth2 ? opt.month2 : opt.month1;
				month = nextMonth(month);
				if (!opt.singleDate && !isMonth2 && compare_month(month,opt.month2) >= 0 || isMonthOutOfBounds(month)) return;
				showMonth(month,isMonth2 ? 'month2' : 'month1');
				showGap();
			}

			function gotoNextMonth_stickily(self) {
				var nextMonth1 = nextMonth(opt.month1);

				var nextMonth2 = nextMonth(opt.month2);

				if(isMonthOutOfBounds(nextMonth2)) return;
				if (!opt.singleDate && compare_month(nextMonth1,nextMonth2) >= 0) return;
				showMonth(nextMonth1, 'month1');
				showMonth(nextMonth2, 'month2');
			}

			box.find('.prev').click(function()
			{
				if(!opt.stickyMonths) gotoPrevMonth(this);
				else gotoPrevMonth_stickily(this);
			});
			
			function gotoPrevMonth(self) {
				var isMonth2 = $(self).parents('table').hasClass('month2');
				var month = isMonth2 ? opt.month2 : opt.month1;
				month = prevMonth(month);
				//if (isMonth2 && month.getFullYear()+''+month.getMonth() <= opt.month1.getFullYear()+''+opt.month1.getMonth()) return;
				if (isMonth2 && compare_month(month,opt.month1) <= 0 || isMonthOutOfBounds(month)) return;
				showMonth(month,isMonth2 ? 'month2' : 'month1');
				showGap();
			}

			function gotoPrevMonth_stickily(self) {
				var prevMonth1 = prevMonth(opt.month1);

				var prevMonth2 = prevMonth(opt.month2);

				if(isMonthOutOfBounds(prevMonth1)) return;
				if(!opt.singleDate && compare_month(prevMonth2,prevMonth1) <= 0) return;
				showMonth(prevMonth2, 'month2');
				showMonth(prevMonth1, 'month1');
			}

			box.bind('click',function(evt)
			{
				if ($(evt.target).hasClass('day'))
				{
					dayClicked($(evt.target));
				}
			});

			box.attr('unselectable', 'on')
			.css('user-select', 'none')
			.bind('selectstart', function(e)
			{
				e.preventDefault(); return false;
			});

			box.find('.apply-btn').click(function()
			{
				closeDatePicker();
				var dateRange = getDateString(new Date(opt.start))+ opt.separator +getDateString(new Date(opt.end));
				dataConveying();
				$(self).trigger('datepicker-apply',
				{
					'value': dateRange,
					'date1' : new Date(opt.start),
					'date2' : new Date(opt.end)
				});
			});
            
			
			function getNowFormatDate(date) {
			    var seperator1 = "-";
			    var seperator2 = ":";
			    var month = date.getMonth() + 1;
			    var strDate = date.getDate();
			    if (month >= 1 && month <= 9) {
			        month = "0" + month;
			    }
			    if (strDate >= 0 && strDate <= 9) {
			        strDate = "0" + strDate;
			    }
			    var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate;
			    return currentdate;
			}
			
			box.find('[custom]').click(function()
			{
				var valueName = $(this).attr('custom');
				opt.start = false;
				opt.end = false;
				box.find('.day.checked').removeClass('checked');
				opt.setValue.call(selfDom, valueName);
				checkSelectionValid();
				showSelectedInfo(true);
				showSelectedDays();
				if (opt.autoClose)closeDatePicker();
			});

			box.find('[shortcut]').click(function()
			{
				var shortcut = $(this).attr('shortcut');
				var end = new Date(),start = false;
				if (shortcut.indexOf('day') != -1)
				{
					var day = parseInt(shortcut.split(',',2)[1],10);
					start = new Date(new Date().getTime() + 86400000*day);
					end = new Date(end.getTime() + 86400000*(day>0?1:-1) );
				}
				else if (shortcut.indexOf('week')!= -1)
				{
					var dir = shortcut.indexOf('prev,') != -1 ? -1 : 1;

					if (dir == 1)
						var stopDay = opt.startOfWeek == 'monday' ? 1 : 0;
					else
						var stopDay = opt.startOfWeek == 'monday' ? 0 : 6;

					end = new Date(end.getTime() - 86400000);
					while(end.getDay() != stopDay) end = new Date(end.getTime() + dir*86400000);
					start = new Date(end.getTime() + dir*86400000*6);
				}
				else if (shortcut.indexOf('month') != -1)
				{
					var dir = shortcut.indexOf('prev,') != -1 ? -1 : 1;
					if (dir == 1)
						start = nextMonth(end);
					else
						start = prevMonth(end);
					start.setDate(1);
					end = nextMonth(start);
					end.setDate(1);
					end = new Date(end.getTime() - 86400000);
				}
				else if (shortcut.indexOf('year') != -1)
				{
					var dir = shortcut.indexOf('prev,') != -1 ? -1 : 1;
					start = new Date();
					start.setFullYear(end.getFullYear() + dir);
					start.setMonth(0);
					start.setDate(1);
					end.setFullYear(end.getFullYear() + dir);
					end.setMonth(11);
					end.setDate(31);
				}
				else if (shortcut == 'custom')
				{
					var name = $(this).html();
					if (opt.customShortcuts && opt.customShortcuts.length > 0)
					{
						for(var i=0;i<opt.customShortcuts.length;i++)
						{
							var sh = opt.customShortcuts[i];
							if (sh.name == name)
							{
								var data = [];
								// try
								// {
									data = sh['dates'].call();
								//}catch(e){}
								if (data && data.length == 2)
								{
									start = data[0];
									end = data[1];
								}

								//如果仅选择了一个月份，则会自动延续到下一日期 
								//极端并显示本月以及下一个月份 
								if (data && data.length == 1)
								{
									movetodate = data[0];
									showMonth(movetodate,'month1');
									showMonth(nextMonth(movetodate),'month2');
									showGap();
								}

								break;
							}
						}
					}
				}
				if (start && end)
				{
					setDateRange(start,end);
					checkSelectionValid();
				}
			});

			box.find(".time1 input[type=range]").bind("change mousemove", function (e) {
				var target = e.target,
					hour = target.name == "hour" ? $(target).val().replace(/^(\d{1})$/, "0$1") : undefined,
					min = target.name == "minute" ? $(target).val().replace(/^(\d{1})$/, "0$1") : undefined;
				setTime("time1", hour, min);
			});

			box.find(".time2 input[type=range]").bind("change mousemove", function (e) {
				var target = e.target,
					hour = target.name == "hour" ? $(target).val().replace(/^(\d{1})$/, "0$1") : undefined,
					min = target.name == "minute" ? $(target).val().replace(/^(\d{1})$/, "0$1") : undefined;
				setTime("time2", hour, min);
			});

		}
		
		function getDateFromCurrentDate(fromDate,dayInterval){
			var curDate = new Date(fromDate);
			curDate.setDate(curDate.getDate()+dayInterval);
			var year = curDate.getFullYear();
			var month = (curDate.getMonth()+1)<10?"0"+(curDate.getMonth()+1):(curDate.getMonth()+1);
			var day = curDate.getDate()<10?"0"+curDate.getDate():curDate.getDate();
			return year+"-"+month+"-"+day;
		};

		function dataConveying() {
			//日期传输并判断周几及间隔几天
		    var date_start;
		    var date_end;
		    var year_s;
		    var month_s;
		    var day_s;
		    var year_e;
		    var month_e;
		    var day_e;

		    if ( date_start == date_end ) {
		    	date_end = getDateFromCurrentDate(date_start,1);

			    var date_y = date_end.split("/")[0];var date_m = date_end.split("/")[1];var date_d = date_end.split("/")[2];
			    date_end = parseFloat(date_y)+"/"+parseFloat(date_m)+"/"+parseFloat(date_d);
		    }

		    var myDate = $("#date_range_start").val().replace(/-/g,"/");

		    date_start = myDate;//开始日期值
		    year_s = date_start.split("/")[0];
	        month_s = date_start.split("/")[1];
	        month_s = parseInt(month_s);
	        day_s = date_start.split("/")[2];
			date_end   = $("#date_range_end").val().replace(/-/g,"/");//结束日期值
			year_e = date_end.split("/")[0];
	        month_e = date_end.split("/")[1];
	        month_e = parseInt(month_e);
	        day_e = date_end.split("/")[2];

		    //计算周几
		    //var year = 2017, month = 0, date = 23;// month=6表示7月
	        month_s = parseInt(month_s) - 1;
	        month_e = parseInt(month_e) - 1;
		 	var dt_s = new Date(year_s, month_s, day_s);
		 	var dt_e = new Date(year_e, month_e, day_e);
		 	var weekDay = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
		 	var week_s = weekDay[dt_s.getDay()];
		 	var week_e = weekDay[dt_e.getDay()];

            var startDate = systemtime , endDate = enddate;

            //console.log(systemtime);

		    if ( startDate != null ) {
		    	var dateshort_s = date_start.split("/");
			    var datemonth_s = dealnumber(parseInt(dateshort_s[1]));
			    var dateday_s   = dealnumber(parseInt(dateshort_s[2]));

			    $(".date_in").text(datemonth_s +'月'+ dateday_s +'日  ');
			    $("#MultiStore .date_in").text(datemonth_s +'-'+ dateday_s +'');
			    $("#HotelList .date_in").text(datemonth_s +'-'+ dateday_s +'');
			    //console.log(datemonth_s);
			    //console.log(dateday_s);
		    }

		    if ( ( startDate != null ) && ( endDate != null ) ) {

			      var _date_y = date_start.split("/")[0];var _date_m = date_start.split("/")[1];var _date_d = date_start.split("/")[2];
			      var date_y = date_end.split("/")[0];var date_m = date_end.split("/")[1];var date_d = date_end.split("/")[2];

			      date_start = parseFloat(_date_y)+"-"+parseFloat(_date_m)+"-"+parseFloat(_date_d);
			      date_end = parseFloat(date_y)+"-"+parseFloat(date_m)+"-"+parseFloat(date_d);

			      //console.log(date_start,date_end);

			      var iDays = getDateDiff(date_start,date_end);
			      if ( iDays <= 0 ) iDays = 1;
			      $(".all_day span").text(iDays +"晚");
			      $(".days_number").text(iDays);
			      live_in_all = iDays;
			      //$("#live_in_all").attr("value",iDays);

			      var dateshort_s = date_start.split("-");
			      var datemonth_s = parseInt(dateshort_s[1]);
			      var dateday_s   = dateshort_s[2];

			      var dateshort_e = date_end.split("-");
			      var datemonth_e = parseInt(dateshort_e[1]);
			      var dateday_e   = dateshort_e[2];

			      datemonth_s = dealnumber(datemonth_s) , dateday_s = dealnumber(dateday_s);
			      datemonth_e = dealnumber(datemonth_e) , dateday_e = dealnumber(dateday_e);

			      //计算周几
				  //var year = 2017, month = 0, date = 23;// month=6表示7月
			      var w_month_s = parseInt(datemonth_s)-1;
			      var w_month_e = parseInt(datemonth_e)-1;
				  var dt_s = new Date(dateshort_s[0], w_month_s, dateday_s);
				  var dt_e = new Date(dateshort_e[0], w_month_e, dateday_e);
				  var weekDay = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
				  var week_s = weekDay[dt_s.getDay()];
				  var week_e = weekDay[dt_e.getDay()];

			      $(".date_in").text(datemonth_s +'月'+ dateday_s +'日  ');
			      $(".date_out").text(datemonth_e +'月'+ dateday_e +'日  ');
			      $("#MultiStore .date_in , #HotelList .date_in").text(datemonth_s +'-'+ dateday_s +'');
				  $("#MultiStore .date_out, #HotelList .date_out").text(datemonth_e +'-'+ dateday_e +'');
				  $(".week_in").text(week_s);
			      $(".week_out").text(week_e);

                //console.log(datemonth_s);
                //console.log(dateday_s);
		    }

		    function dealnumber(num) {
		    	var number = num;
		    	if ( number < 10) {
		    		number = '0'+number;
		    	}
		    	return number;
		    }

		    function getDateDiff(sDate1,sDate2)
		    {
		    	 //console.log(sDate1);
		    	 var  aDate,  oDate1,  oDate2,  iDays
		         aDate  =  sDate1.split("-");
		         oDate1  =  new  Date(aDate[1]  +  '/'  +  aDate[2]  +  '/'  +  aDate[0]);    //转换为12-18-2002格式
		         aDate  =  sDate2.split("-");
		         oDate2  =  new  Date(aDate[1]  +  '/'  +  aDate[2]  +  '/'  +  aDate[0]);
		         iDays  =  parseInt(Math.abs(oDate1  -  oDate2)  /  1000  /  60  /  60  /24);    //把相差的毫秒数转换为天数
		         return  iDays;
		    }

		    //计算明天的日期
		    function getDay(day){
		        var today = new Date();
		        var targetday_milliseconds=today.getTime() + 1000*60*60*24*day;

		        today.setTime(targetday_milliseconds); //注意，这行是关键代码

		        var tYear = today.getFullYear();
		        var tMonth = parseInt(today.getMonth()) + 1;
		        var tDate = today.getDate();
		        tMonth = doHandleMonth(tMonth );
		        tDate = doHandleMonth(tDate);
		        return tYear+"-"+tMonth+"-"+tDate;
		    }
		    function doHandleMonth(month){
		        var m = month;
		        if(month.toString().length == 1){
		           m =  month;
		        }
		        return m;
		    }
		}
		function calcPosition()
		{
		}

		// 返回日期到wrapper picker插件之中
		function getDatePicker()
		{
			return box;
		}

		function open(animationTime)
		{
			calcPosition();
			var __default_string = opt.getValue.call(selfDom);
			var defaults = __default_string ? __default_string.split( opt.separator ) : '';

			if (defaults && ((defaults.length==1 && opt.singleDate) || defaults.length>=2))
			{
				var ___format = opt.format;
				if (___format.match(/Do/))
				{

					___format = ___format.replace(/Do/,'D');
					defaults[0] = defaults[0].replace(/(\d+)(th|nd|st)/,'$1');
					if(defaults.length >= 2){
						defaults[1] = defaults[1].replace(/(\d+)(th|nd|st)/,'$1');
					}
				}
        		// 设置输入的事件避免日期控件错误的change时间触发
        		initiated = false;
        		if(defaults.length >= 2){
					setDateRange(moment(defaults[0], ___format, moment.locale(opt.language)).toDate(),moment(defaults[1], ___format, moment.locale(opt.language)).toDate());
				}
				else if(defaults.length==1 && opt.singleDate){
					setSingleDate(moment(defaults[0], ___format, moment.locale(opt.language)).toDate());
				}

        		initiated = true;
			}
			box.slideDown(animationTime);
		}


		function renderTime (name, date) {
			box.find("." + name + " input[type=range].hour-range").val(moment(date).hours());
			box.find("." + name + " input[type=range].minute-range").val(moment(date).minutes());
			setTime(name, moment(date).format("HH"), moment(date).format("mm"));
		}

		function changeTime (name, date) {
			opt[name] = parseInt(
				moment(parseInt(date))
					.startOf('day')
					.add(moment(opt[name + "Time"]).format("HH"), 'h')
					.add(moment(opt[name + "Time"]).format("mm"), 'm').valueOf()
				);
		}

		function swapTime () {
			renderTime("time1", opt.start);
			renderTime("time2", opt.end);
		}

		function setTime (name, hour, minute) {
			hour && (box.find("." + name + " .hour-val").text(hour));
			minute && (box.find("." + name + " .minute-val").text(minute));
			switch (name) {
				case "time1":
					if (opt.start) {
						setRange("start", moment(opt.start));
					}
					setRange("startTime", moment(opt.startTime || moment().valueOf()));
					break;
				case "time2":
					if (opt.end) {
						setRange("end", moment(opt.end));
					}
					setRange("endTime", moment(opt.endTime || moment().valueOf()));
					break;
			}
			function setRange(name, timePoint) {
				var h = timePoint.format("HH"),
					m = timePoint.format("mm");
				opt[name] = timePoint
					.startOf('day')
					.add(hour || h, "h")
					.add(minute || m, "m")
					.valueOf();
			}
			checkSelectionValid();
			showSelectedInfo();
			showSelectedDays();
		}

		function clearSelection()
		{
			opt.start = false;
			opt.end = false;
			box.find('.day.checked').removeClass('checked');
			opt.setValue.call(selfDom, '');
			checkSelectionValid();
			showSelectedInfo();
			showSelectedDays();
		}

    function handleStart(time)
    {
      var r = time;
      if  (opt.batchMode === 'week-range') {
        if (opt.startOfWeek === 'monday') {
					r = moment(parseInt(time)).startOf('isoweek').valueOf();
				} else {
					r = moment(parseInt(time)).startOf('week').valueOf();
				}
      } else if (opt.batchMode === 'month-range') {
				r = moment(parseInt(time)).startOf('month').valueOf();
      }
      return r;
    }

    function handleEnd(time)
    {
      var r = time;
      if  (opt.batchMode === 'week-range') {
        if (opt.startOfWeek === 'monday') {
					r = moment(parseInt(time)).endOf('isoweek').valueOf();
				} else {
					r = moment(parseInt(time)).endOf('week').valueOf();
				}
      } else if (opt.batchMode === 'month') {
				r = moment(parseInt(time)).endOf('month').valueOf();
      }

      return r;
    }


		function dayClicked(day)
		{
			if (day.hasClass('invalid')) return;
			var time = day.attr('time');
			day.addClass('checked');
			if ( opt.singleDate )
			{
				opt.start = time;
				opt.end = false;
				if (opt.time.enabled) {
					changeTime("start", opt.start);
				}
			}
			else if  (opt.batchMode === 'week')
			{
				if (opt.startOfWeek === 'monday') {
					opt.start = moment(parseInt(time)).startOf('isoweek').valueOf();
					opt.end   = moment(parseInt(time)).endOf('isoweek').valueOf();
				} else {
					opt.end   = moment(parseInt(time)).endOf('week').valueOf();
					opt.start = moment(parseInt(time)).startOf('week').valueOf();
				}
			}
			else if (opt.batchMode === 'month')
			{
				opt.start = moment(parseInt(time)).startOf('month').valueOf();
				opt.end = moment(parseInt(time)).endOf('month').valueOf();
			}
			else if ((opt.start && opt.end) || (!opt.start && !opt.end) )
			{
				opt.start = handleStart(time);
				opt.end = false;
				if (opt.time.enabled) {
					changeTime("start", opt.start);
				}
			}
			else if (opt.start)
			{
				opt.end = handleEnd(time);
				if (opt.time.enabled) {
					changeTime("end", opt.end);
				}
			}

			if (!opt.singleDate && opt.start && opt.end && opt.start > opt.end)
			{
				var tmp = opt.end;
				opt.end = handleEnd(opt.start);
				opt.start = handleStart(tmp);
				if (opt.time.enabled) {
					swapTime();
				}
			}
            
			opt.start = parseInt(opt.start);
			opt.end = parseInt(opt.end);

			checkSelectionValid();
			showSelectedInfo();
			showSelectedDays();
			autoclose();
		}

		function autoclose () {
			if (opt.singleDate === true) {
				if (initiated && opt.start )
				{
					if (opt.autoClose) closeDatePicker("close");
				}
			} else {
				if (initiated && opt.start && opt.end)
				{
					if (opt.autoClose) closeDatePicker("close");
				}
			}
		}

		function checkSelectionValid()
		{
			var days = Math.ceil( (opt.end - opt.start) / 86400000 ) + 1;
			if (opt.singleDate) { // 仅开始日期可用于此处
				if (opt.start && !opt.end)
					box.find('.drp_top-bar').removeClass('error').addClass('normal');
				else
					box.find('.drp_top-bar').removeClass('error').removeClass('normal');
			}
			else if ( opt.maxDays && days > opt.maxDays)
			{
				opt.start = false;
				opt.end = false;
				box.find('.day').removeClass('checked');
				box.find('.drp_top-bar').removeClass('normal').addClass('error').find('.error-top').html( lang('less-than').replace('%d',opt.maxDays) );
			}
			else if ( opt.minDays && days < opt.minDays)
			{
				opt.start = false;
				opt.end = false;
				box.find('.day').removeClass('checked');
				box.find('.drp_top-bar').removeClass('normal').addClass('error').find('.error-top').html( lang('more-than').replace('%d',opt.minDays) );
			}
			else
			{
				if (opt.start || opt.end)
					box.find('.drp_top-bar').removeClass('error').addClass('normal');
				else
					box.find('.drp_top-bar').removeClass('error').removeClass('normal');
			}

			if ( (opt.singleDate && opt.start && !opt.end) || (!opt.singleDate && opt.start && opt.end) )
			{
				box.find('.apply-btn').removeClass('disabled');
			}
			else
			{
				box.find('.apply-btn').addClass('disabled');
			}

			if (opt.batchMode)
			{
				if ( (opt.start && opt.startDate && compare_day(opt.start, opt.startDate) < 0)
					|| (opt.end && opt.endDate && compare_day(opt.end, opt.endDate) > 0)  )
				{
					opt.start = false;
					opt.end = false;
					box.find('.day').removeClass('checked');
				}
			}
		}

		function showSelectedInfo(forceValid)
		{
			box.find('.start-day').html('...');
			box.find('.end-day').html('...');
			box.find('.selected-days').hide();
			var sDateDyy ;
			if (opt.start)
			{
				box.find('.start-day').html(getDateString(new Date(parseInt(opt.start))));
				
				var _sDate = getDateString(new Date(parseInt(opt.start)));
				_sDate     = parseInt(_sDate.split("/")[0]) +"/"+ parseInt(_sDate.split("/")[1]) +"/"+ parseInt(_sDate.split("/")[2]);
				var sDate  = parseInt(_sDate.split("/")[1]) +"/"+ parseInt(_sDate.split("/")[2]);
				month_s = parseInt(_sDate.split("/")[1]) - 1;
			 	var dt_s = new Date(parseInt(_sDate.split("/")[0]), month_s , parseInt(_sDate.split("/")[2]));
			 	var weekDay = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
			 	var week_s = weekDay[dt_s.getDay()];
			    box.find('.live_start_day').html(parseInt(_sDate.split("/")[1])+"月"+parseInt(_sDate.split("/")[2])+"日"+" "+week_s);
			    
			    sDateDyy = _sDate;;
			}
			if (opt.end)
			{
				box.find('.end-day').html(getDateString(new Date(parseInt(opt.end))));
				
				var _eDate = getDateString(new Date(parseInt(opt.end)));
				_eDate     = parseInt(_eDate.split("/")[0]) +"/"+ parseInt(_eDate.split("/")[1]) +"/"+ parseInt(_eDate.split("/")[2]);
				var eDate  = parseInt(_eDate.split("/")[1]) +"/"+ parseInt(_eDate.split("/")[2]);
				month_e    = parseInt(_eDate.split("/")[1]) - 1;
			 	var dt_e   = new Date(parseInt(_eDate.split("/")[0]), month_e , parseInt(_eDate.split("/")[2]));
			 	var weekDay = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
			 	var week_e = weekDay[dt_e.getDay()];
			    box.find('.live_end_day').html(parseInt(_eDate.split("/")[1])+"月"+parseInt(_eDate.split("/")[2])+"日"+" "+week_e);
			    
			    var _iDays = getDateRange( sDateDyy , _eDate );
			    $('.all_day span').text(_iDays+"晚");
			    $(".days_number").text(_iDays);
			    live_in_all = _iDays;
			}

			if (opt.start && opt.singleDate)
			{
				box.find('.apply-btn').removeClass('disabled');
				var dateRange = getDateString(new Date(opt.start));
				opt.setValue.call(selfDom, dateRange, getDateString(new Date(opt.start)), getDateString(new Date(opt.end)));

				if (initiated)
				{
					$(self).trigger('datepicker-change',
					{
						'value': dateRange,
						'date1' : new Date(opt.start)
					});
				}
			}
			else if (opt.start && opt.end)
			{
				box.find('.selected-days').show().find('.selected-days-num').html(Math.round((opt.end-opt.start)/86400000)+1);
				box.find('.apply-btn').removeClass('disabled');
				var dateRange = getDateString(new Date(opt.start))+ opt.separator +getDateString(new Date(opt.end));
				opt.setValue.call(selfDom,dateRange, getDateString(new Date(opt.start)), getDateString(new Date(opt.end)));
				if (initiated)
				{
					$(self).trigger('datepicker-change',
					{
						'value': dateRange,
						'date1' : new Date(opt.start),
						'date2' : new Date(opt.end)
					});
				}
			}
			else if (forceValid)
			{
				box.find('.apply-btn').removeClass('disabled');
			}
			else
			{
				box.find('.apply-btn').addClass('disabled');
			}
		}
        
		function getDateRange(sDate1,sDate2)  
	    {  
	    	 //console.log(sDate1);
	    	 var  aDate,  oDate1,  oDate2,  iDays  
	         aDate  =  sDate1.split("-"); 
	         oDate1  =  new  Date(aDate[1]  +  '/'  +  aDate[2]  +  '/'  +  aDate[0]);    //转换为12-18-2002格式  
	         aDate  =  sDate2.split("-");  
	         oDate2  =  new  Date(aDate[1]  +  '/'  +  aDate[2]  +  '/'  +  aDate[0]);  
	         iDays  =  parseInt(Math.abs(oDate1  -  oDate2)  /  1000  /  60  /  60  /24);    //把相差的毫秒数转换为天数  
	         return  iDays;    
	    }
		
		function setDateRange(date1,date2)
		{
			if (date1.getTime() > date2.getTime())
			{
				var tmp = date2;
				date2 = date1;
				date1 = tmp;
				tmp = null;
			}
			var valid = true;
			if (opt.startDate && compare_day(date1,opt.startDate) < 0) valid = false;
			if (opt.endDate && compare_day(date2,opt.endDate) > 0) valid = false;
			if (!valid)
			{
				showMonth(opt.startDate,'month1');
				showMonth(nextMonth(opt.startDate),'month2');
				showGap();
				return;
			}

			opt.start = date1.getTime();
			opt.end = date2.getTime();
			if (opt.stickyMonths || (compare_day(date1,date2) > 0 && compare_month(date1,date2) == 0))
			{
				if (opt.lookBehind) {
					date1 = prevMonth(date2);
				} else {
					date2 = nextMonth(date1);
				}
			}

			if(opt.stickyMonths && compare_month(date2,opt.endDate) > 0) {
				date1 = prevMonth(date1);
				date2 = prevMonth(date2);
			}

			if (!opt.stickyMonths) {
				if (compare_month(date1,date2) == 0)
				{
					if (opt.lookBehind) {
						date1 = prevMonth(date2);
					} else {
						date2 = nextMonth(date1);
					}
				}
			}

			if (opt.time.enabled) {
				renderTime('time1', date1);
				renderTime('time2', date2);
			}
			showMonth(date1,'month1');
			showMonth(date2,'month2');
			showGap();
			showSelectedInfo();
			autoclose();
		}

		function setSingleDate(date1)
		{

			var valid = true;
			if (opt.startDate && compare_day(date1,opt.startDate) < 0) valid = false;
			if (opt.endDate && compare_day(date1,opt.endDate) > 0) valid = false;
			if (!valid)
			{
				showMonth(opt.startDate,'month1');

				//showGap();
				return;
			}

			opt.start = date1.getTime();


			if (opt.time.enabled) {
				renderTime("time1", date1);

			}
			showMonth(date1,'month1');
			showMonth(date2,'month2');
			showGap();
			showSelectedInfo();
			autoclose();
		}
        
		function showSelectedDays()
		{
			if (!opt.start && !opt.end) return;
			box.find('.day').each(function()
			{
				var time = parseInt($(this).attr('time')),
					start = opt.start,
					end = opt.end;
				if (opt.time.enabled) {
					time = moment(time).startOf('day').valueOf();
					start = moment(start || moment().valueOf()).startOf('day').valueOf();
					end = moment(end || moment().valueOf()).startOf('day').valueOf();
				}
				if (
					(opt.start && opt.end && end >= time && start <= time )
					|| ( opt.start && !opt.end && moment(start).format('YYYY-MM-DD') == moment(time).format('YYYY-MM-DD') )
				) {
			    $(this).addClass('checked');
		     }
			 else {
				$(this).removeClass('checked');
			 }
			});
			
		}

		function showMonth(date,month)
		{
                if ( month == 'month2' ) {
                    showNowNextMonth( date ,'month2');
				}
				else {
                    systemtime = systemtime.replace(/-/g, "/");
                    date = parserDate(systemtime);
                    var monthName = nameMonth(date.getMonth());
                    box.find('.'+month+' .month-name').html(date.getFullYear()+'年'+monthName);
                    box.find('.'+month+' tbody').html(createMonthHTML(date));
                    opt[month] = date;
				}
		}
		
		function showNowMonth(date,month)
		{
			date = moment(date).toDate();
			var monthName = nameMonth(date.getMonth());
			box.find('.'+month+' .month-name').html(date.getFullYear()+'年'+monthName);
			box.find('.'+month+' tbody').html(createMonthHTML(date));
			opt[month] = date;
		}
		
		function showNowNextMonth(date,month)
		{
			date = moment(date).toDate();
			var monthName = nameMonth(date.getMonth());
			box.find('.'+month+' .month-name').html(date.getFullYear()+'年'+monthName);
			box.find('.'+month+' tbody').html(createMonthHTML(date));
			opt[month] = date;
		}
		
		function parserDate(date) {  
		    var t = Date.parse(date);  
		    if (!isNaN(t)) {  
		        return new Date(Date.parse(date.replace(/-/g, "/")));  
		    } else {  
		        return new Date();  
		    }  
		};  
		
		function showTime(date,name)
		{
			box.find('.' + name).append(getTimeHTML());
			renderTime(name, date);
		}

		function nameMonth(m)
		{
			return lang('month-name')[m];
		}

		function getDateString(d)
		{
			return moment(d).format(opt.format);
		}

		function showGap()
		{
			showSelectedDays();
			var m1 = parseInt(moment(opt.month1).format('YYYYMM'));
			var m2 = parseInt(moment(opt.month2).format('YYYYMM'));
			var p = Math.abs(m1 - m2);
			var shouldShow = (p > 1 && p !=89);
			if (shouldShow)
				box.find('.gap').show();
			else
				box.find('.gap').hide();
		}

		function closeDatePicker(state)
		{
			if (opt.alwaysOpen) return;
			$(box).slideUp(opt.duration,function()
			{
				$(self).data('date-picker-opened',false);
			});
			dataConveying();
			$(self).trigger('datepicker-close');
			if ( state == "close" ) {
			}
		}

		function compare_month(m1,m2)
		{
			var p = parseInt(moment(m1).format('YYYYMM')) - parseInt(moment(m2).format('YYYYMM'));
			if (p > 0 ) return 1;
			if (p == 0) return 0;
			return -1;
		}

		function compare_day(m1,m2)
		{
			var p = parseInt(moment(m1).format('YYYYMMDD')) - parseInt(moment(m2).format('YYYYMMDD'));
			if (p > 0 ) return 1;
			if (p == 0) return 0;
			return -1;
		}

		function nextMonth(month)
		{
			month = moment(month).toDate();
			var toMonth = month.getMonth();
			while(month.getMonth() == toMonth) month = new Date(month.getTime()+86400000);
			return month;
		}

		function prevMonth(month) {
			month = moment(month).toDate();
			var toMonth = month.getMonth();
			while(month.getMonth() == toMonth) month = new Date(month.getTime()-86400000);
			return month;
		}

		function getTimeHTML()
		{
			var timeHtml = '<div>'
				+'<span>Time: <span class="hour-val">00</span>:<span class="minute-val">00</span></span>'
				+'</div>'
				+'<div class="hour">'
				+'<label>Hour: <input type="range" class="hour-range" name="hour" min="0" max="23"></label>'
				+'</div>'
				+'<div class="minute">'
				+'<label>Minute: <input type="range" class="minute-range" name="minute" min="0" max="59"></label>'
				+'</div>';
			return timeHtml;
		}

		function createDom(){
			var html = '<div class="date_all_container" style="position: absolute;z-index: 9999;background-color: #ffffff;height:1334px;width: 750px;">'
  	    	    +'<table class="week_name_title" style="background-color: #fd9f28;width: 750px;height: 96px;text-shadow: none;"><thead style="height: 96px;font-size: 30px;color: #ffffff;line-height: 96px;"><tr class="week-name"><th>周日</th><th>周一</th><th>周二</th>	<th>周三</th><th>周四</th><th>周五</th><th>周六</th></tr></thead></table>'
				+'<div style="height: 1200px;top: 98px;" class="date-picker-wrapper ui-content'
			if ( opt.singleDate ) html += ' single-date';	
			if ( !opt.showShortcuts ) html += ' no-shortcuts ';
			html += '"><div class="drp_top-bar"><div class="normal-top"><span style="color:#333">'+lang('selected')+' </span> <b class="start-day">...</b>'
			if ( ! opt.singleDate ) {
				html += ' <span class="separator-day">'+opt.separator+'</span> <b class="end-day">...</b> <i class="selected-days">(<span class="selected-days-num">3</span> '+lang('days')+')</i>'
			}
			html += '</div>\
					<div class="error-top">error</div>\
					<div class="default-top">default</div>\
					<input type="button" class="apply-btn disabled'+ getApplyBtnClass() +'" value="'+lang('apply')+'" />\
				</div>'
				+'<div class="month-wrapper">'
				+'<script>function hidetips(){$(".alert-tips").hide();$(".date-picker-wrapper").css("top","102px");}</script>'
				+'<table class="month1" cellspacing="0" border="0" cellpadding="0"><thead><tr class="caption"><th style="width:27px;"><span class="prev">&lt;</span></th><th colspan="5" class="month-name">January, 2017</th><th style="width:27px;">' + (opt.singleDate || !opt.stickyMonths ? '<span class="next">&gt;</span>': '') + '</th></tr><tr class="week-name">'+getWeekHead()+'</thead><tbody></tbody></table>'
			if ( ! opt.singleDate ) {
				html += '<div class="gap">'+getGapHTML()+'</div>'
					+'<table class="month2" cellspacing="0" border="0" cellpadding="0"><thead><tr class="caption"><th style="width:27px;">' + (!opt.stickyMonths ? '<span class="prev">&lt;</span>': '') + '</th><th colspan="5" class="month-name">January, 2011</th><th style="width:27px;"><span class="next">&gt;</span></th></tr><tr class="week-name">'+getWeekHead()+'</thead><tbody></tbody></table>'
			}
				//+'</div>'
			html +=	'<div style="clear:both;height:0;font-size:0;"></div>'
				+'<div class="time">'
				+'<div class="time1"></div>'
			if ( ! opt.singleDate ) {
				html += '<div class="time2"></div>'
			}
			html += '</div>'
				+'</div>'
			if (opt.showShortcuts) {
				if (opt.customShortcuts) {
					for(var i=0;i<opt.customShortcuts.length; i++)
					{
						var sh = opt.customShortcuts[i];
						html+= '&nbsp;<span class="custom-shortcut"><a href="javascript:;" shortcut="custom">'+sh.name+'</a></span>';
					}
				}

				// 添加用户值到DOM中
				if (opt.showCustomValues) {
					html += '<div class="customValues"><b>'+(opt.customValueLabel || lang('custom-values'))+'</b>';

					if (opt.customValues)
					{
						for(var i=0;i<opt.customValues.length;i++)
						{
							var val = opt.customValues[i];
								html+= '&nbsp;<span class="custom-value"><a href="javascript:;" custom="'+ val.value+'">'+val.name+'</a></span>';
						}
					}
				}

				html +='</div>';
			}
			html += '</div>';
			return $(html);
		}

		function getApplyBtnClass()
		{
			klass = ''
			if (opt.autoClose === true) {
				klass += ' hide';
			}
			if (opt.applyBtnClass !== '') {
				klass += ' ' + opt.applyBtnClass;
			}
			return klass;
		}

		function getWeekHead()
		{
			if (opt.startOfWeek == 'monday')
			{
				return '<th>'+lang('week-1')+'</th>\
					<th>'+lang('week-2')+'</th>\
					<th>'+lang('week-3')+'</th>\
					<th>'+lang('week-4')+'</th>\
					<th>'+lang('week-5')+'</th>\
					<th>'+lang('week-6')+'</th>\
					<th>'+lang('week-7')+'</th>';
			}
			else
			{
				return '<th>'+lang('week-7')+'</th>\
					<th>'+lang('week-1')+'</th>\
					<th>'+lang('week-2')+'</th>\
					<th>'+lang('week-3')+'</th>\
					<th>'+lang('week-4')+'</th>\
					<th>'+lang('week-5')+'</th>\
					<th>'+lang('week-6')+'</th>';
			}
		}
                function isMonthOutOfBounds(month)
                {
                        var month = moment(month);
                        if (opt.startDate && month.endOf('month').isBefore(opt.startDate))
                        {
                                return true;
                        }
                        if (opt.endDate && month.startOf('month').isAfter(opt.endDate))
                        {
                                return true;
                        }
                        return false;
                }

		function getGapHTML()
		{
			var html = ['<div class="gap-top-mask"></div><div class="gap-bottom-mask"></div><div class="gap-lines">'];
			for(var i=0;i<20;i++)
			{
				html.push('<div class="gap-line">\
					<div class="gap-1"></div>\
					<div class="gap-2"></div>\
					<div class="gap-3"></div>\
				</div>');
			}
			html.push('</div>');
			return html.join('');
		}

		function attributesCallbacks(initialObject,callbacksArray,today)
		{
			var resultObject = jQuery.extend(true, {}, initialObject);

			callbacksArray.forEach(function(cbAttr,cbAttrIndex,cbAttrArray){
				var addAttributes = cbAttr(this);
				for(var attr in addAttributes){
					if(resultObject.hasOwnProperty(attr)){
						resultObject[attr] += addAttributes[attr];
					}else{
						resultObject[attr] = addAttributes[attr];
					}
				}
			},today);

			attrString = '';

			for(var attr in resultObject){
				if(resultObject.hasOwnProperty(attr)){
					attrString += attr + '="' + resultObject[attr] + '" ';
				}
			}

			return attrString;
		}

		function createMonthHTML(d)
		{
			var days = [];
			d.setDate(1);
			var lastMonth = new Date(d.getTime() - 86400000);
			var now = new Date();

			var dayOfWeek = d.getDay();
			if((dayOfWeek == 0) && (opt.startOfWeek == 'monday')) {
				// 添加一星期
				dayOfWeek = 7;
			}

			if (dayOfWeek > 0)
			{
				for (var i = dayOfWeek; i > 0; i--)
				{
					var day = new Date(d.getTime() - 86400000*i);
					var valid = true;
					if (opt.startDate && compare_day(day,opt.startDate) < 0) valid = false;
					if (opt.endDate && compare_day(day,opt.endDate) > 0) valid = false;
					days.push({type:'lastMonth',day: day.getDate(),time:day.getTime(), valid:valid });
				}
			}
			var toMonth = d.getMonth();
			for(var i=0; i<40; i++)
			{
				var today = moment(d).add(i, 'days').toDate();
				var valid = true;
				if (opt.startDate && compare_day(today,opt.startDate) < 0) valid = false;
				if (opt.endDate && compare_day(today,opt.endDate) > 0) valid = false;
				days.push({type: today.getMonth() == toMonth ? 'toMonth' : 'nextMonth',day: today.getDate(),time:today.getTime(), valid:valid });
			}
			var html = [];
			for(var week=0; week<6; week++)
			{
				if (days[week*7].type == 'nextMonth') break;
				html.push('<tr>');
				for(var day = 0; day<7; day++)
				{
					var _day = (opt.startOfWeek == 'monday') ? day+1 : day;
					var today = days[week*7+_day];
					var highlightToday = moment(today.time).format('L') == moment(now).format('L');
					today.extraClass = '';
					today.tooltip = '';
					if(opt.beforeShowDay && typeof opt.beforeShowDay == 'function')
					{
						var _r = opt.beforeShowDay(moment(today.time).toDate());
						today.valid = _r[0];
						today.extraClass = _r[1] || '';
						today.tooltip = _r[2] || '';
						if (today.tooltip != '') today.extraClass += ' has-tooltip ';
					}

					todayDivAttr = {
						time: today.time,
						title: today.tooltip,
						class: 'day '+today.type+' '+today.extraClass+' '+(today.valid ? 'valid' : 'invalid')+' '+(highlightToday?'real-today':'')
					};

					html.push('<td ' + attributesCallbacks({},opt.dayTdAttrs,today) + '><div ' + attributesCallbacks(todayDivAttr,opt.dayDivAttrs,today) + '>'+today.day+'</div></td>');
				}
				html.push('</tr>');
			}
			return html.join('');
		}
		//多语言显示，根据不同系统语言返回数值，功能未开发完成，仅适配中文
		function getLanguages()
		{
			if (opt.language == 'auto')
			{
				var language = navigator.language ? navigator.language : navigator.browserLanguage;
				if (!language) return $.dateRangePickerLanguages['cn'];
				var language = language.toLowerCase();
				for(var key in $.dateRangePickerLanguages)
				{
					if (language.indexOf(key) != -1)
					{
						return $.dateRangePickerLanguages['cn'];
					}
				}
				return $.dateRangePickerLanguages['cn'];
			}
			else if ( opt.language && opt.language in $.dateRangePickerLanguages)
			{
				return $.dateRangePickerLanguages['cn'];
			}
			else
			{
				return $.dateRangePickerLanguages['cn'];
			}
		}

		function lang(t)
		{
			return (t in langs)? langs[t] : t;
		}


	};
}));
