// 私信列表
var dropload = require('../../../../bower_components/dropload/dist/dropload.min.js');

if($('.chat_list_group').length){
  // 从右往左滑
  $('.chat_list_group_bd ul li').swipeLeft(function(){
    $('.delete').hide();
    $('.chat_list_group_bd ul li').removeClass('active');

    $('.delete',this).animate({
      display: 'block'
    }, 500, 'ease-in');
    $(this).addClass('active');
  });
  // 从左往右滑
  $('.chat_list_group_bd ul li').swipeRight(function(){
    $('.delete').hide();
    $('.chat_list_group_bd ul li').removeClass('active');
  })

  var chat_list_group_bd = $('.chat_list_group_bd');
  chat_list_group_bd.dropload({
    domDown : {
      domClass : 'dropload-down',
      domRefresh: '<div class="dropload-refresh">🌚 往上拉。</div>',
      domLoad : '<div class="dropload-load">😏 加载呢。</div>',
      domNoData : '<div class="dropload-noData">😢 没有咯。</div>'
    },
    scrollArea : chat_list_group_bd,
    loadDownFn : function(e){

      e.noData();
      e.resetload();

    }
  })
}
