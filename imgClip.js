/**
 *@function 
 *@description 图片裁剪 
 *@author Sunrise
 *@param { object HTMLImageElement } target , 图片对象引用，必选，亲，没有会报错的，下面的参数都是可选
 *@param { boolean } toScale ,是否使用比例，默认false
 *@param { boolean } fade , 是否开启动画 ,默认true
 *@param { string } msg,自定义报错的具体内容，默认 空
 *@param { object } width:指定最小宽度、height：指定最小高度，在有比例的情况下：如果宽和高 都有，那么舍弃高度，仅根据宽算出高，如果仅设置了其中一个，那么就根据设置的那个值，算出另一个值，默认为0
 *@param { object } maxSize ，指定最大宽高度，原理同上，默认为0
 *@param { number } aspectRatio ， 缩放比例，即宽高比 ，一个数字，最好这样 写：16/9  ，默认为1
 *@param { boolean } noAnewSelect ，鼠标松开的时候，是否重新计算裁剪框位置 ，默认false
 *@param { object json } initSize ，json格式，初始化裁剪框位置，属性分别是 width、height、left、top，默认false
 *@param {  object HTMLTagElement  } parent ,节点引用，指定父节点，即，将插件生成的代码 插入到指定的节点，默认是body
 *@param { function } onChange ,裁剪框位置改变后，触发的回调函数，接受一个参数，这个参数带回裁剪框的位置信息，参数类型是json格式，属性分别是：width、height、left、top
 *@return { function } imgClip,图片裁剪函数的api接口
 */
