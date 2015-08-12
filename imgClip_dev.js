var $_$, 
ATONG =ATONG || {};

ATONG.$ = function (id) {
    return document.getElementById(id);
};

ATONG.nameSpace = function ( name ) {
    var parts = name.split( '.' ),
    current = ATONG;
    for ( var i in parts ) {
        if ( !current[ parts[ i ] ] ) {
            current[ parts[ i ] ] = {};
        }
        current = current[ parts[ i ] ];
    }
};

ATONG.nameSpace('util');

ATONG.util.aFuncTag = [];

ATONG.util.order = 0;

ATONG.util.bindEvent = function ( obj, sEv, fn ) {//等替换完成后，可以改为bind
    var aFuncTag = ATONG.util.aFuncTag;
    if ( obj.addEventListener ) {
        obj.addEventListener( sEv ,fn ,false );
    }
    else {
        obj.attachEvent( 'on'+sEv, fn );
    }
    aFuncTag[ ATONG.util.order ] = fn;
    return ( ATONG.util.order++ );
    
};

ATONG.util.unbindEvent = function ( obj, sEv, fn ) {
    if ( obj.removeEventListener ) {
        obj.removeEventListener( sEv ,fn ,false );
    }
    else {
        obj.detachEvent( 'on'+sEv, fn );
    }
};

ATONG.util.createEle = function (tag) {
    return document.createElement(tag);
};

ATONG.util.getStyle = function (obj, name) {
    if(obj.currentStyle) {
        return obj.currentStyle[name];
    }
    else {
        return getComputedStyle(obj, false)[name];
    }
};

    
ATONG.util.scrollTop = function () {
    return document.body.scrollTop || document.documentElement.scrollTop;
};

ATONG.util.scrollLeft = function () {
    return document.body.scrollLeft || document.documentElement.scrollLeft;
};

ATONG.util.getPos = function (obj) {
    var scrollTop = ATONG.util.scrollTop,
    scrollLeft = ATONG.util.scrollLeft,
    cumulativeOffset = obj.getBoundingClientRect(),
    l =0,t = 0;
    if(obj.getBoundingClientRect()) {
        return {
            left : cumulativeOffset.left + scrollLeft(),
            top : cumulativeOffset.top + scrollTop()
        }
    }
    else {
        while(obj) {
            l+=obj.offsetLeft;
            t+=obj.offsetTop;		
            obj=obj.offsetParent;
        }	
        return {
            left: l, 
            top: t
        };
    
    }
};

ATONG.util.getByClass = function (oParent, sClass) {
    if( document.getElementsByClassName ) {
        return oParent.getElementsByClassName( sClass );
    }
    else {
        var aEle=oParent.getElementsByTagName('*'),
        aResult=[],
        i=0;
        re=new RegExp('\\b'+sClass+'\\b');
     
        for(i=0;i<aEle.length;i++) {
            if(re.test(aEle[i].className)) {
                aResult.push(aEle[i]);
            }
        }
        return aResult;
    }
};

ATONG.util.animate = function(obj, json, fn) {
    var getStyle = ATONG.util.getStyle;
    
    clearInterval(obj.timer);
    obj.timer=setInterval(function (){
        var bStop=true;
			
        for(var attr in json) {
            var iCur=0;
				
            if(attr=='opacity') {
                iCur=Math.round(parseFloat(getStyle(obj, attr))*100);
            }
            else {
                iCur=parseInt(getStyle(obj, attr));
            }
				
            var iSpeed=(json[attr]-iCur)/8;
            iSpeed=iSpeed>0?Math.ceil(iSpeed):Math.floor(iSpeed);
				
            if(attr=='opacity') {
                obj.style.filter='alpha(opacity:'+Math.round(iCur+iSpeed)+')';
                obj.style.opacity=Math.round(iCur+iSpeed)/100;
            }
            else {
                obj.style[attr]=iCur+iSpeed+'px';
            }
				
            if(iCur!=json[attr]) {
                bStop=false;
            }
        }
			
        if(bStop) {
            clearInterval(obj.timer);
            if(fn) {
                fn();
            }
        }
    }, 30);
};

ATONG.onDOMContentLoaded =function (onReady ) {
    var isOpera = Object.prototype.toString.call(window.opera) == '[object Opera]',
    IE = !!window.attachEvent && !isOpera;
    isReady = false,
    doReady = function () {
        if ( isReady ) return;
        isReady = true;
        onReady();
    };
    
    if ( IE ) {
        document.attachEvent("onreadystatechange", function() {
            if ( document.readyState == "complete" ) {
                document.detachEvent("onreadystatechange", arguments.callee );
                doReady();
            }
        });
        (function () {
            if ( isReady ) return;
            try {
                document.documentElement.doScroll ( 'left' );
            } catch ( e ) {
                setTimeout ( arguments.callee , 48 );
                return;
            }
            
            doReady();
        })();
    
    }
    else {
        document.addEventListener ( 'DOMContentLoaded', function () {
            document.removeEventListener('DOMContentLoaded' , arguments.callee, false );
            doReady();
        }, false );
    }
};
$_$ = ATONG.onDOMContentLoaded;

/**~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~**/

