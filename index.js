"use strict";

var END_DATE = new Date("Jun 24 2017");
var NEXT_YEAR = new Date("May 15 2017");
var DEFAULT_COORDS = { // Haifa
  "coords": {
    "latitude": 32.8167,
    "longitude": 34.9833,
  }
};

var DAY = "days";
var HR = "hours";
var MIN = "minutes";
var SEC = "seconds";

var UNIT_CONVERTER = {};

// times in ms
var UNIT_TIMES = {};
UNIT_TIMES[SEC] = 3000; // one second is too annoying
UNIT_TIMES[MIN] = 1000 * 60;
UNIT_TIMES[HR] = UNIT_TIMES[MIN] * 5; // one hour is too long
UNIT_TIMES[DAY] = UNIT_TIMES[HR] * 24;

// http://stackoverflow.com/questions/5915096/get-random-item-from-javascript-array
(function($) {
  $.rand = function(arg) {
    if ($.isArray(arg)) {
      return arg[$.rand(arg.length)];
    } else if (typeof arg === "number") {
      return Math.floor(Math.random() * arg);
    } else {
      return 4; // chosen by fair dice roll
    }
  };
})(jQuery);

function getCoords(callback) {
  geolocator.locate(callback, function(error) {
    callback(DEFAULT_COORDS);
  }, true, { // fallback to IP is true
    "timeout": 5000
  });
}

function displayDaySplit(split, klass) {
  $(klass).hide();
  $(klass + "-split1").html(split.time1 + " " + split.unit1);
  $(klass + "-split2").html(split.time2 + " " + split.unit2);
  $(klass).fadeIn("slow");
}

function displayTimeSplit(split, klass) {
  $(klass + "-split1").hide().html(split.time1 + " " + split.unit1).slideDown();
  $(klass + "-split2").hide().html(split.time2 + " " + split.unit2).slideDown();
}

function humanizeFloat(x) {
  return Math.round(x);
}

function humanizeUnit(val, unit) {
  if (val == 1) {
    unit = unit.slice(0, -1);
  }
  return unit;
}

function getTimeoutVal(unit) {
  var timeoutVal = UNIT_TIMES[unit];
  if (timeoutVal === undefined) {
    timeoutVal = 1000 * 60;
  }
  return timeoutVal;
}

/*
 * Returns an object containing
 * two times splitting the time left
 * into two parts.
 */
function getTimeUntil(endTime, unit) {
  var time1 = 0;
  var time2 = 0;
  var count = 0;
  var units = [HR, MIN, SEC];
  while ((time1 === 0 || time2 === 0) && count < 10) {
    unit = unit || $.rand(units);
    var remaining = timeLeft(endTime, unit);
    time1 = humanizeFloat($.rand(remaining));
    time2 = humanizeFloat(remaining - time1);
    count++;
    if (time1 === 0 && time2 === 0) {
      var index = units.indexOf(unit);
      if (index > -1) {
        units.splice(index, 1);
        count = 0;
      }
    }
  }
  return {
    "time1": time1,
    "time2": time2,
    "unit": unit,
    // for internationalization
    "unit1": humanizeUnit(time1, unit),
    "unit2": humanizeUnit(time2, unit),
  };
}

/*
 * Return the amount of time left between
 * now and `endTime` in the given units
 */
function timeLeft(endTime, unit) {
  var diff = endTime.getTime() - Date.now();
  return UNIT_CONVERTER[unit](diff);
}

/*
 * Returns either time until sunrise or
 * time until sunset depending on the current time
 * returns the correct class to apply to the `body`
 */
function getEndTimeData(position) {
  var sunTimes = SunCalc.getTimes(new Date(), position.coords.latitude, position.coords.longitude);
  var timeToSunset = timeLeft(sunTimes.sunsetStart, SEC);
  var timeToDawn = timeLeft(sunTimes.dawn, SEC);
  var endTimeData;
  if (timeToSunset >= 0 && timeToDawn <= 0) {
    endTimeData = {
      "endTimeKlass": "sunset",
      "endTime": sunTimes.sunsetStart,
      "endTimeText": "until sunset.",
    };
  } else {
    endTimeData = {
      "endTimeKlass": "dawn",
      "endTime": sunTimes.dawn,
      "endTimeText": "until dawn.",
    };
  }
  if (timeToSunset < 0 && timeToDawn < 0) { // dawn the next day
    var sunTimes = SunCalc.getTimes(new Date(new Date().getTime() + 24 * 60 * 60 * 1000), position.coords.latitude, position.coords.longitude);
    endTimeData.endTime = sunTimes.dawn;
  }
  return endTimeData;
}

function inSeconds(diff) {
  return diff / 1000;
}

function inMinutes(diff) {
  return inSeconds(diff) / 60;
}

function inHours(diff) {
  return inMinutes(diff) / 60;
}

function inDays(diff) {
  return inHours(diff) / 24;
}

function displayTimes(position) {
  $(".waiting").hide();
  $(".container").show();

  var daySplit = getTimeUntil(END_DATE, DAY);
  displayDaySplit(daySplit, ".daySplit");

  var endTimeData = getEndTimeData(position);
  var timeSplit = getTimeUntil(endTimeData.endTime);
  displayTimeSplit(timeSplit, ".timeSplit");

  $("body").removeClass().addClass(endTimeData.endTimeKlass);
  $(".timeSplit-val").html(endTimeData.endTimeText);

  // update display after unit units
  setTimeout(function() {
    displayTimes(position);
  }, getTimeoutVal(timeSplit.unit));
}

function displayNextYear() {
  $(".waiting").hide();
  var daySplit = getTimeUntil(NEXT_YEAR, DAY);
  $(".daySplit").hide();
  displayTimeSplit(daySplit, ".timeSplit");
  $(".timeSplit-val").text("until Ramadan begins.");
}

$(document).ready(function() {
  UNIT_CONVERTER[DAY] = inDays;
  UNIT_CONVERTER[HR] = inHours;
  UNIT_CONVERTER[MIN] = inMinutes;
  UNIT_CONVERTER[SEC] = inSeconds;
  if (Date.now() > END_DATE) {
    displayNextYear();
  } else {
    $(".container").hide();
    getCoords(displayTimes);
  }
  loadSharing();
  setTimeout(function() {
    $(".subshare").fadeIn();
  }, 2500);
});
