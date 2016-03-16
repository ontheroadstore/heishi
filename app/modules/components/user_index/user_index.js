// 用户中心页
// handlebars
var handlebars = require('../../../../node_modules/handlebars/dist/handlebars.min.js');
// 初始化
var common = require('../common/common.js');

$(document).on('pageInit','.center', function(e, id, page){
  if (page.selector == '.page'){
    return false;
  }
  var init = new common(page);
  init.wx_share(false);
  // 列表首页_通用底部发布
  var hs_footer = $('.hs-footer');
  var notice_box = $('.notice_box');
  hs_footer.on('click','.notice_btn',function() {
    if(!$(this).hasClass('active')){
      $(this).addClass('active');
      notice_box.show();
      notice_box.css('bottom',hs_footer.height()-2);
    } else {
      $(this).removeClass('active');
      notice_box.hide();
    }
  })
  // 别人的个人中心
  var store_list = $('.store_list');
  if(store_list.length){
    if(store_list.find('li').length <= 19) {
      $('.infinite-scroll-preloader').remove();
    } else {
      var loading = false;
      var page_num = 2;
      var pages;
      var page_size = 20;
      var post_id = store_list.data('id');
      var store_list_tpl = handlebars.compile($("#store_list_tpl").html());
      function add_data(page_size,page) {
        $.ajax({
          type: 'POST',
          url: '/index.php?g=User&m=index&a=ajax_more_articles',
          data: {
            id:post_id,
            page:page_num,
            page_size:page_size
          },
          dataType: 'json',
          timeout: 4000,
          success: function(data){
            if(data.status == 1){
              store_list.find('ul').append(store_list_tpl(data.data));
              // 更新最后加载的序号
              pages = data.pages;
              page_num++;
              store_list.attr('pagenum',page_num);
              store_list.attr('pages',data.pages);
              init.loadimg();
            } else {
              $.toast('请求错误');
            }
          },
          error: function(xhr, type){
            $.toast('网络错误 code:'+type);
          }
        });
      }
      // 监听滚动
      page.on('infinite', function() {
      // 如果正在加载，则退出
      if (loading) return;
      // 设置flag
      loading = true;
      setTimeout(function() {
        loading = false;
        if (page_num >= pages) {
          // 加载完毕，则注销无限加载事件，以防不必要的加载
          $.detachInfiniteScroll($('.infinite-scroll'));
          // 删除加载提示符
          $('.infinite-scroll-preloader').remove();
          $.toast('😒 没有了');
          return;
        }
        // 请求数据
        add_data(page_size,page);
      },500);
      $.refreshScroller();
    });
    }
  }
});