ATONG.util.ImgClip =function (options) {
    
    options = options || { };

    if ( !options.target  ) {
        alert( 'Qin,You need to be introduced into an image object reference!' );
        return;
    }
    
    /***初始化变量 开始**/
    var bindEvent = ATONG.util.bindEvent,
    unbindEvent = ATONG.util.unbindEvent,
    createEle = ATONG.util.createEle,
    getStyle = ATONG.util.getStyle,
    getPos = ATONG.util.getPos,
    getByClass = ATONG.util.getByClass,
    startMove = ATONG.util.animate,
    scrollTop = ATONG.util.scrollTop,
    scrollLeft = ATONG.util.scrollLeft,
    aFuncTag = ATONG.util.aFuncTag,
  
    oTarget = options.target,
    toScale = options.toScale || 0,//是否等比例缩放、默认 ,0 就是false
    oParent = options.parent || document.body,
    onChange = options.onChange || function(){},
    bFade = options.fade || 0,
    minWidth = options.minWidth || 0,// update 0417
    minHeight = options.minHeight || 0,
    minSize = Math.max( minWidth,minHeight ),
    zzz = options.aspectRatio,
    
    oParentPos = null,//存储指定插入到的那个元素所在的位置信息
    oTopParent = null,//指定插入元素 所在的顶级父元素，就是body的第一层子元素
    oHandle = null,
    imgAreaClip = createEle('div'),
    targetPos = getPos(oTarget),//获取目标对象的位置信息
    alphaImg = oTarget.cloneNode(),
    clipImg = oTarget.cloneNode(),
    selectionBox = createEle('div'),
    handleSize = null,
    aI=[],
    
    CHROME = !!window.chrome ,
    
    oTopMiddleHandle,// 顶部中间手柄
    oRightMiddleHandle,
    oBottomMiddleHandle,
    oLeftMiddleHandle,
    
    selection = {//选区框信息,改为局部变量
        left : 0,
        top : 0,
        width :0,
        height : 0
    },
    imgOfs = {//目标图片的信息
        left:0,
        top:0,
        width:0,
        height:0
    },
    
    parOfs = {
        left :0,
        top :0
    },

    getTopParent =function ( oP ) {
        while(oP) {
            if( oP.parentNode ==document.body ) return oP;
            oP = oP.parentNode;
        }
        return false;
    };
    
    /***初始化变量 end**/

    /***初始化节点 开始**/
    imgAreaClip.id = 'imgAreaClip';
    imgAreaClip.className = 'imgClip';

    imgAreaClip.style.left = targetPos.left+'px';
    imgAreaClip.style.top = targetPos.top+'px';
    
    selectionBox.id = 'selectionBox';
    selectionBox.className ='add-cursor';

    alphaImg.id = 'alphaImg';
    clipImg.id = 'imgClip';


    
    
    for(var i=0;i<12;i++){
        aI[i] = createEle('i');
        if(i<4){
            aI[i].className = 'custom-border';
        }
        else {
            aI[i].className = 'hand';
        }
        selectionBox.appendChild(aI[i]);
    }
    
    aI[0].className += ' border-t';
    aI[1].className += ' border-r';
    aI[2].className += ' border-b';
    aI[3].className += ' border-l';
    aI[4].className += ' rb';
    aI[5].className += ' lt';
    aI[6].className += ' lb';
    aI[7].className += ' rt';
    aI[8].className += ' tm';
    aI[9].className += ' rm';
    aI[10].className += ' bm';
    aI[11].className += ' lm';

    
    

    oTopMiddleHandle = getByClass( selectionBox, 'tm' )[ 0 ];
    oRightMiddleHandle = getByClass( selectionBox, 'rm' )[ 0 ];
    oBottomMiddleHandle = getByClass( selectionBox, 'bm' )[ 0 ];
    oLeftMiddleHandle = getByClass( selectionBox, 'lm' )[ 0 ];
    
    imgAreaClip.appendChild(alphaImg);
    imgAreaClip.appendChild(clipImg);
    imgAreaClip.appendChild(selectionBox);

    oParent.appendChild(imgAreaClip);
    oHandle = getByClass( selectionBox, 'hand' );

    if( oParent !==document.body ) {
        oTopParent = getTopParent( oParent );
        
        if (getStyle( oTopParent, 'position' ) ==='static') {
            oTopParent.style.position = 'relative'; 
        } 
        
        oTopParent.style.zIndex = 99999;
    }

    oParentPos = getPos(oParent);
    //alert(oParent..top+scrollTop()==oParentPos.top);
    
    parOfs.left = oParentPos.left;
    parOfs.top = oParentPos.top;

    imgOfs.left = targetPos.left;
    imgOfs.top = targetPos.top;
    imgOfs.width = oTarget.offsetWidth;
    imgOfs.height = oTarget.offsetHeight;
    
    handleSize = aI[7].offsetHeight; //手柄的大小，因为宽高相同，所以我就直接写一个了
    
    imgAreaClip.style.height=imgOfs.height+'px';
    imgAreaClip.style.width=imgOfs.width+'px';
    imgAreaClip.style.left = imgOfs.left-parOfs.left+'px';
    imgAreaClip.style.top = imgOfs.top-parOfs.top+'px';
    
    alphaImg.style.height = clipImg.style.height =imgOfs.height+'px';
    alphaImg.style.width = clipImg.style.width =imgOfs.width+'px';
    alphaImg.style.left = clipImg.style.left = alphaImg.style.top = clipImg.style.top = 0;//因为复制节点会把行内属性也复制过来，所有这里还要设置一下

    function setStyle( obj, options ) {
        for( var i in options ) {
            obj.style[i] = options[i];
        }
    }

    function showOrHideHandle (name) {
        var i,l;
        for(i = 0,l = oHandle.length;i<l;i+=1 ) {
            //oHandle[i].style.display = name;
            setStyle( oHandle[i], name  );
        }
    }
    /***初始化节点 结束**/
    
    function fnWrapDown (ev){//在目标区域按下的时候 优化的空间大
        var oEvent  = ev || event,
        nImgMoveTag = 0,
        nImgUpTag = 0,
        nDocMoveTag = 0,
        nDocUpTag = 0,
        x1,x2,y1,y2;
        x1 = oEvent.clientX-imgOfs.left+scrollLeft();//x1应该定义为全局变量
        y1 = oEvent.clientY-imgOfs.top+scrollTop();
        
        selection.left = x1;//x1是刚按下的，x2是移动过程中的那个x坐标，可以假设为最后一个
        selection.top = y1;
        
        selectionBox.style.left = selection.left+'px';
        selectionBox.style.top = selection.top+'px';
        
        

        //imgClip.style.clip = 'rect(auto)';
        //if ( IE ) imgClip.style.clip = 'rect(0 0 0 0)';//按下的时候为 0000，就是灰色，松开的时候如果选区框宽高不为0，那么imgClip为rect(auto)
        //alert(/auto|undefined/.test(getStyle( imgClip, 'clip')))
        //alert(bFade && (/auto|undefined/.test(getStyle( imgClip, 'clip')) || selection.width ==0));
        if( bFade ) {//如果宽高为0，那么释放鼠标的时候，就让透明层显示
            //alert((/auto|undefined/.test(getStyle( imgClip, 'clip'))))
            if ( !selection.width ){ //getStyle( imgClip, 'clip') ，ie678 一直获取的是undefined， (/auto|undefined/.test(getStyle( imgClip, 'clip'))|| !selection.width)
                // console.log(getStyle( imgClip, 'clip'));
                alphaImg.style.opacity = '1';
                alphaImg.style.filter = 'alpha(opacity=100)';
                startMove ( alphaImg, {
                    opacity : 50
                } );
            } else {
                alphaImg.style.opacity = '0.5';
                alphaImg.style.filter = 'alpha(opacity=50)';
            }

        }
        imgClip.style.clip = 'rect(0px 0px 0px 0px)';

        selection.width = selectionBox.style.width =0;
        selection.height = selectionBox.style.height = 0;


        showOrHideHandle( {
            'display':'none'
        } );
        //console.info(imgAreaClip.setCapture);
        if(imgAreaClip.setCapture){
            
            nImgMoveTag = bindEvent( imgAreaClip,'mousemove', function(e){
                fnWrapMove.call( imgAreaClip,e );
            } );
            nImgUpTag = bindEvent( imgAreaClip,'mouseup', function(){
                fnWrapUp.call( imgAreaClip );
            } );
            
            imgAreaClip.setCapture();
        }
        else {
            nDocMoveTag = bindEvent( document,'mousemove', function(e){
                fnWrapMove.call( document, e );
            } );
            nDocUpTag = bindEvent( document,'mouseup', function(){
                fnWrapUp.call( document );
            } );
        }
        function fnWrapMove (ev) { //在图片区域移动
            var oEvent = ev || event;
            // console.log(oEvent);
            x2 = oEvent.clientX+scrollLeft()-imgOfs.left;
            y2 = oEvent.clientY+scrollTop()-imgOfs.top;
            
            toScale ? sameScale.call(imgAreaClip, x1,y1,x2,y2 ) :  noScaleWrap( x1,y1,x2,y2 );//是否等比例

            oTopMiddleHandle.style.left = oBottomMiddleHandle.style.left =((selection.width-handleSize)>>1)+'px';
            oRightMiddleHandle.style.top = oLeftMiddleHandle.style.top = ((selection.height-handleSize)>>1)+'px';
            
            selectionBox.className = '';
            
            var oCustomBorder = getByClass(selectionBox,'custom-border');
            for (var i =0,l = oCustomBorder.length;i<l;i++) {
                oCustomBorder[i].style.width = selection.width+'px';
                oCustomBorder[i].style.height = selection.height+'px';
            }      
            imgClip.style.clip = 'rect( '+selection.top+'px'+' '+(selection.left+selection.width)+'px'+' '+(selection.top+selection.height)+'px'+' '+selection.left+'px'+' )';//这个要放在函数内部
            onChange( selection );
        
        }//fnWrapMove end
        
        function fnWrapUp () {
            selectionBox.className = 'add-cursor';
            
            showOrHideHandle( {
                'display':'block'
            } );
            
            if(this.releaseCapture) {
                this.releaseCapture();
                unbindEvent( this,'mousemove', aFuncTag[ nImgMoveTag ]);
                unbindEvent( this,'mouseup', aFuncTag[ nImgUpTag ] );
            }
            else {
                unbindEvent( this,'mousemove', aFuncTag[ nDocMoveTag ] );
                unbindEvent( this,'mouseup', aFuncTag[ nDocUpTag ] );
            }
            
            //update 412 s
            if( !selection.width && !selection.height ) {//如果宽高为0，那么释放鼠标的时候，就让透明层显示
                //if ( IE )  imgClip.style.clip = 'rect(auto)';//这里的ie是6和7
                //else {
                if ( bFade ) {                 
                    startMove( alphaImg, {
                        opacity : 100
                    } );
                }
                else {
                    imgClip.style.clip = 'rect(auto auto auto auto)';
                }
                
            //}
            }
            else {
                
            }
        //update 412 e
        
            
        }  
        !!oEvent.preventDefault && oEvent.preventDefault(); //return false;取消默认事件，即文字选中
    }    

    bindEvent( imgAreaClip,'mousedown', fnWrapDown );
    
    /*********************selectionDrag start****************************/
    
    function selectionDrag(obj) {//对选区框进行拖拽
        
        bindEvent( obj, 'mousedown', selectionDown );
        
        function selectionDown (ev) {
            var oEvent=ev||event;	
            var disX=oEvent.clientX-obj.offsetLeft;
            var disY=oEvent.clientY-obj.offsetTop;	

            if(obj.setCapture){
                
                bindEvent( obj,'mousemove', selectionMove );
                bindEvent( obj,'mouseup', selectionUp );
                
                obj.setCapture();
            }
            else{
                bindEvent( document,'mousemove', selectionMove );
                bindEvent( document,'mouseup', selectionUp );
            }
                
            function selectionMove(ev){
                var oEvent=ev||event;
                selection.left = oEvent.clientX-disX;
                selection.top = oEvent.clientY-disY;
                if (selection.left<0) {
                    selection.left=0;
                }
                if(selection.left>imgOfs.width-selection.width) {
                    selection.left = imgOfs.width-selection.width;
                }
                if(selection.top<0){
                    selection.top=0;
                }
                if(selection.top>imgOfs.height-selection.height) {
                    selection.top=imgOfs.height-selection.height;
                }
                obj.style.left=selection.left+'px';
                obj.style.top=selection.top+'px';
                imgClip.style.clip = 'rect( '+selection.top+'px'+' '+(selection.left+selection.width)+'px'+' '+(selection.top+selection.height)+'px'+' '+selection.left+'px'+' )';//这个要放在函数内部
                
                onChange( selection );
            }
            
            function selectionUp(){
                
                if(obj.releaseCapture) {
                    obj.releaseCapture();
                }
                unbindEvent( this,'mousemove', selectionMove );
                unbindEvent( this,'mouseup', selectionUp );
            }
            
            oEvent.cancelBubble = true;
            !!oEvent.preventDefault && oEvent.preventDefault();//return false;
        }        
    }

    selectionDrag( selectionBox ); //对选区框进行拖拽
    
    /***********************selectionDrag end**********************************/
    /*在目标区域拖拽、移动的时候，没有比例的情况下*/
    function noScaleWrap (x1,y1,x2,y2) {
        selection.width  = Math.abs(x2-x1);
        selection.height = Math.abs(y2-y1);
        
        if (x1-x2>=0&&y1-y2<=0) {
            selection.left =x2;//selection.top =y1;//没有比例的时候，这里可以不写selection.top的，只有在有比例的时候，这里是要写的   
            
            if (selection.left<0){//如果两个角度的判断是一样的，那么就提取在两个角度的最下面
                selection.left=0;
                selection.width = x1;
            }
                
            if (selection.height>imgOfs.height-selection.top) {//下边界
                selection.height=imgOfs.height-selection.top;//没有比例的时候
                selection.left = x1-selection.width;
            }
        }
        else if (x1-x2<=0 && y1-y2<=0) {
            if (selection.width>imgOfs.width-selection.left) {//判断 左边界，当宽度超过左边界，让高度等于宽度
                selection.width=imgOfs.width-selection.left;//没有比例的时候    
            }
            if (selection.height>imgOfs.height-selection.top) {//下边界
                selection.height=imgOfs.height-selection.top;//没有比例的时候
            }
        }
        else if((x1-x2>=0 && y1-y2>=0) ){
            selection.left = x2;
            selection.top  = y2;
            
            if (selection.left<0) {
                selection.left = 0;
                selection.width = x1;
                selection.top = y1-selection.height;
            }
            if (selection.top<0){
                selection.top = 0;
                selection.height =y1; 
                selection.left = x1-selection.width;
            }
        }
        else if ((x1-x2<=0 && y1-y2>=0)) {
            selection.top = y2;//这里去掉了，/selection.left = x1,//没有比例的时候，这里可以不写的，只有在有比例的时候，这里是要写的  
            
            if (selection.width>imgOfs.width-selection.left) {//判断 左边界，当宽度超过左边界，让高度等于宽度
                selection.width=imgOfs.width-selection.left;//没有比例的时候
                selection.top = y1-selection.height;
            }
            if (selection.top<0) {//下边界
                selection.top = 0;
                selection.height = y1;
            }
        }
				 
        selectionBox.style.left = selection.left+'px';
        selectionBox.style.top = selection.top+'px';

        selectionBox.style.width = selection.width+'px';
        selectionBox.style.height = selection.height+'px';
    }
    /**/
    
    
    /*等比例缩放*/
    function sameScale ( x1,y1,x2,y2,fixWidth,fixHeight) {
        fixWidth = fixWidth || 0;
        fixHeight = fixHeight ||0;

        if ( !/tm|rm|bm|lm/.test(this.className) ) { //不是中间的四个手柄 开始
            if (x1-x2>=0&&y1-y2<=0) {//从右上角网左下角拉，这个角度，我觉得y轴有可能相同，相同意味着，向左平行拉 1
                selection.left =x2;//mark
                selection.top = y1;
                if(Math.abs(y1-y2)*zzz>Math.abs(x1-x2)){//大于-45°
                    //selection.width = selection.height = Math.abs(y1-y2)+fixHeight;//传参
                    
                    //423,aspectRatio
                    selection.height = Math.abs(y1-y2)+fixHeight;
                    selection.width = selection.height*zzz;

                    /*if( selection.height < minSize ) {
                        selection.width = selection.height  = minSize;
                    }*/
                    
                    selection.left = x1-selection.width;//因为这个角度拖拽，x的坐标是越来越小的，所有x1肯定最大
                }
                
                else {
                    //selection.height = selection.width = Math.abs(x1-x2)+fixWidth;//这个固定值要传参
                    
                    
                    selection.width = Math.abs(x1-x2)+fixWidth;
                    selection.height =selection.width/zzz;
                    //                    if( selection.width<minSize ){
                    //                        selection.height = selection.width = minSize;
                    //                    }
                    selection.left = x1-selection.width;//(Math.abs(x1-x2)+fixWidth) 这个才是选区框的真实距离
                }
                
                if (selection.left<0){//如果两个角度的判断是一样的，那么就提取在两个角度的最下面
                    selection.left=0;
                    //selection.width = selection.height = x1;
                    
                    selection.width = x1;
                    selection.height = selection.width/zzz;
                //minWidth ? (selection.width = selection.height = minWidth) : 0;
                }
                
                if (selection.height>imgOfs.height-selection.top) {//下边界
                    selection.height=imgOfs.height-selection.top;//没有比例的时候
                    //selection.width = selection.height;
                    //selection.left = x1-selection.width;
                    
                    //423
                    selection.width = selection.height*zzz;
                    selection.left = x1-selection.width;
                    
                //minHeight ? (selection.width = selection.height = minHeight) : 0;
                }
            }
            else if (x1-x2<=0&&y1-y2<=0) {//从左上角网右下角拉，最方便的一个,因为这个角度的拖拽，不管是哪个角度，不是横轴大就是纵轴大，只要取他们的最大值就ok了，2个角度的坐标值是相同的，即坐标值不变
                //selection.width = selection.height = Math.max(Math.abs(x1-x2)+fixWidth,Math.abs(y1-y2)+fixHeight); 
                // selection.left = x1;
                //selection.top = y1;
                
                //423
                if( Math.abs(y1-y2)*zzz>Math.abs(x1-x2) ) {
                    selection.height = Math.abs(y1-y2)+fixHeight;
                    selection.width = selection.height*zzz;

                }
                else {
                    selection.width = Math.abs(x1-x2)+fixWidth;
                    selection.height = selection.width/zzz;
                }
                
                selection.left = x1;
                selection.top = y1;
                
                if (selection.width>imgOfs.width-selection.left) {//判断 左边界，当宽度超过左边界，让高度等于宽度
                    selection.width=imgOfs.width-selection.left;//没有比例的时候
                    selection.height = selection.width/zzz;           
                }
                if (selection.height>imgOfs.height-selection.top) {//下边界
                    selection.height=imgOfs.height-selection.top;//没有比例的时候
                    selection.width = selection.height*zzz;
                }
            } //从左上角网右下角拉 结束
            else if((x1-x2>=0&&y1-y2>=0) ){ //从右下角往左上角拉 1-1
                if( Math.abs(x1-x2)>Math.abs(y1-y2)*zzz ) {//如果角度大于135°，那么拖拽产生的横轴长度大于纵轴长度,top值和左下角往右上角的原理一样
                    selection.width = Math.abs(x1-x2)+fixWidth;//只有宽高才加固定值
                    selection.height = selection.width/zzz;
                    selection.top = y1-selection.height;
                    selection.left = x2-fixWidth;//x2,y2,就是结束的时候的坐标
                }
                else {//如果角度大于135°
                    selection.height = Math.abs(y1-y2)+fixHeight;
                    selection.width = selection.height * zzz;
                    selection.top = y2-fixHeight;
                    selection.left = x1-selection.width;
                }
                               
                if (selection.left<0) {
                    selection.left = 0;
                    selection.width = x1;
                    selection.height = selection.width/zzz;
                    selection.top = y1-selection.height;
                }
                if (selection.top<0){
                    selection.top = 0;
                    selection.height =y1; 
                    selection.width = selection.height*zzz;
                    selection.left = x1-selection.width;
                }
            } //从右下角往左上角拉 结束
            
            else if ((x1-x2<=0&&y1-y2>=0)) {//从左下角往右上角拉，宽高top在改变,对于left，按下的时候，默认已经是有的了,为了防止底部横轴相对于顶部移动，不能将宽给高，必须是高给宽     2-2   
                selection.left = x1;
                if(Math.abs(y1-y2)*zzz>Math.abs(x1-x2)){//大于45°,//如果值是x1，y1，那么就给我删除了，因为按下的时候就已经记录鸟
                    selection.top = y2-(fixHeight);  
                    selection.height = Math.abs(y2-y1)+(fixHeight);
                    selection.width= selection.height*zzz;
                           
                }
                else {//从左下角往右上角拖拽的时候，角度小于45°，那么横轴长度就会大于纵轴长度
                    
                    selection.width = Math.abs(x2-x1)+(fixWidth);
                    selection.height = selection.width/zzz;
                    selection.top = y1-selection.height;
                }
                
                if (selection.width>imgOfs.width-selection.left) {//判断 左边界，当宽度超过左边界，让高度等于宽度
                    selection.width=imgOfs.width-selection.left;//没有比例的时候
                    selection.height = selection.width/zzz;
                    selection.top = y1-selection.height;
                }
                if (selection.top<0) {//下边界
                    selection.top = 0;
                    selection.height = y1;
                    selection.width = selection.height*zzz;
                }
                
            } //从左下角往右上角拉 end
        }//不是中间的四个手柄 结束
        
        else { //tm 只有两个方向
            if( /tm/.test( this.className ) ) {
                if (x1-x2<=0&&y1-y2<=0) {//从左上角网右下角拉，最方便的一个,因为这个角度的拖拽，不管是哪个角度，不是横轴大就是纵轴大，只要取他们的最大值就ok了，2个角度的坐标值是相同的，即坐标值不变
                    //selection.width = selection.height = Math.abs(y1-y2)+fixHeight; 
                    selection.height = Math.abs(y1-y2)+fixHeight;
                    selection.width = selection.height*zzz;
                        
                    selection.left = x1;
                    selection.top = y1;
                
                    if (selection.width>imgOfs.width-selection.left) {//判断 左边界，当宽度超过左边界，让高度等于宽度
                        selection.width=imgOfs.width-selection.left;//没有比例的时候
                        selection.height = selection.width/zzz;           
                    }
                    if (selection.height>imgOfs.height-selection.top) {//下边界
                        selection.height=imgOfs.height-selection.top;//没有比例的时候
                        selection.width = selection.height*zzz;
                    }
                } //从左上角网右下角拉 结束
            
                else if ((x1-x2<=0&&y1-y2>=0)) {//从左下角往右上角拉，宽高top在改变,对于left，按下的时候，默认已经是有的了,为了防止底部横轴相对于顶部移动，不能将宽给高，必须是高给宽       
                    selection.left = x1;
                    selection.top = (y2-(fixHeight));  
                    selection.height = Math.abs(y2-y1)+(fixHeight);//不用考虑x的情况
                    selection.width= selection.height*zzz;
                    
                    if (selection.width>imgOfs.width-selection.left) {//判断 左边界，当宽度超过左边界，让高度等于宽度
                        selection.width=imgOfs.width-selection.left;//没有比例的时候
                        selection.height = selection.width/zzz;
                        selection.top = y1-selection.height;
                    }
                    if (selection.top<0) {//下边界
                        selection.top = 0;
                        selection.height = y1;
                        selection.width = selection.height*zzz;
                    }
                
                } //从左下角往右上角拉 end
            } //tm end
            else if( /rm/.test( this.className ) ) { //两个方向，左上到右下，右上到左下
                if (x1-x2<=0&&y1-y2<=0) {//从左上角网右下角拉，最方便的一个,因为这个角度的拖拽，不管是哪个角度，不是横轴大就是纵轴大，只要取他们的最大值就ok了，2个角度的坐标值是相同的，即坐标值不变
                    selection.width = Math.abs(x1-x2)+fixWidth; 
                    selection.height =selection.width/zzz;
                    selection.left = x1;
                    selection.top = y1;
                
                    if (selection.width>imgOfs.width-selection.left) {//判断 左边界，当宽度超过左边界，让高度等于宽度
                        selection.width=imgOfs.width-selection.left;//没有比例的时候
                        selection.height =selection.width/zzz;     
                    }
                    if (selection.height>imgOfs.height-selection.top) {//下边界
                        selection.height=imgOfs.height-selection.top;//没有比例的时候
                        selection.width =selection.height*zzz;
                    }
                } //从左上角网右下角拉 结束
                if (x1-x2>=0&&y1-y2<=0) {//从右上角网左下角拉，这个角度，我觉得y轴有可能相同，相同意味着，向左平行拉
                    selection.left =x2;//mark
                    selection.top = y1;    
                    selection.width = Math.abs(x1-x2)+fixWidth;//这个固定值要传参
                    selection.height =selection.width/zzz;
                    selection.left = x1-selection.width;//(Math.abs(x1-x2)+fixWidth) 这个才是选区框的真实距离
                
                    if (selection.left<0){//如果两个角度的判断是一样的，那么就提取在两个角度的最下面
                        selection.left=0;
                        selection.width = x1;
                        selection.height =selection.width/zzz;
                    }
                
                    if (selection.height>imgOfs.height-selection.top) {//下边界
                        selection.height=imgOfs.height-selection.top;//没有比例的时候
                        selection.width = selection.height*zzz;
                        selection.left = x1-selection.width;
                    }
                }
            } // rm end
            
            else if( /bm/.test( this.className ) ) { //左下到右上、左上到右下 ，变的仅是高
                if (x1-x2<=0&&y1-y2<=0) {//从左上角网右下角拉，最方便的一个,因为这个角度的拖拽，不管是哪个角度，不是横轴大就是纵轴大，只要取他们的最大值就ok了，2个角度的坐标值是相同的，即坐标值不变
                    selection.height = Math.abs(y1-y2)+fixHeight; 
                    selection.width = selection.height*zzz;
                    selection.left = x1;
                    selection.top = y1;
                
                    if (selection.width>imgOfs.width-selection.left) {//判断 左边界，当宽度超过左边界，让高度等于宽度
                        selection.width=imgOfs.width-selection.left;//没有比例的时候
                        selection.height = selection.width/zzz;           
                    }
                    if (selection.height>imgOfs.height-selection.top) {//下边界
                        selection.height=imgOfs.height-selection.top;//没有比例的时候
                        selection.width = selection.height*zzz;
                    }
                } //从左上角网右下角拉 结束
                
                else if ((x1-x2<=0&&y1-y2>=0)) {//从左下角往右上角拉，宽高top在改变,对于left，按下的时候，默认已经是有的了,为了防止底部横轴相对于顶部移动，不能将宽给高，必须是高给宽       
                    selection.left = x1;
                    selection.top = y2-(fixHeight);  
                    selection.height = Math.abs(y2-y1)+fixHeight;
                    selection.width= selection.height*zzz;
                    
                    if (selection.width>imgOfs.width-selection.left) {//判断 左边界，当宽度超过左边界，让高度等于宽度
                        selection.width=imgOfs.width-selection.left;//没有比例的时候
                        selection.height = selection.width/zzz;
                        selection.top = y1-selection.height;
                    }
                    if (selection.top<0) {//下边界
                        selection.top = 0;
                        selection.height = y1;
                        selection.width = selection.height*zzz;
                    }
                
                } //从左下角往右上角拉 end
            } //bm end
            
            else if( /lm/.test( this.className ) ) { //右上到左下，左上到右下　，变的仅是宽，删除高就ok
                if (x1-x2>=0&&y1-y2<=0) {//从右上角网左下角拉，这个角度，我觉得y轴有可能相同，相同意味着，向左平行拉
                    selection.left =x2;//mark
                    selection.top = y1;
                    selection.width = Math.abs(x1-x2)+fixWidth;//这个固定值要传参
                    selection.height = selection.width/zzz;
                    selection.left = x1-selection.width;//(Math.abs(x1-x2)+fixWidth) 这个才是选区框的真实距离
                
                    if (selection.left<0){//如果两个角度的判断是一样的，那么就提取在两个角度的最下面
                        selection.left=0;
                        selection.width = x1;
                        selection.height =selection.width/zzz;
                    }
                
                    if (selection.height>imgOfs.height-selection.top) {//下边界
                        selection.height=imgOfs.height-selection.top;//没有比例的时候
                        selection.width = selection.height*zzz;
                        selection.left = x1-selection.width;
                    }
                } //右上到左下 end
                
                else if (x1-x2<=0&&y1-y2<=0) {//从左上角网右下角拉，最方便的一个,因为这个角度的拖拽，不管是哪个角度，不是横轴大就是纵轴大，只要取他们的最大值就ok了，2个角度的坐标值是相同的，即坐标值不变
                    selection.width = Math.abs(x1-x2)+fixWidth; 
                    selection.height = selection.width/zzz;
                    selection.left = x1;
                    selection.top = y1;
                
                    if (selection.width>imgOfs.width-selection.left) {//判断 左边界，当宽度超过左边界，让高度等于宽度
                        selection.width=imgOfs.width-selection.left;//没有比例的时候
                        selection.height = selection.width/zzz;           
                    }
                    if (selection.height>imgOfs.height-selection.top) {//下边界
                        selection.height=imgOfs.height-selection.top;//没有比例的时候
                        selection.width = selection.height*zzz;
                    }
                } //从左上角网右下角拉 结束
            } //lm end
        }
            
        //这里进行报错处理ie下：
        //        try {
        //            selectionBox.style.width = selection.width+'px'; //不管有没有比例，都是最后更新selectionBox的位置信息
        //            selectionBox.style.height = selection.height+'px';
        //        }
        //        catch (e) {
        //            selectionBox.style.width = 0; //不管有没有比例，都是最后更新selectionBox的位置信息
        //            selectionBox.style.height = 0; 
        //        }
            
        selectionBox.style.top = selection.top+'px';
        selectionBox.style.left = selection.left+'px';
            

            
        selectionBox.style.width = selection.width+'px'; //不管有没有比例，都是最后更新selectionBox的位置信息
        selectionBox.style.height = selection.height+'px';
    }
    /*等比例缩放*/
    /*****************************************************************************/
    
    var handle = getByClass(selectionBox,'hand');//这两行属于初始化内容,对四个方向的手柄进行拖拽、缩放
    
    for (var i=0,l=handle.length;i<l;i++) {
        handleDrag(handle[i]);//这两行属于初始化内容,对四个方向的手柄进行拖拽、缩放
    }
    
    function handleDrag(obj) { 
        bindEvent( obj, 'mousedown', handleDown );
        
        function handleDown (ev){
            var oEvent=ev||event,
            selectionX1,selectionX2,selectionY1,selectionY2,//代表刚按下手柄时，选区框四个顶点相对于图片的坐标           
            x1,y1,x2,y2,
         
            tempWidth,
            tempHeight,
            
            fixHeight,
            fixWidth;
            //fixHeight = fixWidth = 0;
            //console.info('oEvent.clientX : '+oEvent.clientY+' , imgOfs.top : '+imgOfs.top+' ,tempHeight :  '+tempHeight+' ,selection.height :  '+selection.height+' , fixHeight : '+fixHeight);
            selectionX2 = selection.left+selection.width;//按下时，选区框的最右边的x坐标
            selectionY2 = selection.top+selection.height;//按下时，选区框的最下面距离顶部的y坐标
            
            selectionX1 = selection.left;//右下角是X1，Y2
            selectionY1 = selection.top;
            
            
            imgAreaClip.style.cursor = getStyle( obj, 'cursor' );
            selectionBox.className = '';
            
            if(obj.className.indexOf('l')!=-1) {
                var downClientX=oEvent.clientX;
                var downWidth=selection.width;
                var downLeft=selection.left;
            }
            if(obj.className.indexOf('r')!=-1){
                var disX=oEvent.clientX-obj.offsetLeft;
            }
            if(obj.className.indexOf('t')!=-1){
                var downClientY=oEvent.clientY;
                var downHeight=selection.height;
                var downTop=selection.top;
            }
            if(obj.className.indexOf('b')!=-1){
                var disY=oEvent.clientY-obj.offsetTop;
            }
            //等比例开始
            if(obj.className.indexOf('rb')!=-1){//右下角：获取参考点x1,y1，参考点是选区框的左上角坐标
                x1 = selection.left;
                y1 = selection.top;
                
                tempWidth = oEvent.clientX-imgOfs.left-selection.left+scrollLeft();
                tempHeight = oEvent.clientY-imgOfs.top-selection.top+scrollTop();
            
                fixHeight = selection.height-tempHeight;
                fixWidth = selection.width - tempWidth;
            }
            else if (obj.className.indexOf('lt')!=-1) {//左上角，参考点是选区框右下角的坐标
                x1 = selection.left + selection.width;
                y1 = selection.top +selection.height;
                
                fixHeight =  oEvent.clientY-imgOfs.top-selection.top+scrollTop();
                fixWidth =  (oEvent.clientX-imgOfs.left-selection.left)+scrollLeft();
            }
            else if (obj.className.indexOf('lb')!=-1) {//左下角：参考点是右上角的坐标
                x1 = selection.left + selection.width;
                y1 = selection.top;
                
                fixHeight = selection.height - (oEvent.clientY+scrollTop()-imgOfs.top-selection.top);
                fixWidth = (oEvent.clientX+scrollLeft()-imgOfs.left-selection.left);
            }
            else if (obj.className.indexOf('rt')!=-1) {//右上角：参考点是左下角的坐标
                x1 = selection.left;
                y1 = selection.top + selection.height;

                fixHeight =  oEvent.clientY+scrollTop()-imgOfs.top-selection.top;//clientY应该总是加上scrollTop，不能直接在后面加的，因为有减法计算，弄的我，查找了好长时间
                fixWidth = selection.width - (oEvent.clientX+scrollLeft()-imgOfs.left-selection.left);
                
            } //中间点 开始 update 0416
            
            else if (obj.className.indexOf('tm')!=-1) { //左下角为参考点
                x1 = selection.left;
                y1 = selection.top + selection.height;
                
                fixWidth = selection.width - (oEvent.clientX+scrollLeft()-imgOfs.left-selection.left);
                fixHeight = oEvent.clientY+scrollTop() - imgOfs.top-selection.top;
            }
            
            else if (obj.className.indexOf('rm')!=-1 || obj.className.indexOf('bm')!=-1) { // 左上角为参考点，一直都是 ，那么x2，y2的坐标就是选区右下角坐标
                //先写参考点坐标 : 
                x1 = selection.left;
                y1 = selection.top;
                
                fixWidth = selection.width - (oEvent.clientX+scrollLeft()-imgOfs.left-selection.left);
                fixHeight = selection.height - (oEvent.clientY+scrollTop() - imgOfs.top - selection.top);//clientY应该总是加上scrollTop，不能直接在后面加的，因为有减法计算，弄的我，查找了好长时间
            }
            
            else if (obj.className.indexOf('lm')!=-1) { //右上角为参考点，一直都是 ，那么x2，y2的坐标就是选区左下角坐标
                //先写参考点坐标 : 
                x1 = selection.left + selection.width;
                y1 = selection.top;
                
                fixWidth = oEvent.clientX-imgOfs.left-selection.left+scrollLeft();
                fixHeight = selection.height - (oEvent.clientY+scrollTop() - imgOfs.top - selection.top);
                
            }
            
            
            //等比例结束

            if(obj.setCapture){         
                obj.setCapture();       
                bindEvent( obj,'mousemove', fnHandleMove );
                bindEvent( obj,'mouseup', fnHandleUp );
            }
            else {
                bindEvent( document,'mousemove', fnHandleMove );
                bindEvent( document,'mouseup', fnHandleUp );
            }
            
            function fnHandleMove (ev){
                
                var oEvent=ev||event;
                
                x2 = oEvent.clientX-imgOfs.left+scrollLeft();
                y2 = oEvent.clientY-imgOfs.top+scrollTop();
                //options.toScale
                
                function noScaleHandle ( nClientX, nClientY, handleX1, selectionY1, selectionX2, selectionY2 ) {
                    //update 412 e
                    if(obj.className.indexOf('l')!=-1){//垂直往左拉，没有比例的时候，变动的 仅是宽、left，有比例的情况下，宽变动的时候，高也要跟着变动，还要解决宽高为负数的情况
                        var _disX=nClientX-downClientX;
                    
                        //在按住左下角 垂直向左、向右的时候，clientX是一直变化的，
                        //推出selection.left也是动态变化的，
                        //经过观察，只有selection.left小于等于0 的时候才selection.left=0;如果将下面①和② 写成else，③是if，那么 就出问题了，
                        //因为selection.left==0的时候，会让selection.left一直为0，所以①和②不能写成else，带来的思考，有的语句 不是随便能写成if、else的
                        selection.left = downLeft+_disX;//①
                        selection.width = downWidth-_disX;//②
                    
                        if(selection.left<=0) {//③
                            selection.left=0;
                            selection.width = selectionX2;
                        }

                        if(selection.width<=0){
                            selection.width = Math.abs(selection.width);
                            selection.left = selectionX2;
                        }
                    
                        if ( selection.width>imgOfs.width-selection.left) {
                            selection.width =imgOfs.width-selection.left;
                        }
                    
                        selectionBox.style.width= selection.width+'px';//将所有操作都集中在selection对象上，最后更新selectionBox.style
                        selectionBox.style.left=selection.left+'px';

                    }
                    if(obj.className.indexOf('r')!=-1){//右方向，变化的仅是宽，其他不变
                    
                        selection.width  = nClientX-disX+obj.offsetWidth;
                        selection.left = selectionX1;
                    
                        if (selection.width>imgOfs.width-selection.left) {
                            selection.width=imgOfs.width-selection.left;
                        }
 
                        if(selection.width<=0){
                            selection.width = Math.abs(selection.width);
                            selection.left = selectionX1-selection.width;            
                        }
                    
                        if(selection.left<=0) {
                            selection.left=0;
                            selection.width = selectionX1;
                        }
                    
                        selectionBox.style.width=selection.width+'px';
                        selectionBox.style.left = selection.left+'px';         
                    }
                    if(obj.className.indexOf('t')!=-1){//t,,即top，顶部的意思，变化的是高、top
                        var _disY=nClientY-downClientY;
                        selection.height = downHeight-_disY;
                        selection.top = downTop+_disY;

                        if (selection.top<=0) {
                            selection.top=0;
                            selection.height = selectionY2;
                        }
                    
                        if(selection.height<=0){
                            selection.height = Math.abs(selection.height);
                            selection.top = selectionY2;
                        }
                    
                        if(selection.height>imgOfs.height-selection.top){
                            selection.height=imgOfs.height-selection.top;
                        }
                        selectionBox.style.top=selection.top+'px';
                        selectionBox.style.height = selection.height+'px';
                    }
                
                    if(obj.className.indexOf('b')!=-1){//b,即bottom，即底部，变化的仅是top值和高度，其他不变
                        selection.height = nClientY-disY+obj.offsetHeight;
                        selection.top = selectionY1;//①①,垂直往下的时候，top值是不变的
                    
                        if(selection.height>imgOfs.height-selection.top){
                            selection.height=imgOfs.height-selection.top;
                        }
                    
                        if(selection.height<=0){
                            selection.height = Math.abs(selection.height);
                            selection.top = selectionY1-selection.height;                 
                        }
                    
                        if(selection.top<=0){//②② 注意 这里和①①的顺序 要注意的
                            selection.top = 0;
                            selection.height = selectionY1;
                        }
                    
                        selectionBox.style.height=selection.height+'px';
                        selectionBox.style.top = selection.top+'px';
                    }  // 不是等比例的结束
                } //替换jies
       
                //等比例开始
                //sameScale(x1,y1,x2,y2,fixWidth,fixHeight);
                
                //等比例结束
                toScale ? sameScale.call(obj,x1,y1,x2,y2,fixWidth,fixHeight) : noScaleHandle ( oEvent.clientX, oEvent.clientY, selectionX1, selectionY1, selectionX2, selectionY2 );
                
                oTopMiddleHandle.style.left = oBottomMiddleHandle.style.left =((selection.width-handleSize)>>1)+'px';
                oRightMiddleHandle.style.top = oLeftMiddleHandle.style.top = ((selection.height-handleSize)>>1)+'px';
       
                var oCustomBorder = getByClass(selectionBox,'custom-border');
                
                for (var i =0,l = oCustomBorder.length;i<l;i++) {
                    oCustomBorder[i].style.width = selection.width+'px';
                    oCustomBorder[i].style.height = selection.height+'px';
                }
                //对选区的大小进行限制
                
                imgClip.style.clip = 'rect( '+selection.top+'px'+' '+(selection.left+selection.width)+'px'+' '+(selection.top+selection.height)+'px'+' '+selection.left+'px'+' )';//这个要放在函数内部
                onChange( selection );

                oEvent.cancelBubble = true;
            }
            
            function fnHandleUp() {
                
                selectionBox.className = 'add-cursor';
                imgAreaClip.style.cursor = 'crosshair';
                
                if(obj.releaseCapture) {
                    obj.releaseCapture();
                }
                
                unbindEvent( this,'mousemove', fnHandleMove );
                unbindEvent( this,'mouseup', fnHandleUp );
            } //fnHandleUp end
            
            oEvent.cancelBubble = true;
            !!oEvent.preventDefault && oEvent.preventDefault();//return false;
        } //handleDown end 
    }
/*****************************************************************************/
}; //ImgClip end

(function(){
    var added = false,
    oL,
    oHead;

    if(added==true) {
        return;
    }
    added =true;

    oL = document.createElement('link');
    oL.rel = 'stylesheet';
    oL.type = 'text/css';
    oL.href = 'custom_clip.css';
    oHead = document.getElementsByTagName('head')[0];
    oHead.appendChild(oL);
})();



