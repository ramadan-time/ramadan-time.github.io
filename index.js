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
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(callback, function(error) {
            callback(DEFAULT_COORDS);
        }, {
            "timeout": 5000
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
    var time1 = 0;
    var time2 = 0;
    var count = 0;
    while ((time1 === 0 || time2 === 0) && count < 10) {
        unit = unit || $.rand([HR, MIN, SEC]);
        var remaining = timeLeft(endTime, unit);
        time1 = $.rand(remaining);
        time2 = remaining - time1;
        count++;
    }
    return {
        "time1": humanizeFloat(time1),
        "time2": humanizeFloat(time2),
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
    var remaining = timeLeft(sunTimes.sunsetStart, SEC);
    var endTimeData;
    if (remaining <= 0) {
        endTimeData = {
            "endTimeKlass": "sunrise",
            "endTime": sunTimes.dawn,
        };
    } else {
        endTimeData = {
            "endTimeKlass": "sunset",
            "endTime": sunTimes.sunsetStart,
        };
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

    // update display after unit units
    setTimeout(function() {
        displayTimes(position);
    }, getTimeoutVal(timeSplit.unit));
}


$(document).ready(function() {
    loadSharing();
    setTimeout(function() {
        $(".subshare").fadeIn();
    }, 2500);
    UNIT_CONVERTER[DAY] = inDays;
    UNIT_CONVERTER[HR] = inHours;
    UNIT_CONVERTER[MIN] = inMinutes;
    UNIT_CONVERTER[SEC] = inSeconds;
    $(".container").hide();
    getCoords(displayTimes);
});
