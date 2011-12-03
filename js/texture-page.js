/**
 * See LICENSE file.
 */

(function() {

    TP.TextureElement = function() {
        return this;
    };

    TP.TextureElement.prototype= {
        inverted:   false,
        image:      null,
        u:          0,
        v:          0,
        glTexture:  null
    };

})();

(function() {
    TP.TextureScan= function(w) {
        this.freeChunks=[ {position:0, size:w||1024} ];
        return this;
    };

    TP.TextureScan.prototype= {
        freeChunks: null,

        /**
         * return an array of values where a chunk of width size fits in this scan.
         * @param width
         */
        findWhereFits : function( width ) {
            if ( this.freeChunks.length===0 ) {
                return [];
            }

            var fitsOnPosition= [];
            var i;

            for( i=0; i<this.freeChunks.length; i++ ) {
                var pos= 0;
                while( pos+width<= this.freeChunks[i].size ) {
                    fitsOnPosition.push( pos+this.freeChunks[i].position );
                    pos+= width;
                }
            }

            return fitsOnPosition;
        },
        fits : function( position, size ) {
            var i=0;

            for( i=0; i<this.freeChunks.length; i++ ) {
                var fc= this.freeChunks[i];
                if ( fc.position<=position && position+size<=fc.position+fc.size ) {
                    return true;
                }
            }

            return false;
        },
        substract : function( position, size ) {
            var i=0;

            for( i=0; i<this.freeChunks.length; i++ ) {
                var fc= this.freeChunks[i];
                if ( fc.position<=position && position+size<=fc.position+fc.size ) {
                    var lp=0;
                    var ls=0;
                    var rp=0;
                    var rs=0;

                    lp= fc.position;
                    ls= position-fc.position;

                    rp= position+size;
                    rs= fc.position+fc.size - rp;

                    this.freeChunks.splice(i,1);

                    if ( ls>0 ) {
                        this.freeChunks.splice( i++,0,{position: lp, size:ls} );
                    }
                    if ( rs>0 ) {
                        this.freeChunks.splice( i,0,{position: rp, size:rs} );
                    }

                    return true;
                }
            }

            return false;
        },
        log : function(index) {
            if ( 0===this.freeChunks.length ) {
                TP.log('index '+index+' empty');
            } else {
                var str='index '+index;
                for( var i=0; i<this.freeChunks.length; i++ ) {
                    var fc= this.freeChunks[i];
                    str+='['+fc.position+","+fc.size+"]";
                }
                TP.log(str);
            }
        }
    };
})();

(function() {
    TP.TextureScanMap= function(w,h) {
        this.scanMapHeight= h;
        this.scanMapWidth= w;

        this.scanMap= [];
        for( var i=0; i<this.scanMapHeight; i++ ) {
            this.scanMap.push( new TP.TextureScan(this.scanMapWidth) );
        }

        return this;
    };
    
    TP.TextureScanMap.prototype= {
        scanMap:        null,
        scanMapWidth:   0,
        scanMapHeight:  0,

        /**
         * Always try to fit a chunk of size width*height pixels from left-top.
         * @param width
         * @param height
         */
        whereFitsChunk : function( width, height ) {

            // trivial rejection:
            if ( width>this.width||height>this.height) {
                return null;
            }

            // find first fitting point
            var i,j,initialPosition= 0;

            while( initialPosition<=this.scanMapHeight-height) {

                // para buscar sitio se buscar‡ un sitio hasta el tama–o de alto del trozo.
                // mas abajo no va a caber.

                // fitHorizontalPosition es un array con todas las posiciones de este scan donde
                // cabe un chunk de tama–o width.
                var fitHorizontalPositions= null;
                var foundPositionOnScan=    false;

                for( ; initialPosition<=this.scanMapHeight-height; initialPosition++ ) {
                    fitHorizontalPositions= this.scanMap[ initialPosition ].findWhereFits( width );

                    // si no es nulo el array de resultados, quiere decir que en alguno de los puntos
                    // nos cabe un trozo de tama–o width.
                    if ( null!==fitHorizontalPositions && fitHorizontalPositions.length>0 ) {
                        foundPositionOnScan= true;
                        break;
                    }
                }

                if ( foundPositionOnScan ) {
                    // j es el scan donde cabe un trozo de tama–o width.
                    // comprobamos desde este scan que en todos los scan verticales cabe el trozo.
                    // se comprueba que cabe en alguno de los tama–os que la rutina de busqueda horizontal
                    // nos ha devuelto antes.

                    var minInitialPosition=Number.MAX_VALUE;
                    for( j=0; j<fitHorizontalPositions.length; j++ ) {
                        var fits= true;
                        for( i=initialPosition; i<initialPosition+height; i++ ) {
                            // hay un trozo que no cabe
                            if ( !this.scanMap[i].fits( fitHorizontalPositions[j], width ) ) {
                                fits= false;
                                break;
                            }
                        }

                        // se ha encontrado un trozo donde la imagen entra.
                        // d.p.m. incluirla en posicion, y seguir con otra.
                        if ( fits ) {
                            return { x: fitHorizontalPositions[j], y: initialPosition };
                        } 
                    }

                    initialPosition++;
                } else {
                    // no hay sitio en ningun scan.
                    return null;
                }
            }

            // no se ha podido encontrar un area en la textura para un trozo de tama–o width*height
            return null;
        },
        substract : function( x,y, width, height ) {
            for( var i=0; i<height; i++ ) {
                if ( !this.scanMap[i+y].substract(x,width) ) {
                    TP.log('Error: removing chunk ',width,height,' at ',x,y);
                }
            }
        },
        log : function() {
            for( var i=0; i<this.scanMapHeight; i++ ) {
                this.scanMap[i].log(i);
            }
        }
    };
})();