imgclip = (function () {
    var order = 0,
        aFuncTag = [],
        $ = function (id) {
            return document.getElementById(id);
        },
        bindEvent = function (obj, sEv, fn) {
            (obj.addEventListener) ? obj.addEventListener(sEv, fn, false) : obj.attachEvent('on' + sEv, fn);
            aFuncTag[order] = fn;
            return (order++);
        },
        unbindEvent = function (obj, sEv, fn) {
            (obj.removeEventListener ) ? obj.removeEventListener(sEv, fn, false) : obj.detachEvent('on' + sEv, fn);
        },
        createEle = function (tag) {
            return document.createElement(tag);
        },
        getStyle = function (obj, name) {
            if (obj.currentStyle) {
                return obj.currentStyle[name];
            } else {
                return getComputedStyle(obj, false)[name];
            }
        },
        scrollTop = function () {
            return document.body.scrollTop || document.documentElement.scrollTop;
        },
        scrollLeft = function () {
            return document.body.scrollLeft || document.documentElement.scrollLeft;
        },
        getPos = function (obj) {
            var cumulativeOffset = obj.getBoundingClientRect(), l = 0, t = 0;
            if (cumulativeOffset) {
                return {
                    left:cumulativeOffset.left + scrollLeft(),
                    top:cumulativeOffset.top + scrollTop()
                }
            } else {
                while (obj) {
                    l += obj.offsetLeft;
                    t += obj.offsetTop;
                    obj = obj.offsetParent;
                }
                return {
                    left:l,
                    top:t
                }
            }
        },
        getByClass = function (oParent, sClass) {
            if (document.getElementsByClassName) {
                return oParent.getElementsByClassName(sClass);
            } else {
                var aEle = oParent.getElementsByTagName('*'),
                    aResult = [],
                    i = 0;
                re = new RegExp('\\b' + sClass + '\\b');
                for (i = 0; i < aEle.length; i++) {
                    if (re.test(aEle[i].className)) {
                        aResult.push(aEle[i]);
                    }
                }
                return aResult;
            }
        },
        animate = function (obj, json, fn) {
            clearInterval(obj.timer);
            obj.timer = setInterval(function () {
                    var bStop = true;
                    for (var attr in json) {
                        var iCur = 0;
                        if (attr == 'opacity') iCur = Math.round(parseFloat(getStyle(obj, attr)) * 100);
                        else iCur = parseInt(getStyle(obj, attr));
                        var iSpeed = (json[attr] - iCur) / 8;
                        iSpeed = iSpeed > 0 ? Math.ceil(iSpeed) : Math.floor(iSpeed);
                        if (attr == 'opacity') {
                            obj.style.filter = 'alpha(opacity:' + Math.round(iCur + iSpeed) + ')';
                            obj.style.opacity = Math.round(iCur + iSpeed) / 100;
                        } else {
                            obj.style[attr] = iCur + iSpeed + 'px';
                        }
                        if (iCur != json[attr]) bStop = false;
                    }
                    if (bStop) {
                        clearInterval(obj.timer);
                        if (fn) fn();
                    }
                },
                30);
        },
        setStyle = function (obj, options) {
            for (var i in options) {
                obj.style[i] = options[i];
            }
        },
        showOrHideHandle = function (obj, name) {
            var i, l;
            for (i = 0, l = obj.length; i < l; i += 1) {
                setStyle(obj[i], name);
            }
        },
        error = function (msg) {
            if (typeof(options.onError) === 'function') {
                options.onError.apply(this, [msg]);
            }
        },
        imgSelectionClip = function (options) {
            options = options || {};
            if (!options.target) {
                error('Qin,You need to be introduced into an image object reference!')
                return;
            }
            if (options.target.tagName.toLowerCase() !== 'img') {
                error('Qin,Target element must be a image reference!')
                return;
            }
            var oTarget = options.target,
                toScale = options.toScale || 0,
                oParent = options.parent || document.body,
                onChange = options.onChange || function () {
                },
                bFade = options.fade || 0,
                zzz = (options.aspectRatio > 0 ? options.aspectRatio : 1),
                minSize = options.minSize || 0,
                maxSize = options.maxSize || 0,
                minWidth = 0,
                minHeight = 0,
                maxWidth = 0,
                maxHeight = 0,
                noAnewSelect = options.noAnewSelect || false,
                initSize = options.initSize || 0,
                bRightWidth = false,
                bBottomHeight = false,
                bTopHeight = false,
                bLeftWidth = false,
                bDownOne = false,
                bInit = true,
                bLeftRightSwitch = false,
                bTopBottomSwitch = false,
                oParentPos = null,
                oTopParent = null,
                oHandle = null,
                imgAreaClip = createEle('div'),
                targetPos = getPos(oTarget),
                alphaImg = oTarget.cloneNode(),
                clipImg = oTarget.cloneNode(),
                selectionBox = createEle('div'),
                handleSize = null,
                aI = [],
                oTopMiddleHandle,
                oRightMiddleHandle,
                oBottomMiddleHandle,
                oLeftMiddleHandle,
                oCustomBorder,
                selection = {
                    left:0,
                    top:0,
                    width:0,
                    height:0
                },
                imgOfs = {
                    left:0,
                    top:0,
                    width:0,
                    height:0
                },
                parOfs = {
                    left:0,
                    top:0
                },
                getTopParent = function (oP) {
                    while (oP) {
                        if (oP.parentNode == document.body) return oP;
                        oP = oP.parentNode;
                    }
                    return false;
                };
            !toScale && (zzz = 1);
            if (!toScale) {
                minWidth = minSize.width || 0;
                minHeight = minSize.height || 0;
                maxWidth = maxSize.width || 0;
                maxHeight = maxSize.height || 0;
            } else {
                if (minSize.width || minSize.height) {
                    if (minSize.width) {
                        minWidth = minSize.width;
                        minHeight = minWidth / zzz;
                    } else {
                        minHeight = minSize.height;
                        minWidth = minHeight * zzz;
                    }
                }
                if (maxSize.width || maxSize.height) {
                    if (maxSize.width) {
                        maxWidth = maxSize.width;
                        maxHeight = maxWidth / zzz;
                    } else {
                        maxHeight = maxSize.height;
                        maxWidth = maxHeight * zzz;
                    }
                }
            }
            imgAreaClip.id = 'imgAreaClip';
            imgAreaClip.className = 'imgClip';
            imgAreaClip.style.left = targetPos.left + 'px';
            imgAreaClip.style.top = targetPos.top + 'px';
            selectionBox.id = 'selectionBox';
            selectionBox.className = 'add-cursor';
            alphaImg.id = 'alphaImg';
            clipImg.id = 'imgClip';
            for (var i = 0; i < 12; i++) {
                aI[i] = createEle('i');
                if (i < 4) {
                    aI[i].className = 'custom-border';
                } else {
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
            oTopMiddleHandle = getByClass(selectionBox, 'tm')[0];
            oRightMiddleHandle = getByClass(selectionBox, 'rm')[0];
            oBottomMiddleHandle = getByClass(selectionBox, 'bm')[0];
            oLeftMiddleHandle = getByClass(selectionBox, 'lm')[0];
            imgAreaClip.appendChild(alphaImg);
            imgAreaClip.appendChild(clipImg);
            imgAreaClip.appendChild(selectionBox);
            oParent.appendChild(imgAreaClip);
            oHandle = getByClass(selectionBox, 'hand');
            oCustomBorder = getByClass(selectionBox, 'custom-border');
            if (oParent !== document.body) {
                oTopParent = getTopParent(oParent);
                if (getStyle(oTopParent, 'position') === 'static') oTopParent.style.position = 'relative';
                oTopParent.style.zIndex = 99999;
            }
            oParentPos = getPos(oParent);
            parOfs.left = oParentPos.left;
            parOfs.top = oParentPos.top;
            imgOfs.left = targetPos.left;
            imgOfs.top = targetPos.top;
            imgOfs.width = oTarget.offsetWidth;
            imgOfs.height = oTarget.offsetHeight;
            handleSize = aI[7].offsetHeight;
            imgAreaClip.style.height = imgOfs.height + 'px';
            imgAreaClip.style.width = imgOfs.width + 'px';
            imgAreaClip.style.left = imgOfs.left - parOfs.left + 'px';
            imgAreaClip.style.top = imgOfs.top - parOfs.top + 'px';
            alphaImg.style.height = clipImg.style.height = imgOfs.height + 'px';
            alphaImg.style.width = clipImg.style.width = imgOfs.width + 'px';
            alphaImg.style.left = clipImg.style.left = alphaImg.style.top = clipImg.style.top = 0;
            function updateSelect(select) {
                for (var i = 0, l = oCustomBorder.length; i < l; i++) {
                    oCustomBorder[i].style.width = select.width + 'px';
                    oCustomBorder[i].style.height = select.height + 'px';
                }
                oTopMiddleHandle.style.left = oBottomMiddleHandle.style.left = ((select.width - handleSize) >> 1) + 'px';
                oRightMiddleHandle.style.top = oLeftMiddleHandle.style.top = ((select.height - handleSize) >> 1) + 'px';
                clipImg.style.clip = 'rect( ' + select.top + 'px' + ' ' + (select.left + select.width) + 'px' + ' ' + (select.top + select.height) + 'px' + ' ' + select.left + 'px' + ' )';
            }

            if (!!initSize && bInit) {
                selection = initSize;
                if (toScale) {
                    if (selection.left < 0) selection.left = 0;
                    if (selection.left > imgOfs.width) selection.left = imgOfs.width - selection.width;
                    if (selection.top < 0)  selection.top = 0;
                    if (selection.top > imgOfs.height) selection.top = imgOfs.height - selection.height;
                    if (selection.left + selection.width > imgOfs.width) {
                        selection.width = imgOfs.width - selection.left;
                        selection.height = selection.width / zzz;
                    }
                    if (selection.top + selection.height > imgOfs.height) {
                        selection.height = imgOfs.height - selection.top;
                        selection.width = selection.height * zzz;
                    }
                    if (minWidth && selection.width < minWidth) selection.width = minWidth;
                    if (maxWidth && selection.width > maxWidth)  selection.width = maxWidth;
                    selection.height = selection.width / zzz;

                    if ((selection.left + selection.width > imgOfs.width) || selection.left < 0) {
                        selection.left = 0;
                        selection.width = imgOfs.width;
                    }
                    if ((selection.top + selection.height > imgOfs.height) || selection.top < 0) {
                        selection.top = 0;
                        selection.height = imgOfs.height;
                    }
                }
                bInit = false;
                selectionBox.style.left = selection.left + 'px';
                selectionBox.style.top = selection.top + 'px';
                selectionBox.style.width = selection.width + 'px';
                selectionBox.style.height = selection.height + 'px';
                updateSelect(selection);
                onChange(selection);
            }
            function fnWrapDown(ev) {
                var oEvent = ev || event,
                    nImgMoveTag = 0,
                    nImgUpTag = 0,
                    nDocMoveTag = 0,
                    nDocUpTag = 0,
                    x1, x2, y1, y2;
                if (!bInit || noAnewSelect && bDownOne) {
                    if (!bInit && !noAnewSelect)  selectionBox.style.width = selectionBox.style.height = 0;
                    else return;
                }
                bDownOne = true;
                x1 = oEvent.clientX - imgOfs.left + scrollLeft();
                y1 = oEvent.clientY - imgOfs.top + scrollTop();
                selection.left = x1;
                selection.top = y1;
                selectionBox.style.left = selection.left + 'px';
                selectionBox.style.top = selection.top + 'px';
                if (bFade) {
                    if (!selection.width) {
                        alphaImg.style.opacity = '1';
                        alphaImg.style.filter = 'alpha(opacity=100)';
                        animate(alphaImg, {opacity:50 });
                    } else {
                        alphaImg.style.opacity = '0.5';
                        alphaImg.style.filter = 'alpha(opacity=50)';
                    }
                }
                clipImg.style.clip = 'rect(0px 0px 0px 0px)';
                if (!noAnewSelect) {
                    selection.width = selectionBox.style.width = 0;
                    selection.height = selectionBox.style.height = 0;
                }
                showOrHideHandle(oHandle, {'display':'none'});
                if (imgAreaClip.setCapture) {
                    nImgMoveTag = bindEvent(imgAreaClip, 'mousemove', function (e) {
                        fnWrapMove.call(imgAreaClip, e);
                    });
                    nImgUpTag = bindEvent(imgAreaClip, 'mouseup', function () {
                        fnWrapUp.call(imgAreaClip);
                    });
                    imgAreaClip.setCapture();
                } else {
                    nDocMoveTag = bindEvent(document, 'mousemove', function (e) {
                        fnWrapMove.call(document, e);
                    });
                    nDocUpTag = bindEvent(document, 'mouseup', function () {
                        fnWrapUp.call(document);
                    });
                }
                function fnWrapMove(ev) {
                    var oEvent = ev || event;
                    x2 = oEvent.clientX + scrollLeft() - imgOfs.left;
                    y2 = oEvent.clientY + scrollTop() - imgOfs.top;
                    sameScale.call(imgAreaClip, x1, y1, x2, y2);
                    selectionBox.className = '';
                    updateSelect(selection);
                    onChange(selection);
                }

                function fnWrapUp() {
                    selectionBox.className = 'add-cursor';
                    showOrHideHandle(oHandle, { 'display':'block'});
                    if (this.releaseCapture) {
                        this.releaseCapture();
                        unbindEvent(this, 'mousemove', aFuncTag[nImgMoveTag]);
                        unbindEvent(this, 'mouseup', aFuncTag[nImgUpTag]);
                    } else {
                        unbindEvent(this, 'mousemove', aFuncTag[nDocMoveTag]);
                        unbindEvent(this, 'mouseup', aFuncTag[nDocUpTag]);
                    }
                    if (!selection.width && !selection.height) {
                        if (bFade) {
                            animate(alphaImg, {opacity:100});
                        } else {
                            clipImg.style.clip = 'rect(auto auto auto auto)';
                        }
                    }
                    bRightWidth = false;
                    bBottomHeight = false;
                    bTopHeight = false;
                    bLeftWidth = false;
                }
                !!oEvent.preventDefault && oEvent.preventDefault();
            }
            bindEvent(imgAreaClip, 'mousedown', fnWrapDown);
            function selectionDrag(obj) {
                bindEvent(obj, 'mousedown', selectionDown);
                function selectionDown(ev) {
                    var oEvent = ev || event;
                    var disX = oEvent.clientX - obj.offsetLeft;
                    var disY = oEvent.clientY - obj.offsetTop;
                    var iMoveSelTag, iUpSelTag;
                    if (obj.setCapture) {
                        iMoveSelTag = bindEvent(obj, 'mousemove', function (e) {
                            selectionMove.call(obj, e);
                        });
                        iUpSelTag = bindEvent(obj, 'mouseup', function () {
                            selectionUp.call(obj);
                        });
                        obj.setCapture();
                    } else {
                        iMoveSelTag = bindEvent(document, 'mousemove', function (e) {
                            selectionMove.call(document, e);
                        });
                        iUpSelTag = bindEvent(document, 'mouseup', function () {
                            selectionUp.call(document);
                        });
                    }
                    function selectionMove(ev) {
                        var oEvent = ev || event;
                        selection.left = oEvent.clientX - disX;
                        selection.top = oEvent.clientY - disY;
                        if (selection.left < 0)  selection.left = 0;
                        if (selection.left > imgOfs.width - selection.width)  selection.left = imgOfs.width - selection.width;
                        if (selection.top < 0) selection.top = 0;
                        if (selection.top > imgOfs.height - selection.height) selection.top = imgOfs.height - selection.height;
                        obj.style.left = selection.left + 'px';
                        obj.style.top = selection.top + 'px';
                        clipImg.style.clip = 'rect( ' + selection.top + 'px' + ' ' + (selection.left + selection.width) + 'px' + ' ' + (selection.top + selection.height) + 'px' + ' ' + selection.left + 'px' + ' )';
                        onChange(selection);
                    }

                    function selectionUp() {
                        if (this.releaseCapture) this.releaseCapture();
                        unbindEvent(this, 'mousemove', aFuncTag[iMoveSelTag]);
                        unbindEvent(this, 'mouseup', aFuncTag[iUpSelTag]);
                    }

                    oEvent.cancelBubble = true;
                    !!oEvent.preventDefault && oEvent.preventDefault();
                }
            }
            selectionDrag(selectionBox);
            function sameScale(x1, y1, x2, y2, fixWidth, fixHeight) {
                fixWidth = fixWidth || 0;
                fixHeight = fixHeight || 0;
                bRightWidth && (x1 = imgOfs.width - minWidth);
                bBottomHeight && (y1 = imgOfs.height - minHeight);
                bTopHeight && (y1 = minHeight);
                bLeftWidth && (x1 = minWidth);
                if (/tm/.test(this.className) || /bm/.test(this.className)) {
                    x2 = x1;
                    bLeftRightSwitch = true;
                }
                if (/rm/.test(this.className) || /lm/.test(this.className)) {
                    y2 = y1;
                    bTopBottomSwitch = true;
                }
                if (y1 <= y2) {
                    minHeight && ( y1 >= (imgOfs.height - minHeight) ) && (bBottomHeight = true);
                    if (x1 <= x2 && ( minWidth && ( x1 >= (imgOfs.width - minWidth) ) )) bRightWidth = true;
                    bBottomHeight && ( y1 = imgOfs.height - minHeight);
                    if (x1 - x2 > 0) {
                        minWidth && ( x1 <= minWidth ) && ( bLeftWidth = true );
                        bLeftWidth && ( x1 = minWidth );
                        selection.left = x2;
                        selection.top = y1;
                    }
                    if (toScale) {
                        if (Math.abs(y1 - y2) * zzz > Math.abs(x1 - x2)) {
                            selection.height = Math.abs(y1 - y2) + fixHeight;
                            ( minHeight && ( selection.height < minHeight ) ) && ( selection.height = minHeight);
                            ( maxHeight && ( selection.height > maxHeight ) ) && ( selection.height = maxHeight);
                            selection.width = selection.height * zzz;
                        }
                        else {
                            selection.width = Math.abs(x1 - x2) + fixWidth;
                            ( minWidth && ( selection.width < minWidth ) ) && ( selection.width = minWidth);
                            ( maxWidth && ( selection.width > maxWidth ) ) && ( selection.width = maxWidth);
                            selection.height = selection.width / zzz;
                        }
                    }
                    else {
                        ( x1 - x2 > 0 ) && (selection.width = Math.abs(x1 - x2) + fixWidth); // x1-x2 > 0 其实写成if else也是很好的
                        ( x1 - x2 <= 0 ) && ( !bLeftRightSwitch && (selection.width = Math.abs(x1 - x2) + fixWidth ));  // x1-x2<=0
                        !bTopBottomSwitch && (selection.height = Math.abs(y1 - y2) + fixHeight);
                        ( minHeight && ( selection.height < minHeight ) ) && ( selection.height = minHeight);
                        ( maxHeight && ( selection.height > maxHeight ) ) && ( selection.height = maxHeight);
                        ( minWidth && ( selection.width < minWidth ) ) && ( selection.width = minWidth);
                        ( maxWidth && ( selection.width > maxWidth ) ) && ( selection.width = maxWidth);
                    }
                    if (x1 > x2) {
                        selection.left = x1 - selection.width;
                        if (selection.left < 0) {
                            selection.left = 0;
                            selection.width = x1;
                            ( minWidth && ( selection.width < minWidth ) ) && ( selection.width = minWidth);
                            ( maxWidth && ( selection.width > maxWidth ) ) && ( selection.width = maxWidth);
                            toScale && (  selection.height = selection.width / zzz );
                        }
                    }
                    else {
                        bRightWidth && ( x1 = imgOfs.width - minWidth);
                        selection.left = x1;
                        selection.top = y1;
                        if (selection.width > imgOfs.width - selection.left) {
                            selection.width = imgOfs.width - selection.left;
                            ( minWidth && ( selection.width < minWidth ) ) && ( selection.width = minWidth);
                            ( maxWidth && ( selection.width > maxWidth ) ) && ( selection.width = maxWidth);
                            toScale && (selection.height = selection.width / zzz);
                            if (minWidth && ( selection.left > (imgOfs.width - minWidth) )) {
                                selection.left = imgOfs.width - minWidth;
                            }
                        }
                    }
                    if (selection.height > imgOfs.height - selection.top) {
                        selection.height = imgOfs.height - selection.top;
                        ( minHeight && ( selection.height < minHeight ) ) && ( selection.height = minHeight);
                        ( maxHeight && ( selection.height > maxHeight ) ) && ( selection.height = maxHeight);
                        toScale && (selection.width = selection.height * zzz);
                        if (x1 > x2) selection.left = x1 - selection.width;
                        else minHeight && ( selection.top > (imgOfs.height - minHeight) ) && (  selection.top = imgOfs.height - minHeight );
                    }
                }
                else {
                    minHeight && ( y1 < minHeight) && ( bTopHeight = true );
                    if (x1 - x2 > 0) {
                        minWidth && ( x1 <= minWidth ) && ( bLeftWidth = true );
                        bLeftWidth && ( x1 = minWidth );
                    }
                    else {
                        minWidth && ( x1 >= (imgOfs.width - minWidth) ) && ( bRightWidth = true );
                        bRightWidth && ( x1 = imgOfs.width - minWidth);
                        selection.left = x1;
                    }
                    if (toScale) {
                        if (Math.abs(x1 - x2) > Math.abs(y1 - y2) * zzz) {
                            selection.width = Math.abs(x1 - x2) + fixWidth;
                            ( x1 > x2 ) && (selection.left = x2 - fixWidth);
                            if (minWidth && ( selection.width < minWidth )) {
                                selection.width = minWidth;
                                ( x1 > x2 ) && (selection.left = x1 - minWidth);
                            }
                            if (maxWidth && ( selection.width > maxWidth )) {
                                selection.width = maxWidth;
                                ( x1 > x2 ) && (selection.left = x1 - maxWidth)
                            }
                            selection.height = selection.width / zzz;
                            selection.top = y1 - selection.height;
                        }
                        else {
                            selection.height = Math.abs(y1 - y2) + fixHeight;
                            selection.top = y2 - fixHeight;
                            if (minHeight && ( selection.height < minHeight )) {
                                selection.height = minHeight;
                                ( x1 > x2 ) && (selection.top = y1 - minHeight);
                            }
                            if (maxHeight && ( selection.height > maxHeight )) {
                                selection.height = maxHeight;
                                ( x1 > x2 ) && (selection.top = y1 - maxHeight);
                            }
                            selection.width = selection.height * zzz;
                            if (x1 > x2) selection.left = x1 - selection.width;
                            else {
                                minHeight && (( Math.abs(y1 - y2) + fixHeight ) <= minHeight) && (selection.top = y1 - minHeight);
                                maxHeight && (( Math.abs(y1 - y2) + fixHeight ) >= maxHeight) && (selection.top = y1 - maxHeight);
                            }
                        }
                    }
                    else {
                        ( x1 <= x2 ) && ( !bLeftRightSwitch && (selection.width = Math.abs(x1 - x2) + fixWidth) );
                        ( x1 > x2 ) && (selection.width = Math.abs(x1 - x2) + fixWidth);
                        selection.height = Math.abs(y1 - y2) + fixHeight;
                        ( x1 > x2 ) && (selection.left = x2 - fixWidth);
                        selection.top = y2 - fixHeight;
                        if (minWidth && ( selection.width < minWidth )) {
                            selection.width = minWidth;
                            ( x1 > x2 ) && (selection.left = x1 - minWidth)
                        }
                        if (maxWidth && ( selection.width > maxWidth )) {
                            selection.width = maxWidth;
                            ( x1 > x2 ) && (selection.left = x1 - maxWidth)
                        }
                        if (minHeight && ( selection.height < minHeight )) {
                            selection.height = minHeight;
                            ( x1 > x2 ) && (selection.top = y1 - minHeight)
                        }
                        if (maxHeight && ( selection.height > maxHeight )) {
                            selection.height = maxHeight;
                            ( x1 > x2 ) && (selection.top = y1 - maxHeight)
                        }
                    }
                    if (x1 > x2 && selection.left < 0) {
                        selection.left = 0;
                        selection.width = x1;
                        ( minWidth && ( selection.width < minWidth ) ) && ( selection.width = minWidth);
                        ( maxWidth && ( selection.width > maxWidth ) ) && ( selection.width = maxWidth);
                        toScale && (selection.height = selection.width / zzz);
                        selection.top = y1 - selection.height;
                    }
                    if (x1 <= x2 && (selection.width > imgOfs.width - selection.left)) {
                        selection.width = imgOfs.width - selection.left;//没有比例的时候
                        ( minWidth && ( selection.width < minWidth ) ) && ( selection.width = minWidth);
                        ( maxWidth && ( selection.width > maxWidth ) ) && ( selection.width = maxWidth);
                        toScale && ( selection.height = selection.width / zzz);
                        selection.top = y1 - selection.height;
                    }
                    if (selection.top < 0) {
                        selection.top = 0;
                        selection.height = y1;
                        ( minHeight && ( selection.height < minHeight ) ) && ( selection.height = minHeight);
                        ( maxHeight && ( selection.height > maxHeight ) ) && ( selection.height = maxHeight);
                        toScale && (selection.width = selection.height * zzz);
                        if (x1 > x2) {
                            selection.left = x1 - selection.width;
                            if (selection.left < 0) {
                                selection.left = 0;
                            }
                        }
                    }
                }
                selectionBox.style.top = selection.top + 'px';
                selectionBox.style.left = selection.left + 'px';
                selectionBox.style.width = selection.width + 'px';
                selectionBox.style.height = selection.height + 'px';
            }
            for (var i = 0, l = oHandle.length; i < l; i++) {
                handleDrag(oHandle[i]);
            }
            function handleDrag(obj) {
                bindEvent(obj, 'mousedown', handleDown);
                function handleDown(ev) {
                    var oEvent = ev || event,
                        x1, y1, x2, y2, fixHeight, fixWidth, iMoveHandTag, iUpHandTag;
                    imgAreaClip.style.cursor = getStyle(obj, 'cursor');
                    selectionBox.className = '';
                    if (obj.className.indexOf('rb') != -1) {
                        x1 = selection.left;
                        y1 = selection.top;
                        fixHeight = selection.height - (oEvent.clientY - imgOfs.top - selection.top + scrollTop());
                        fixWidth = selection.width - (oEvent.clientX - imgOfs.left - selection.left + scrollLeft());
                    } else if (obj.className.indexOf('lt') != -1) {
                        x1 = selection.left + selection.width;
                        y1 = selection.top + selection.height;
                        fixHeight = oEvent.clientY - imgOfs.top - selection.top + scrollTop();
                        fixWidth = (oEvent.clientX - imgOfs.left - selection.left) + scrollLeft();
                    } else if (obj.className.indexOf('lb') != -1) {
                        x1 = selection.left + selection.width;
                        y1 = selection.top;
                        fixHeight = selection.height - (oEvent.clientY + scrollTop() - imgOfs.top - selection.top);
                        fixWidth = (oEvent.clientX + scrollLeft() - imgOfs.left - selection.left);
                    } else if (obj.className.indexOf('rt') != -1) {
                        x1 = selection.left;
                        y1 = selection.top + selection.height;
                        fixHeight = oEvent.clientY + scrollTop() - imgOfs.top - selection.top;
                        fixWidth = selection.width - (oEvent.clientX + scrollLeft() - imgOfs.left - selection.left);
                    } else if (obj.className.indexOf('tm') != -1) {
                        x1 = selection.left;
                        y1 = selection.top + selection.height;
                        fixWidth = selection.width - (oEvent.clientX + scrollLeft() - imgOfs.left - selection.left);
                        fixHeight = oEvent.clientY + scrollTop() - imgOfs.top - selection.top;
                    } else if (obj.className.indexOf('rm') != -1 || obj.className.indexOf('bm') != -1) {
                        x1 = selection.left;
                        y1 = selection.top;
                        fixWidth = selection.width - (oEvent.clientX + scrollLeft() - imgOfs.left - selection.left);
                        fixHeight = selection.height - (oEvent.clientY + scrollTop() - imgOfs.top - selection.top);
                    } else if (obj.className.indexOf('lm') != -1) {
                        x1 = selection.left + selection.width;
                        y1 = selection.top;
                        fixWidth = oEvent.clientX - imgOfs.left - selection.left + scrollLeft();
                        fixHeight = selection.height - (oEvent.clientY + scrollTop() - imgOfs.top - selection.top);
                    }
                    if (obj.setCapture) {
                        obj.setCapture();
                        iMoveHandTag = bindEvent(obj, 'mousemove', function (e) {
                            fnHandleMove.call(obj, e);
                        });
                        iUpHandTag = bindEvent(obj, 'mouseup', function () {
                            fnHandleUp.call(obj);
                        });
                    } else {
                        iMoveHandTag = bindEvent(document, 'mousemove', function (e) {
                            fnHandleMove.call(document, e);
                        });
                        iUpHandTag = bindEvent(document, 'mouseup', function () {
                            fnHandleUp.call(document);
                        });
                    }
                    function fnHandleMove(ev) {
                        var oEvent = ev || event;
                        x2 = oEvent.clientX - imgOfs.left + scrollLeft();
                        y2 = oEvent.clientY - imgOfs.top + scrollTop();
                        sameScale.call(obj, x1, y1, x2, y2, fixWidth, fixHeight);
                        oTopMiddleHandle.style.left = oBottomMiddleHandle.style.left = ((selection.width - handleSize) >> 1) + 'px';
                        oRightMiddleHandle.style.top = oLeftMiddleHandle.style.top = ((selection.height - handleSize) >> 1) + 'px';
                        updateSelect(selection);
                        onChange(selection);
                        oEvent.cancelBubble = true;
                    }
                    function fnHandleUp() {
                        selectionBox.className = 'add-cursor';
                        imgAreaClip.style.cursor = 'crosshair';
                        if (obj.releaseCapture) obj.releaseCapture();
                        unbindEvent(this, 'mousemove', aFuncTag[iMoveHandTag]);
                        unbindEvent(this, 'mouseup', aFuncTag[iUpHandTag]);
                        bRightWidth = bBottomHeight = bTopHeight = bLeftWidth = bLeftRightSwitch = bTopBottomSwitch =  false;
                    }
                    oEvent.cancelBubble = true;
                    !!oEvent.preventDefault && oEvent.preventDefault();
                }
            }
        };
    return imgSelectionClip;
})();
