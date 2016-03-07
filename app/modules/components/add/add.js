// 发布页
// 页面初始化
var common = require('../common/common.js');
// 百度上传组件
var WebUploader = require('../../../../node_modules/tb-webuploader/dist/webuploader.min.js');

$(document).on('pageInit','.add', function (e, id, page) {
  if (page.selector == '.page'){
    return false;
  }
  var init = new common(page);
  init.wx_share(false);
  // 上传图片
  var images = $('.images');
  var submit_btn = $('.hs-footer .submit');
  var picture_list = [];
  // 判断
  function get_picture_list() {
    var result = false;
    // 判断是否有头图
    if(picture_list.length){
      if(!picture_list.is_cover(1)){
        $.toast('封面必须上传');
      } else if(!picture_list.is_cover(0)){
        $.toast('除了封面还需要其他图片');
      } else {
        result = JSON.stringify(picture_list);
      }
    } else {
      $.toast('必须上传图片');
    }
    return result;
  }
  // 从数组里删除file
  Array.prototype.remove = function(id){
    var result;
    var _this = this;
    $.each(this,function(index,item){
      if(item.id == id){
       _this.splice(index,1);
     }
   })
    return this.push.apply(this,result);
  };
  // 判断数组里是否有is_cover
  Array.prototype.is_cover = function(is_cover){
    var result;
    var temp = [];
    var _this = this;
    if(_this.length){
     $.each(_this,function(index,item){
      temp.push(item.iscover);
      if(temp.indexOf(is_cover) == -1) {
        result = false;
      } else {
        result = true;
      }
    });
   }
   return result;
 };
  // 限制图片数量
  var max_pic_number = 5;

  // WebUploader 初始化
  var uploader = WebUploader.create({
    fileNumLimit: max_pic_number,
    // 自动上传。
    auto: true,
    // 文件接收服务端。
    server: '/index.php?g=api&m=HsFileupload&a=upload',
    // 二进制上传
    sendAsBinary: true,
    // 只允许选择文件，可选。
    accept: {
      title: 'Images',
      extensions: 'gif,jpg,jpeg,bmp,png',
      mimeTypes: 'image/*'
    }
  });
  // 监听input file是否有文件添加进来
  images.on('change','.webuploader-element-invisible', function(e) {
    var iscover;
    var is_add_li = true;
    var _this = e.srcElement.parentNode;
    var pic_number = images.find('li').length;

    // 是否为头图
    if(e.srcElement.parentNode.className == 'cover') {
      iscover = 1;
    } else {
      iscover = 0;
    }

    // 重复上传替换
    var this_file_id = $(e.srcElement.previousElementSibling).data('id');
    if(this_file_id) {
      picture_list.remove(this_file_id);
      uploader.removeFile(uploader.getFile(this_file_id));
      is_add_li = false;
    }

    // 当单个文件被添加进来的时候
    uploader.onFileQueued = function(file){
      // 生成缩略图
      uploader.makeThumb(file,function(error,ret){
        if(error){
          $(_this).find('.image').text('预览错误');
        } else {
          $(_this).find('.image img').remove();
          $(_this).find('.remove_btn').remove();
          $(_this).find('.image').attr('data-id',file.id);
          $(_this).find('.image').append('<img src="'+ret+'" />');
        }
      });
      // 控制提交按钮
      submit_btn.attr('disabled','disabled');
    }
    // 上传图片
    uploader.addFiles(e.target.files);
    // 进度条
    uploader.onUploadProgress = function(file, percentage){
      var progress_tpl = '<div class="progress"><span></span></div>';
      $(_this).find('.image').append(progress_tpl);
      $(_this).find('.image .progress span').css('width', percentage * 100 + '%');
    }
    // 图片上传成功
    uploader.onUploadSuccess = function(file, data){
      if(data.status==1){
        // 添加dom
        var li_tpl = '<li class="no_cover"><div class="image"></div><input type="file" name="file" class="webuploader-element-invisible" accept="image/*"></li>';
        if(!iscover && is_add_li){
          images.find('ul').append(li_tpl);
        }
        // 添加删除按钮
        var remove_button = '<button class="remove_btn hs-icon"></button>';
        $(_this).append(remove_button);
        // 销毁进度条
        $(_this).find('.image .progress').remove();
        // 添加push数组
        picture_list.push({
          id:file.id,
          data:data.data,
          iscover:iscover
        });
      }
      // 控制提交按钮
      submit_btn.removeAttr('disabled');
    }
    uploader.onUploadError = function(file,data){
      $.toast(data);
    }
    uploader.onError = function(type){
      if(type == 'Q_EXCEED_NUM_LIMIT'){
        $.toast('最多可上传'+max_pic_number+'张');
        images.find('li').last().remove();
      } else if(type == 'Q_EXCEED_SIZE_LIMIT') {
        $.toast('太大了，不让传');
      } else if(type == 'Q_TYPE_DENIED') {
        $.toast('兄弟必须是图片');
      }
    }
  });
  // 删除图片
  images.on('click','.remove_btn',function(e){
    images.off('click',this);
    var id = $(this).parent().find('.image').data('id');
    $(this).parent().find('.image img').remove();
    $(this).parent().find('.image').removeAttr('data-id');
    picture_list.remove(id);
    uploader.removeFile(uploader.getFile(id));
    if($(this).parent().hasClass('cover')) {
      $(this).remove();
    } else if(images.find('li.no_cover').length >= 2){
      $(this).parent().remove();
    }
  });

  // 选择标签
  var tags = $('.tags');
  var tags_num = tags.find('button.active').length;
  // 返回选中标签
  function get_tags(tags_list){
    var tags_list = [];
    tags.find('button.active').each(function(index,item){
      JSON.stringify(tags_list.push($(item).text()));
    });
    return tags_list;
  }
  tags.find('button').on('click',function(e) {
    if(tags_num >= 2){
      if($(this).hasClass('active')){
        $(this).removeClass('active');
        tags_num--;
      } else {
        $.toast("😕 标签最多选2个");
      }
    } else {
      if(!$(this).hasClass('active')){
        $(this).addClass('active');
        tags_num++;
      } else {
        $(this).removeClass('active');
        tags_num--;
      }
    }
  })

  // 提交
  $('.submit').on('click',function(){
    console.log(get_tags(),get_picture_list());
  })

});
$.init();

