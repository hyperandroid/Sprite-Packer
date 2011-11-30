/**
 * See LICENSE file.
 */


/**
 * @namespace
 */
TP= {};

TP.ImageUtil= {};

TP.log= function() {

    function f() {
        return window.console.log.apply( this, Array.prototype.slice.call(arguments) );
    };

    if (window && window.console) {
        return f;
    }

    return function() {

    };
};