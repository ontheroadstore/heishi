// 商品内容页
// 微信jssdk
var wx = require('weixin-js-sdk');
// handlebars
var handlebars = require('../../../../node_modules/handlebars/dist/handlebars.min.js');
// 百度上传组件
var WebUploader = require('../../../../node_modules/tb-webuploader/dist/webuploader.min.js');
// 过滤关键词
var esc = require('../../../../node_modules/chn-escape/escape.js');
// 页面初始化
var common = require('../common/common.js');

$(document).on('pageInit','.store-show', function (e, id, page) {
  if (page.selector == '.page'){
    return false;
  }
  var init = new common(page);
  var share_data = {
    title: page.find('.frontcover .title').text(),
    desc: page.find('.content_bd').text(),
    link: GV.HOST+location.pathname,
    img: page.find('.frontcover .image').data('share')
  };
  init.wx_share(share_data);
  // 加关注
  // 检查用户关系
  var attention_btn = $('.attention-btn');

  if(attention_btn.data('myuid') != attention_btn.data('otheruid')) {
    $.post('/index.php?g=user&m=HsFellows&a=ajax_relations',{
      my_uid:attention_btn.data('myuid'),
      other_uid:attention_btn.data('otheruid')
    },function(data){
      if(data.relations == '2' || data.relations == '3') {
        attention_btn.addClass('active');
        attention_btn.text('取消关注');
      } else if(data.relations == '1' || data.relations == '0') {
        attention_btn.removeClass('active');
        attention_btn.html('<i>+</i>关注');
      }
    });
  } else {
    attention_btn.hide();
  }
  attention_btn.on('click',function(){
    if($(this).hasClass('active')){
      // 取消关注
      $.post('/index.php?g=user&m=HsFellows&a=ajax_cancel',{
        uid:$(this).data('otheruid')
      },function(data){
        if(data.status == '1') {
          attention_btn.html('<i>+</i>关注');
          attention_btn.removeClass('active');
          $.toast(data.info);
        } else {
          $.toast(data.info);
        }
      });
    } else {
      // 关注
      $.post('/index.php?g=user&m=HsFellows&a=ajax_add',{
        uid:$(this).data('otheruid')
      },function(data){
        if(data.status == '1') {
          attention_btn.text('取消关注');
          attention_btn.addClass('active');
          $.toast(data.info);
        } else {
          $.toast(data.info);
        }
      });
    }
  });
  // 微信预览图片
  var images = $('.images');
  page.on('click','.images ul li',function(){
    var preview_list = [];
    $.each($('.images ul li'),function(index,item){
      preview_list.push($('.images ul li').eq(index).data('preview'));
    });
    wx.previewImage({
      current: $(this).data('preview'),
      urls: preview_list
    });
  });
  // 打赏
  var dialog_reward = $('.dialog_reward');
  var reward_btn = $('.reward_btn');
  $('.reward_btn').on('click',function(){
    dialog_reward.find('input').val('');
    dialog_reward.show();
  });
  // 打赏框
  dialog_reward.on('click','.ui-dialog-close',function(){
    dialog_reward.hide();
  });
  dialog_reward.on('click','.submit',function(){

    var reward_data = {
      id:$(this).data('id'),
      uid:$(this).data('uid'),
      title:$(this).data('title'),
      total_fee:parseInt(dialog_reward.find('input').val()),
      type:$(this).data('type'),
      username:$(this).data('username')
    };
    if(dialog_reward.find('input').val() >= 1){
      $.ajax({
        type: 'POST',
        url: '/index.php?g=restful&m=HsOrder&a=add',
        data: {
          'order[object_id]': reward_data.id,
          'order[object_owner_id]': reward_data.uid,
          'order[object_title]': reward_data.title,
          'order[counts]': 1,
          'order[price]': reward_data.total_fee,
          'order[total_fee]': reward_data.total_fee,
          'order[type]': 0,
          'order[payment_type]': 0,
          'order[attach]': '打赏'
        },
        dataType: 'json',
        timeout: 4000,
        success: function(data){
          if (data.status == '1') {
            dialog_reward.hide();
            $.showPreloader();
            var ok_url = GV.pay_url+'hsadmire.php?order_number=' + data.order_number +
            '&total_fee=' + reward_data.total_feey +
            '&object_id=' + reward_data.id +
            '&goods_type=' + reward_data.type +
            '&seller_username=' + reward_data.username;;
            setTimeout(function() {
              $.hidePreloader();
              window.location.href = ok_url;
            }, 2000);
          } else if(data.status == '0'){
            $.toast(data.info);
          }
        },
        error: function(xhr, type){
          $.toast('网络错误 code:'+xhr);
        }
      });
    } else {
      $.toast('😐 必须是整数');
      dialog_reward.find('input').trigger('focus');
    }
  });
  // 点赞
  var praise = $('.praise');
  var praise_number = $('.praise .header').find('span');
  var praise_list_tpl = handlebars.compile($("#praise_list_tpl").html());
  praise.on('click','.praise_btn',function(){
    var btn_data = {
      uid:$(this).data('uid'),
      username:$(this).data('username'),
      avatar:$(this).data('avatar')
    };
    $.ajax({
      type: 'POST',
      url: '/index.php?m=HsArticle&a=do_like',
      data: {
        id:$(this).data('id')
      },
      dataType: 'json',
      timeout: 4000,
      success: function(data){
        if(data.status == 1){
          $.toast(data.info);
          $('.praise_btn').parent('li').after(praise_list_tpl(btn_data));
          // 数字加1
          praise_number.text(parseInt(praise_number.text())+1);
          init.loadimg();
        } else {
          $.toast(data.info);
        }
      },
      error: function(xhr, type){
        $.toast('网络错误 code:'+xhr);
      }
    });
  });
  // 更多按钮
  var praise_more_tpl = handlebars.compile($("#praise_more_tpl").html());
  // var praise_more_tpl = '<li><button type="button" class="praise_more">更多</button></li>';
  $('.store-show .praise ul li').each(function(index,item){
    if(index <= 7) {
      $('.store-show .praise ul').height('1.32rem');
    } else if (index >= 16){
      $('.store-show .praise ul li').eq(15).before(praise_more_tpl('更多'));
    } else {
      $('.store-show .praise ul').height('2.64rem');
    }
  });
  $('.praise_more').live('click',function(){
    $('.praise_more').parent().remove();
    if($(this).hasClass('active')) {
      $(this).parent().remove();
      $('.store-show .praise ul li').eq(15).before(praise_more_tpl('更多'));
      $('.store-show .praise ul').height('2.64rem');
    } else {
      $(this).parent().remove();
      $('.store-show .praise ul').height('auto');
      $('.store-show .praise ul').append(praise_more_tpl('回收'));
      $('.praise_more').addClass('active');
      // $('.praise_more').text('回收');
    }
  });
  // 评论加载更多
  var comment = $('.comment');
  var comment_bd = $('.comment_bd');
  var loading = false;
  // 初始化下拉
  var post_id = comment.data('id');
  var cur_cid;
  var is_load = true;
  var comment_list_tpl = handlebars.compile($("#comment_list_tpl").html());

  // 增加模板引擎判断
  handlebars.registerHelper('eq', function(v1, v2, options) {
    if(v1 == v2){
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });
  function add_data() {
    $.ajax({
      type: 'GET',
      url: '/index.php?g=Comment&m=Widget&a=ajax_more&table=posts',
      data: {
        post_id:post_id,
        cur_cid:cur_cid
      },
      dataType: 'json',
      timeout: 4000,
      success: function(data){
        if(data.state == 'success'){
          if(data.status == '1'){
            if(data.comments.length == 0){
              // 加载完毕，则注销无限加载事件，以防不必要的加载
              $.detachInfiniteScroll($('.infinite-scroll'));
              // 删除加载提示符
              $('.infinite-scroll-preloader').remove();
              $.toast('😒 没有评论了');
            } else {
              // 添加继续
              comment_bd.append(comment_list_tpl(data));
              cur_cid = comment_bd.find('li').last().data('id');
              init.loadimg();
            }
          } else if(data.status == '0'){
              // 加载完毕，则注销无限加载事件，以防不必要的加载
              $.detachInfiniteScroll($('.infinite-scroll'));
              // 删除加载提示符
              $('.infinite-scroll-preloader').remove();
              $.toast('😒 没有评论了');
            }
          } else {
            $.toast(data.info);
          }
        },
        error: function(xhr, type){
          $.toast('网络错误 code:'+xhr);
        }
      });
  }
  page.on('infinite', function(){
    if (loading ) return;
    // 设置flag
    loading = true;
    // 模拟1s的加载过程
    setTimeout(function() {
      // 重置加载flag
      loading = false;
      // 请求数据
      add_data();
      $.refreshScroller();
    }, 500);
  });

  // 添加评论
  var comment_btn = $('#comment-btn');
  var footer_nav = $('.footer_nav');
  var comment_bd = $('.comment_bd');
  var dialog_comment = $('.dialog_comment');
  var comment_count = $('.comment_count');
  var comment_input = $('#comment_input');
  var reply_tpl = handlebars.compile($("#reply_tpl").html());

  // 弹出回复框
  function comment_box(id,ispic,username,element,is_father) {
    // 初始化
    comment_input.val('').attr('placeholder','随便说点什么');
    dialog_comment.find('button').removeAttr('disabled');
    dialog_comment.show();
    comment_input.trigger('focus');
    var image_list = dialog_comment.find('.image_list');
    var image = dialog_comment.find('.image');
    // 上传图片
    var uploader = WebUploader.create({
      fileNumLimit: 1,
      // 自动上传。
      auto: true,
      // 文件接收服务端。
      server: '/index.php?g=api&m=HsFileupload&a=upload',
      // 二进制上传
      sendAsBinary: true,
      // 只允许选择文件，可选。
      accept: {
        title: 'Images',
        extensions: 'gif,jpg,jpeg,bmp,png,webp',
        mimeTypes: 'image/*'
      }
    });
    // 判断是否是回复
    if (username.length) {
      comment_input.attr('placeholder','回复：'+username);
    } else {
      comment_input.attr('placeholder','随便说点什么');
    }
    // 控制是否上传图片
    if (ispic) {
      dialog_comment.find('.image').show();
    } else {
      dialog_comment.find('.image').hide();
    }
    // 禁止滑动
    dialog_comment.on('touchmove',function(e){
      e.stopPropagation();
    });
    // 提交评论
    dialog_comment.on('click','.submit', function() {
      dialog_comment.off('click','.submit');
      dialog_comment.find('button').attr('disabled','disabled');
      // 过滤关键词
      var text_list = [
      '燃料',
      '大麻',
      '叶子',
      '淘宝',
      'taobao.com',
      '共产党'
      ];
      esc.init(text_list);
      // 判断是否为空并且过滤关键词
      if(!comment_input.val().length){
        comment_input.attr('placeholder','😒 评论不能为空');
      } else if (esc.find(comment_input.val()).length) {
        dialog_comment.hide();
        $.toast('🚔 我要报警了');
      } else {
        if(is_father) {
          var type =0;
          if(ispic){
            type = 4;
          }
          var post_data = {
            content:comment_input.val(),
            post_table:comment.data('table'),
            post_id:comment.data('id'),
            to_uid:0,
            parentid:0,
            type:type,
            url:window.location.href
          }
        } else {
          // 二级回复
          var post_data = {
            content:comment_input.val(),
            post_table:comment.data('table'),
            post_id:comment.data('id'),
            to_uid:element.data('uid'),
            parentid:element.data('id'),
            type:0,
            url:window.location.href
          }
        }
        $.ajax({
          type: 'POST',
          url: '/index.php?g=comment&m=comment&a=post',
          data: post_data,
          dataType: 'json',
          timeout: 4000,
          success: function(data){
            if(data.status == 1){
              // 成功评论
              dialog_comment.hide();
              $.toast('😄 评论成功');
              dialog_comment.hide();
              comment_count.text(parseInt(comment_count.text())+1);
              // 添加评论dom
              if(is_father) {
                // 回复直接添加底部
                var reply_data = {
                 is_father:true,
                 ispic:ispic,
                 comment:comment_input.val(),
                 username:comment.data('username'),
                 avatar:comment.data('avatar'),
                 uid:comment.data('uid'),
                 id:data.data.id};
                 comment_bd.append(reply_tpl(reply_data));
               } else {
                var reply_data = {
                 is_father:false,
                 ispic:ispic,
                 comment:comment_input.val(),
                 username:comment.data('username'),
                 parent_full_name:element.data('username'),
                 uid:comment.data('uid'),
                 id:data.data.id};
                 if(element.hasClass('father')){
                  // 二级回复
                  if(!element.find('.comment-content .reply').length){
                    element.find('.comment-content').append('<ul class="reply"> </ul>');
                    element.find('.comment-content .reply').append(reply_tpl(reply_data));
                  }
                } else {
                  //一级回复
                  element.parent('.reply').append(reply_tpl(reply_data));
                }
              }
            } else {
              $.toast(data.info);
            }
            uploader.reset();
            init.loadimg();
            $.refreshScroller();
          },
          error: function(xhr, type){
            $.toast('网络错误 code:'+xhr);
            dialog_comment.hide();
          }
        });
      }
    });

    // 监听input file是否有文件添加进来
    dialog_comment.on("change",'.webuploader-element-invisible', function(e) {
      uploader.addFiles(e.target.files);
      uploader.upload();
    });
    // 图片列队
    uploader.onFileQueued = function(file){
      // 控制回复按钮
      dialog_comment.find('.cancel').attr('disabled','disabled');
      dialog_comment.find('.submit').attr('disabled','disabled');
      // 控制回复框
      comment_input.hide();
      // 生成缩略图
      uploader.makeThumb(file,function(error,ret){
        image_list.empty();
        if(error){
          image_list.html('预览错误');
        } else {
          image_list.append('<img src="'+ret+'" />');
        }
      });
    }
    // 上传成功
    uploader.onUploadSuccess = function(file,response) {
      // 添加关闭按钮
      image_list.append('<button class="close" data-id="'+file.id+'">取消</button>');
      // 恢复提交按钮
      dialog_comment.find('.cancel').removeAttr('disabled','disabled');
      dialog_comment.find('.submit').removeAttr('disabled','disabled');
      // 消除进度条
      image_list.find('.progress').remove();
      // 删除上传框
      dialog_comment.find('.image .updata_image_btn').remove();
      if(response.status == 1) {
       comment_input.val(response.data);
     } else {
       $.toast(response.info);
     }
   }
    // 控制进度条
    uploader.onUploadProgress = function(file,percentage) {
      image_list.append('<div class="progress"><span></span></div>');
      image_list.find('.progress span').css('width', percentage * 100 + '%');
    }
    // 上传出错
    uploader.onUploadError = function(file,reason) {
     $.toast(reason);
   }
    // 当图片初始化
    uploader.onReset = function(){
      image_list.before('<div class="updata_image_btn"><button type="button">icon</button><input type="file" name="file" class="webuploader-element-invisible" accept="image/*" single></div>');
      image.find('.image_list').empty();
      comment_input.show();
    }
    // 选择时文件出错
    uploader.onError = function(type){
      if(type == 'Q_EXCEED_NUM_LIMIT'){
        $.toast('最多可上传1张');
      } else if(type == 'Q_EXCEED_SIZE_LIMIT') {
        $.toast('太大了，不让传');
      } else if(type == 'Q_TYPE_DENIED') {
        $.toast('兄弟必须是图片');
      }
    }
    // 删除图片按钮
    image_list.on('click','.close',function(){
      dialog_comment.find('#comment_input').removeAttr('disabled');
      uploader.reset();
    })
    // 关闭按钮
    dialog_comment.on('click','.cancel', function() {
      dialog_comment.off('click','.cancel');
      dialog_comment.hide();
      // 上传图片初始化
      uploader.reset();
    });
  }

  // 点击回复框
  $('.comment_bd').on('click','li',function(e){
    var comment_id = $(this).data('id');
    var username = $(this).data('username');
    // 图片
    if(e.srcElement.className == 'comment_image') {
      // 调用微信图片
      wx.previewImage({
        current: $(e.srcElement).data('preview'),
        urls: [$(e.srcElement).data('preview')]
      });
    } else {
      comment_box(comment_id,false,username,$(this),false);
    }
  });

  comment_btn.on('click',function(){
    var comment_id = $(this).data('id');
    comment_box(comment_id,true,'',$(this),true);
  });

});
