/**
 * See LICENSE file.
 */

(function() {

    /**
     * @constructor
     */
    TP.Image= function() {
        return this;
    };

    TP.Image.prototype= {

        image       : null,
        name        : null,
        thumb       : null,

        rows        : 1,
        columns     : 1,

        optimized   : false,

        setGridSize : function( r, c ) {
            this.rows=      r;
            this.columns=   c;
            
            return this;
        },

        initialize : function( name, image ) {
            this.name= name;
            this.image= image;
            this.thumb= TP.ImageUtil.createThumb( image );

            return this;
        },

        optimize : function() {
            if ( !this.optimized ) {
                this.optimized= true;
                this.image= TP.ImageUtil.optimize(this.image);
            }

            return this;
        },

        getImage : function() {
            return this.image;
        },

        getName : function() {
            return this.name;
        },

        getThumbImage : function() {
            return this.thumb;
        },

        isOptimized : function() {
            return this.optimized;
        },

        getRows : function() {
            return this.rows;
        },

        getColumns : function() {
            return this.columns;
        },

        setName : function(name) {
            this.name= name;
            return this;
        }
    };

})();

(function() {

    /**
     *
     * A packer containes a collection of TP.Image elements (dropped images) and a TP.TexturePage instance.
     *
     * @constructor
     */
    TP.Packer= function() {
        this.imagesList=    [];
        this.listenerList=  [];

        this.createTexturePage();
        this.createWorkingCanvas();

        return this;
    };

    var extractImagesArray= function( imagesList ) {
        var images=[];

        for( var i=0; i<imagesList.length; i++ ) {
            images.push( imagesList[i].getImage() );
        }

        return images;
    };

    TP.Packer.prototype= {

        imagesList           : null,
        pageWidth           : 1024,
        pageHeight          : 1024,
        texturePage         : null,

        imagesPadding       : 0,
        heuristic           : 'area',
        outline             : false,

        workingCanvas       : null,
        ctx                 : null,

        listenerList        : null,

        createTexturePage : function() {
            this.texturePage=   new TP.TexturePage( this.pageWidth, this.pageHeight );
            this.texturePage.setPadding( this.imagesPadding );
            this.texturePage.changeHeuristic( this.heuristic );
            return this;
        },

        changeHeuristic : function( heuristic ) {
            this.texturePage.changeHeuristic( heuristic );
            this.updateAll();
        },

        createWorkingCanvas : function() {
            this.workingCanvas=         document.createElement('canvas');
            this.workingCanvas.width=   this.pageWidth;
            this.workingCanvas.height=  this.pageHeight;
            this.ctx=                   this.workingCanvas.getContext('2d');
        },

        setPageSize : function( w, h ) {
            this.pageWidth=     w;
            this.pageHeight=    h;

            this.createWorkingCanvas();

            this.texturePage.update( false, this.imagesPadding, this.pageWidth, this.pageHeight );

            return this;
        },

        /**
         * Get this packer information representation to be consumed as CSS style.
         */
        createCSSData : function() {
            return ''
        },

        /**
         * Get this packer information representation to be consumed by a CAAT.SpriteImage object instance.
         */
        createCAATData : function() {
            return '';
        },

        addImage : function( name, image ) {
            var tpImage= new TP.Image().initialize( name, image );

            this.imagesList.push( tpImage );
            this.updateAll();

            return this;
        },

        removeImage : function( imageName ) {
            for( var i=0; i<this.imagesList.length; i++ ) {
                if ( this.imagesList[i].getName()===imageName ) {
                    this.imagesList.splice(i,1);
                    this.updateAll();
                    return this;
                }
            }
        },

        /**
         * Reset this packer. All images and contained info will be removed.
         */
        clear : function() {
            this.imagesList= [];
            this.texturePage.clear();
            this.ctx.clearRect(0,0,this.workingCanvas.width,this.workingCanvas.height);
            this.fireChangeEvent();
            return this;
        },

        setImagesPadding : function( padding ) {
            this.texturePage.setPadding( padding );

            this.updateAll();
            return this;
        },

        updatePacker : function( pw, ph, padding, heuristic ) {
            this.pageWidth=     pw;
            this.pageHeight=    ph;
            this.imagesPadding= padding;
            this.heuristic=     heuristic;

            this.createTexturePage();
            this.updateAll();

            return this;
        },

        getNumImages : function() {
            return this.imagesList.length;
        },

        getImageElement : function( index ) {
            return this.imagesList[ index ];
        },

        updateAll : function() {
            this.texturePage.createFromImages( extractImagesArray(this.imagesList) );
            this.texturePage.toCanvas( this.workingCanvas, false );
            this.fireChangeEvent();
            return this;
        },

        getCanvas : function( outline ) {
            this.texturePage.toCanvas( this.workingCanvas, false );

            return this.workingCanvas;
        },

        setOutline : function( bool ) {
            this.outline= bool;
            this.updateAll();
        },

        addChangeListener : function( f ) {
            this.listenerList.push(f);
            return this;
        },

        fireChangeEvent : function( ) {
            for( var i= this.listenerList.length-1; i>=0; i-- ) {
                this.listenerList[i]( this );
            }
        },

        drawOn : function( canvas, ctx ) {

            ctx.fillStyle='rgba(0,0,0,0)';
            ctx.clearRect(0,0,canvas.width,canvas.height);

            ctx.drawImage( this.workingCanvas, 0, 0, canvas.width, canvas.height );

            var sx= canvas.width/this.workingCanvas.width;
            var sy= canvas.height/this.workingCanvas.height;


            ctx.strokeStyle= 'blue';
            if ( this.outline ) {
                for( var i=0; i< this.imagesList.length; i++ ) {

                    var imgE= this.imagesList[i];
                    var img=  imgE.getImage();

                    for( var t=0; t<imgE.getRows(); t++ ) {
                        for( var u=0; u<imgE.getColumns(); u++ ) {
                            ctx.strokeRect(
                                    sx*(img.__tx+ u*img.__w/imgE.getColumns()),
                                    sy*(img.__ty+ t*img.__h/imgE.getRows()),
                                    sx*(img.__w/imgE.getColumns()),
                                    sy*(img.__h/imgE.getRows()) );
                        }
                    }

                }
            }



        }

    };
})();