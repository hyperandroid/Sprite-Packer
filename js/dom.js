(function() {

    function cumulateOffset(node, parent, prop) {
        var left= prop+'Left';
        var top= prop+'Top';
        var x=0, y=0, style;

        while( navigator.browser!=='iOS' && node && node.style ) {
            if ( node.currentStyle ) {
                style= node.currentStyle['position'];
            } else {
                style= (node.ownerDocument.defaultView || node.ownerDocument.parentWindow).getComputedStyle(node, null);
                style= style ? style.getPropertyValue('position') : null;
            }

//                if (!/^(relative|absolute|fixed)$/.test(style)) {
            if (!/^(fixed)$/.test(style)) {
                x += node[left];
                y+= node[top];
                node = node[parent];
            } else {
                break;
            }
        }

        return {
            x:      x,
            y:      y,
            style:  style
        };
    };

    function getOffset( node ) {
        var res= cumulateOffset(node, 'offsetParent', 'offset');
        if ( res.style==='fixed' ) {
            var res2= cumulateOffset(node, node.parentNode ? 'parentNode' : 'parentElement', 'scroll');
            return {
                x: res.x + res2.x,
                y: res.y + res2.y
            };
        }

        return {
            x: res.x,
            y: res.y
        };
    };

    /**
     * Normalize input event coordinates to be related to (0,0) canvas position.
     * @param point {CAAT.Point} a CAAT.Point instance to hold the canvas coordinate.
     * @param e {MouseEvent} a mouse event from an input event.
     */
    function getCanvasCoord(e) {

        var posx = 0;
        var posy = 0;
        if (!e) e = window.event;

        if (e.pageX || e.pageY) {
            posx = e.pageX;
            posy = e.pageY;
        }
        else if (e.clientX || e.clientY) {
            posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }

        var offset= getOffset(e.target);

        posx-= offset.x;
        posy-= offset.y;

        //////////////
        // transformar coordenada inversamente con affine transform de director.

        return {
            x: posx,
            y: posy
        };
    }

    TP.getCoord= function( e ) {
        return getCanvasCoord( e );
    }

})()