(function() {
    TP.TexturePage= function(w,h) {
        this.width=         w || 1024;
        this.height=        h || 1024;
        this.images=        [];

        return this;
    };

    TP.TexturePage.prototype= {

        width:                  1024,
        height:                 1024,
        allowImagesInvertion:   false,
        padding:                0,
        scan:                   null,
        images:                 null,
        criteria:               'area',

        create: function(imagesCache) {

            var images= [];
            for( var i=0; i<imagesCache.length; i++ ) {
                var img= imagesCache[i].image;
                if ( !img.__texturePage ) {
                    images.push( img );
                }
            }

            this.createFromImages(images);
        },

        clear : function() {
            this.createFromImages([]);
        },

        setPadding : function( p ) {
            this.padding= p;
        },

        update : function(invert,padding,width,height) {
            this.allowImagesInvertion= invert;
            this.padding= padding;

            if ( width<100 ) {
                width= 100;
            }
            if ( height<100 ) {
                height= 100;
            }

            this.width=  width;
            this.height= height;
            
            this.createFromImages(this.images);
        },

        createFromImages : function( images ) {

            var i;

            this.scan=   new TP.TextureScanMap( this.width, this.height );
            this.images= [];

            if ( this.allowImagesInvertion ) {
                for( i=0; i<images.length; i++ ) {
                    images[i].inverted= this.allowImagesInvertion && images[i].height<images[i].width;
                }
            }

            var me= this;

            images.sort( function(a,b) {

                var aarea= a.width*a.height;
                var barea= b.width*b.height;

                if ( me.criteria==='width' ) {
                    return a.width<b.width ? 1 : a.width>b.width ? -1 : 0;
                } else if ( me.criteria==='height' ) {
                    return a.height<b.height ? 1 : a.height>b.height ? -1 : 0;
                }
                return aarea<barea ? 1 : aarea>barea ? -1 : 0;
            });

            for( i=0; i<images.length; i++ ) {
                var img=  images[i];
                this.packImage(img);
            }
        },

        addImage : function( image, invert ) {
            this.allowImagesInvertion= invert;
            this.images.push(image);
            this.createFromImages(Array.prototype.slice.call(this.images));
        },

        deletePage : function() {
            for( var i=0; i<this.images.length; i++ ) {
                delete this.images[i].__texturePage;
                delete this.images[i].__u;
                delete this.images[i].__v;
            }

        },

        toCanvas : function(canvass, outline) {

            canvass= canvass || document.createElement('canvas');
            canvass.width= this.width;
            canvass.height= this.height;
            var ctxx= canvass.getContext('2d');
            ctxx.fillStyle= 'rgba(0,0,0,0)';
            ctxx.fillRect(0,0,this.width,this.height);

            for( var i=0; i<this.images.length; i++ ) {
                ctxx.drawImage(
                        this.images[i],
                        this.images[i].__tx,
                        this.images[i].__ty );
                if ( outline ) {
                    ctxx.strokeStyle= 'red';
                    ctxx.strokeRect(
                            this.images[i].__tx,
                            this.images[i].__ty,
                            this.images[i].__w,
                            this.images[i].__h );
                }

                if ( this.images[i].__gridC && this.images[i].__gridR ) {
                    for( var t=0; t<this.images[i].__gridR; t++ ) {
                        for( var u=0; u<this.images[i].__gridC; u++ ) {
                            ctxx.strokeStyle= 'blue';
                            ctxx.strokeRect(
                                    this.images[i].__tx+ u*this.images[i].__w/this.images[i].__gridC,
                                    this.images[i].__ty+ t*this.images[i].__h/this.images[i].__gridR,
                                    this.images[i].__w/this.images[i].__gridC,
                                    this.images[i].__h/this.images[i].__gridR
                                    );
                        }
                    }
                }
            }


            if (outline) {
                ctxx.strokeStyle= 'red';
                ctxx.strokeRect(0,0,this.width,this.height);
            }

            return canvass;
        },
        packImage : function(img) {
            var newWidth, newHeight;
            if ( img.inverted ) {
                newWidth= img.height;
                newHeight= img.width;
            } else {
                newWidth= img.width;
                newHeight= img.height;
            }

            var w= newWidth;
            var h= newHeight;

            var mod;

            // dejamos un poco de espacio para que las texturas no se pisen.
            // coordenadas normalizadas 0..1 dan problemas cuando las texturas no est‡n
            // alineadas a posici—n mod 4,8...
            if ( w && this.padding ) {
                mod= this.padding;
                if ( w+mod<=this.width ) {
                    w+=mod;
                }
            }
            if ( h && this.padding ) {
                mod= this.padding;
                if ( h+mod<=this.height ) {
                    h+=mod;
                }
            }
            
            var where=  this.scan.whereFitsChunk( w, h );
            if ( null!==where ) {
                this.images.push( img );

                img.__tx= where.x;
                img.__ty= where.y;
                img.__u=  where.x / this.width;
                img.__v=  where.y / this.height;
                img.__u1= (where.x+newWidth) / this.width;
                img.__v1= (where.y+newHeight) / this.height;
                img.__texturePage= this;
                img.__w= newWidth;
                img.__h= newHeight;

                this.scan.substract(where.x,where.y,w,h);
            } else {
                TP.log('Imagen ',img.src,' de tama–o ',img.width,img.height,' no cabe.');
            }
        },

        changeHeuristic : function(criteria) {
            this.criteria= criteria;
        }
    };
})();