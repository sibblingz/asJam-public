var format = {
    info: '',
    warn: '\x1B[33m',
    error: '\x1B[1;31m',
    end: '\x1B[0m'
};

var util = require('util');

function Reporter() {
    this.lastStep = null;
    this.lastStepReported = false;
    this.hasError = false;
}

Reporter.prototype = {
    debug: false,

    get_full_message: function get_full_message(tag, message) {
        if (message.stack) {
            // message is an Error object
            if (this.debug) {
                message = message.stack;
            } else {
                message = message.message;
            }
        }

        if (this.debug && tag) {
            return tag + ": " + message;
        } else {
            return String(message);
        }
    },

    info: function info(tag, message, data) {
        // Do nothing
    },

    warn: function warn(tag, message, data) {
        // Do nothing
    },

    error: function error(tag, message, data) {
        this.hasError = true;

        // Do nothing
    },

    step: function step(tag, message, data) {
        this.lastStep = { tag: tag, message: message, data: data };
        this.lastStepReported = false;
    }
};

function ConsoleReporter() {
    Reporter.call(this);
}

util.inherits(ConsoleReporter, Reporter);

ConsoleReporter.prototype.info = function info(tag, message, data) {
    Reporter.prototype.info.call(this, tag, message, data);

    console.info(
        format.info +
        "[INFO] " +
        this.get_full_message(tag, message) +
        format.end
    );
};

ConsoleReporter.prototype.warn = function warn(tag, message, data) {
    Reporter.prototype.warn.call(this, tag, message, data);

    if (this.lastStep && !this.lastStepReported) {
        console.warn("While " + this.lastStep.message + ":");
        this.lastStepReported = true;
    }

    console.warn(
        format.warn +
        "[WARNING] " +
        this.get_full_message(tag, message) +
        format.end
    );
};

ConsoleReporter.prototype.error = function error(tag, message, data) {
    Reporter.prototype.error.call(this, tag, message, data);

    if (this.lastStep && !this.lastStepReported) {
        console.error("While " + this.lastStep.message + ":");
        this.lastStepReported = true;
    }

    console.error(
        format.error +
        "[ERROR] " +
        this.get_full_message(tag, message) +
        format.end
    );
};

function NullReporter() {
    Reporter.call(this);
}

util.inherits(NullReporter, Reporter);

exports.ConsoleReporter = ConsoleReporter;
exports.NullReporter = NullReporter;
