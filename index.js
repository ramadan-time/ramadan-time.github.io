"use strict";

var END_DATE = new Date("Sat Jul 18 2015");
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
UNIT_TIMES[SEC] = 1000;
UNIT_TIMES[MIN] = UNIT_TIMES[SEC] * 60;
UNIT_TIMES[HR] = UNIT_TIMES[MIN] * 60;
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
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(callback, function(error) {
            callback(DEFAULT_COORDS);
        });
    } else {
        callback(DEFAULT_COORDS);
    }
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
    if (val === 1) {
        unit = unit.slice(0, -1);
    }
    return unit;
}

function getTimeoutVal(unit) {
    return UNIT_TIMES[unit];
}

/*
 * Returns an object containing
 * two times splitting the time left
 * into two parts.
 */
function getTimeUntil(endTime, unit) {
    unit = unit || $.rand([HR, MIN, SEC]);
    var remaining = timeLeft(endTime, unit);
    var time1 = $.rand(remaining);
    var time2 = remaining - time1;
    return {
        "time1": humanizeFloat(time1),
        "time2": humanizeFloat(time2),
        "unit": unit,
        // for internationalization
        "unit1": humanizeUnit(time1, unit),
        "unit2": humanizeUnit(time2, unit),
    }
}

/*
 * Return the amount of time left between
 * now and `endTime` in the given units
 */
function timeLeft(endTime, unit) {
    var diff = endTime.getTime() - Date.now();
    return UNIT_CONVERTER[unit](diff);
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

function main() {
    getCoords(displayTimes);
}

function displayTimes(position) {
    var sunTimes = SunCalc.getTimes(new Date(), position.coords.latitude, position.coords.longitude);
    var daySplit = getTimeUntil(END_DATE, DAY);
    var timeSplit = getTimeUntil(sunTimes.sunsetStart);
    displayDaySplit(daySplit, ".daySplit");
    displayTimeSplit(timeSplit, ".timeSplit");
    // update display after unit units
    setTimeout(main, getTimeoutVal(timeSplit.unit));
}

$(function() {
    UNIT_CONVERTER[DAY] = inDays;
    UNIT_CONVERTER[HR] = inHours;
    UNIT_CONVERTER[MIN] = inMinutes;
    UNIT_CONVERTER[SEC] = inSeconds;
    displayTimes(DEFAULT_COORDS);
    main();
});
