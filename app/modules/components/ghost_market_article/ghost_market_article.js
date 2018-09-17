//鬼市商品详情页

// 初始化
var common = require('../common/common.js');
var openComment = require('../comment/gs_comment.js');
// 微信jssdk
var wx = require('weixin-js-sdk');

$(document).on('pageInit','.ghost_market_article', function(e, id, page) {
    if (page.selector == '.page') {
        return false;
    }
    var init = new common(page);
    var lazyLoad = init.lazyLoad;

    var ApiBaseUrl = init.getApiBaseUrl();
    var PHPSESSID = init.getCookie('PHPSESSID');
    var ajaxHeaders = {
        'phpsessionid': PHPSESSID
    };

    //2018090315365152249

    var goodsId = init.getUrlParam('id');
    // var theme = init.getUrlParam('theme');//活动主题，暂时没用

    var $content_wrap = $('.content_wrap');

    // var userInfo = null;
    // getUserInfo();

    getGoodsDetail(goodsId);

    function getGoodsDetail(id) {

        var url = ApiBaseUrl + '/ghostmarket/goods/' + id + '/getDetail';
        $.ajax({
            type: "GET",
            url: url,
            dataType: 'json',
            data: {},
            headers: ajaxHeaders,
            success: function (data) {
                if (data.status == 1) {
                    console.log(data.data);
                    initPage(data.data);

                }
            },
            error: function (e) {
                console.log('getGoodsDetail err: ', e);
            }

        });
    }


    function initPage(data){
        initDetail(data.detail);
        initSeller(data.user);
        initLiker(data.like);
        initComment(data.comment);
        initGuessLike(data.favorited);
        initEvent();
    }


    function initDetail(detail){
        $content_wrap.find('.title').html(detail.gg_title);
        $content_wrap.find('.price').html('¥'+detail.gg_price);
        $content_wrap.find('.detail_txt').html(detail.gg_content);

        initBanner(detail.gg_img);

    }

    function initBanner(imgs){
        var html = '';
        for(var i=0;i<imgs.length;i++){
            html+= '<div class="swiper-slide">'
            html+= '<img src="'+imgs[i]+'">'
            html+= '</div>'
        }
        $('.banner .swiper-wrapper').html(html);

        var mySwiper = new Swiper('.swiper-container',{
            loop: true,
            pagination: '.swiper-pagination',
            lazyLoading: true,
            autoplay: 3000,
            speed:300,
            autoplayDisableOnInteraction : false
        })


    }

    //初始化卖家信息
    function initSeller(user){
        $content_wrap.find('.to_seller_center').attr('href','/Portal/GhostMarket/seller.html?gg_ghost_id='+user.id);
        $content_wrap.find('.avatar').attr('src',user.avatar);

        if(user.announcement){
            $content_wrap.find('.name').html(user.nickname);
            $content_wrap.find('.intro').html(user.announcement);
        }else{
            $content_wrap.find('.name').html(user.nickname).addClass('single_line');
            $content_wrap.find('.intro').hide();
        }

        $content_wrap.find('.like_ico').attr('status',user.likeStatus);
        $('.footer .contact a').attr('href','/User/HsMessage/detail/from_uid/'+user.id);

        //初始化举报
        initReport(user.id,goodsId);
    }


    //初始化点赞列表
    function initLiker(like){
        var html = '';
        if(like && like.length>0){

            var len = like.length>=7 ? 7 : like.length;
            for(var i=0;i<len;i++){
                html += '<a external href="javascript:;"><img src="'+like[i].avatar+'"></a>'
            }
            if(like.length>=8){
                html += '<a external href="javascript:;" class="end_liker"><img src="'+like[7].avatar+'"></a>'
            }

            $content_wrap.find('.liker_wrap').html(html).show();
        }
    }


    //初始化评论
    function initComment(com){
        var html = '';

        if(com && com.length>0){

            for(var i=0;i<com.length;i++){
                html+= '<li class="comment_li hs-cf" gcid="'+ com[i].gc_id +'" uid="'+com[i].gc_userId+'" username="'+com[i].nickname+'">'
                html+= '<div class="comment_left js_reply">'
                html+= '<img src="'+com[i].gc_user_img+'" class="comment_avatar">'
                html+= '</div>'
                html+= '<div class="comment_right">'
                html+= '<div class="comment_user">'
                html+= '<div class="comment_name js_reply">'
                html+= '<div class="time">'+fmtCommentTime(com[i].gc_createtime)+'</div>'
                html+= '<div class="name">'+com[i].nickname+'</div>'
                html+= '</div>'
                if(com[i].gc_commen_img){
                    html+= '<div class="comment_img"><img class="wx_preview" src="'+ init.fixImgUrl(com[i].gc_commen_img) +'"></div>'
                }else{
                    html+= '<div class="comment_txt">'+ com[i].gc_comment +'</div>'
                }
                html+= '</div>'
                if(com[i].gc_kids.length>0){
                    html+= '<div class="comment_reply">'
                    for(var j=0;j<com[i].gc_kids.length;j++){
                        html+= '<div class="comment_reply_li js_reply js_reply_2" uid="'+ com[i].gc_kids[j].gc_user_id +'" username="'+ com[i].gc_kids[j].gc_username +'" >'
                        html+= '<div class="name">'+ com[i].gc_kids[j].gc_username +'<span>回复</span>'+ com[i].gc_kids[j].gc_to_user_name +'</div>'
                        html+= '<div class="txt">'+ com[i].gc_kids[j].gc_comment +'</div>'
                        html+= '</div>'
                    }
                    html+= '</div>'
                }else{
                    html+= '<div class="comment_reply comment_reply_none"></div>'
                }
                html+= '</div>'
                html+= '</li>'
            }

            $content_wrap.find('.comment_ul').html(html);
            $content_wrap.find('.comment_more').show();

        }



    }


    //初始化事件
    function initEvent(){
        $('.like_ico').off('click').on('click',function(){
            if($(this).attr('status')=='1'){
                return;
            }
            setUserLike();
        });

        evComment();

        //微信图片预览
        $content_wrap.find('.comment_ul').on('click','.wx_preview',function(){
            // 调用微信图片
            var arr = [];
            arr.push($(this).attr('src'));
            console.log('pre: ',wx.previewImage);

            wx.previewImage({
                current: arr[0],
                urls: arr
            });
        });

        //去评论列表页
        $content_wrap.on('click','.js_to_comment_list',function () {
            var url = '/Portal/GhostMarket/comment_list.html?id=' + goodsId;
            location.href = url;
        });

    }

    //点赞
    function setUserLike() {
        var url = ApiBaseUrl + '/ghostmarket/goods/' + goodsId + '/setUserLike';
        $.ajax({
            type: "POST",
            url: url,
            dataType: 'json',
            data: {},
            headers: ajaxHeaders,
            success: function (data) {
                $('.like_ico').attr('status','1');
            },
            error: function (e) {
                console.log('getGoodsDetail err: ', e);
                $('.like_ico').attr('status','1');
            }

        });
    }

    //评论时间格式化
    function fmtCommentTime(time){

        if(!time || (String(time).length < 10)){
            return '';
        }

        function fixNum(v){
            return v;
            return v<10 ? '0'+v : v;
        }

        time = String(time).length === 10 ? time*1000 : time;

        var t = new Date(time);
        var y = fixNum(t.getFullYear());
        var m = fixNum(t.getMonth()+1);
        var d = fixNum(t.getDate());

        return  m + '-' + d;
    };


    function getUserInfo() {

        var url = ApiBaseUrl + '/appv4/user/simple';
        $.ajax({
            type: "GET",
            url: url,
            dataType: 'json',
            data: {},
            headers: ajaxHeaders,
            success: function (data) {
                if (data.status == 1) {
                    userInfo = data.data;
                    console.log(data.data);
                }
            },
            error: function (e) {
                console.log('getUserInfo err: ', e);
            }

        });
    }


    //评论事件
    function evComment(){


        //一级评论
        $content_wrap.find('.comment_input').on('click',function(){

            openComment({
                goodsId:goodsId,
                lvl:1,          //评论级别 1或2
                mainId:'',      //主评论id
                toUserId:'',    //被评论人id
                toUserName:'',    //被评论人的name
                callback:function(data){
                    getCommentList();
                }
            })

        });

        //    二级评论：回复评论
        $content_wrap.find('.comment_wrap').on('click','.js_reply',function(){
            var $parent = $(this).parents('.comment_li');

            var obj = {
                goodsId:goodsId,
                lvl:2,          //评论级别 1或2
                mainId: $parent.attr('gcid'),      //主评论id
                toUserId: $parent.attr('uid'),    //被评论人id
                toUserName: $parent.attr('username'),    //被评论人的name
                callback:function(data){
                    getCommentList();
                }
            };

            if($(this).hasClass('js_reply_2')){
                obj.toUserId = $(this).attr('uid');
                obj.toUserName = $(this).attr('username');
            }

            openComment(obj);
        });

    }


    //获取评论列表
    function getCommentList(){
        $.ajax({
            type: 'GET',
            url: ApiBaseUrl+'/ghostmarket/getList',
            data: {
                goodsId:goodsId,
                skip: '0',//跳过几条
                num: '5',
            },
            dataType: 'json',
            headers: ajaxHeaders,
            success: function(data){
                if(data.status == 1){
                    initComment(data.data);
                }
            },
            error: function(xhr, type){
                $.toast('网络错误 code:'+xhr);
            }
        });
    }


    //猜你喜欢
    function initGuessLike(data) {
        var html = '';
        for(var i=0;i<data.length;i++){
            html+= '<li class="guess_like_li">'
            html+= '<a external href="/Portal/HsArticle/index/id/'+ data[i].id +'.html">'
            html+= '<img src="'+ data[i].image +'">'
            html+= '<div class="goods_title">'+ data[i].post_title +'</div>'
            html+= '</a>'
            html+= '</li>'
        }
        $content_wrap.find('.guess_like_ul').html(html);

    }


    //初始化举报

    function initReport(uid,goodsId) {
        //举报
        $('.report_btn').on('click',function(){
            $.confirm('你确定要举报吗？', function () {
                reportGoods(uid,goodsId);
            });
        })
    }

    //举报
    function reportGoods(uid,goodsId) {

        $.ajax({
            type: 'POST',
            url: '/index.php?g=restful&m=HsUserReporting&a=reporting',
            data: {
                be_reported_uid: uid,
                content: '鬼市商品id：'+ goodsId,
            },
            success: function(data){
                if(data.status == 1){
                    $.toast('举报成功');
                }else{
                    $.toast(data.info);
                }
            }
        })

    }


});

