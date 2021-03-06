// 私信列表
// handlebars
var handlebars = require('../../../../node_modules/handlebars/dist/handlebars.min.js');
// 初始化
var common = require('../common/common.js');

$(document).on('pageInit','.chat_list_group', function (e, id, page) {
  if (page.selector == '.page'){
    return false;
  }
  var init = new common(page);
  
  // 判断链接 显示回到首页
  if(location.pathname != '/user/HsMessage/lists.html'){
    $('.return_index').show();
  }
  $('.no_session_btn').click(function(){
    location.reload();
  })


  //置顶 删除按钮 记录touch位置
  var touchclientX = 0,
  touchclientY = 0;
  $('.chat_list_group_bd ul').on('touchstart','li',function(e){
    e.stopPropagation();
    touchclientX = e.originalEvent.targetTouches[0].clientX;
    touchclientY = e.originalEvent.targetTouches[0].clientY;
  })
  $('.chat_list_group_bd ul').on('touchmove','li',function(e){
    
    var num = e.originalEvent.targetTouches.length;
    if(num == 1){
      var x = Math.abs(touchclientX - e.originalEvent.targetTouches[0].clientX);
      var y = Math.abs(touchclientY - e.originalEvent.targetTouches[0].clientY);
      //判断上下  还是左右
      if(x < y) return;
      e.preventDefault();
      e.stopPropagation();
      var n = (touchclientX - e.originalEvent.targetTouches[0].clientX)/100;
      if(n <= 4 && n>=0){
        if($(this).find('.btn-box').width() != 0){
          return;
        }
        if(n > 1){
          $(this).find('.btn-box').css('width',"2.45rem");
          $(this).find('a').css('transform',"translateX(-2.45rem)");
          $(this).find('a').css('webkitTransform',"translateX(-2.45rem)");
        }else{
          $(this).find('.btn-box').css('width',"0");
          $(this).find('a').css('transform',"translateX(0)");
          $(this).find('a').css('webkitTransform',"translateX(0)");
        }
      }else if(n < 0 && n>=-4){
        var m = 4+n;
        if($(this).find('.btn-box').width() == 0){
          return;
        }
        if(m <= 3){
          $(this).find('.btn-box').css('width',"0");
          $(this).find('a').css('transform',"translateX(0)");
          $(this).find('a').css('webkitTransform',"translateX(0)");
        }else{
          $(this).find('.btn-box').css('width',"2.45rem");
          $(this).find('a').css('transform',"translateX(-2.45rem)");
          $(this).find('a').css('webkitTransform',"translateX(-2.45rem)");
        }
      }
    }
  })
  // 删除聊天
  var deleteSession = false;
  page.on('click','.delete',function(){
    var uid = 'p2p-'+$(this).data('uid');
    nim.resetSessionUnread(uid);
    deleteSession = true;
  });



  var chat_list_group_bd_tpl_default = handlebars.compile($("#chat_list_group_bd_tpl_default").html());
  var chat_list_group_bd_tpl_update = handlebars.compile($("#chat_list_group_bd_tpl_update").html());
  // 增加handlebars判断
  handlebars.registerHelper('eq', function(v1, v2, options) {
    if(v1 == v2){
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });


  //IM即时通讯
  var myId = $('#cnzz_user_id').val();
  var IMmyId = $('#cnzz_user_id').val();
  var nim = null;
  if(GV.HOST == '//hstest.ontheroadstore.com/'){
    IMmyId = 'hstest'+IMmyId;
  }
  $.ajax({
    type: 'GET',
    url: '/index.php?g=api&m=HsNeteasyIM&a=get_token_by_user_id',
    data: {
      user_id: myId
    },
    success: function(res){
      var data = JSON.parse(res);
      var token = data.data.token;
      var appKey = data.data.app_key;
      nim = NIM.getInstance({
          appKey: appKey,
          account: IMmyId,
          token: token,
          onconnect: onConnect,
          ondisconnect: onDisconnect,
          onerror: onError,
          onsessions: onSessions,
          syncSessionUnread: true,
          onupdatesession: onUpdateSession,
          db: true
      });
    }
  });
    
  function onConnect() {
      console.log('IM连接成功');
  }
  function onDisconnect(error) {
      // 此时说明 SDK 处于断开状态, 开发者此时应该根据错误码提示相应的错误信息
      $('.no_session').css('display', 'block');
      if (error) {
          switch (error.code) {
          // 账号或者密码错误, 请跳转到登录页面并提示错误
          case 302:
              $.ajax({
                  type: 'POST',
                  url: '/index.php?g=api&m=HsNeteasyIM&a=refresh_token',
                  data:{
                      user_id: myId
                  },
                  timeout: 4000,
                  success: function(data){
                      console.log(data);
                  },
                  error: function(xhr, type){
                      // $.toast(xhr.info);
                      console.log(type);
                  }
              });
              break;
          // 重复登录, 已经在其它端登录了, 请跳转到登录页面并提示错误
          case 417:
              break;
          // 被踢, 请提示错误后跳转到登录页面
          case 'kicked':
              break;
          default:
              break;
          }
      }
  }
  function onError(error) {
      console.log(error);
  }
  function onSessions(sessions) {
    var data = sessions;
    $('.no_session').remove();
    if(data.length == 0){
      $.toast('近期没有私信消息');
    }
    for(var i in data){
      //时间转换
      var time = new Date() - data[i]['lastMsg']['time'];
      var setTime = new Date(data[i]['lastMsg']['time']);
      if(time >= 86400000){
        data[i]['lastMsg']['create_time'] = setTime.Format('MM-dd');
      }else{
        data[i]['lastMsg']['create_time'] = setTime.ResidueTime();
      }
      if(data[i]['lastMsg']['type'] == 'image'){
        data[i]['lastMsg']['text'] = '[照片]';
      }
      // 删除id中的字符串
      data[i]['to'] = data[i]['to'].replace(/[^0-9]/ig,"");
    }
    //添加数据
    $('.chat_list_group_bd').find('ul').append(chat_list_group_bd_tpl_default(data));
    $('.chat_list_group_bd ul li').find('.btn-box').height($('.chat_list_group_bd ul li').height());
    pcCompatibility();
    for(var i in data){
      getUserImg(data[i]['to']);
    }
  }
  function onUpdateSession(session) {
      //删除会话使用代码
      if(deleteSession){
        nim.deleteSession({
          scene: 'p2p',
          to: session.to,
          done: deleteSessionDone
        });
        function deleteSessionDone(error, obj) {
          if(error) return;
          $('.chat_list_group_bd').find('ul li').each(function(){
            var id = $(this).data('id');
            var dataId = session.to;
            if(GV.HOST == '//hstest.ontheroadstore.com/'){
              id = 'hstest'+id;
            }
            if(id == dataId){
              $(this).remove();
              return false;
            }
          })
        }
        deleteSession = false;
        return false;
      }
      //收到消息使用代码 安卓端列表重复,由于onSessions列表未加载完，所以延时加载数据
      setTimeout(function(){
        $('.chat_list_group_bd').find('ul li').each(function(){
          var id = $(this).data('id');
          var dataId = session.to;
          if(id == dataId){
            $(this).remove();
            return false;
          }
        })
        var data = session;
        //时间转换
        var time = new Date() - data['lastMsg']['time'];
        var setTime = new Date(data['lastMsg']['time']);
        if(time >= 86400000){
          data['lastMsg']['create_time'] = setTime.Format('MM-dd');
        }else{
          data['lastMsg']['create_time'] = setTime.ResidueTime();
        }
        if(data['lastMsg']['type'] == 'image'){
          data['lastMsg']['text'] = '[照片]';
        }
        $('.chat_list_group_bd').find('ul').prepend(chat_list_group_bd_tpl_update(data));
        $('.chat_list_group_bd ul li').find('.btn-box').height($('.chat_list_group_bd ul li').height());
        //pc端微信由于没有touch事件 直接显示删除按钮
        pcCompatibility();
        getUserImg(data['to']);
      },300)
  }






  Date.prototype.Format = function (fmt) {
    var o = {
      "M+": this.getMonth() + 1,  // 月份
      "d+": this.getDate(),   // 日
      "h+": this.getHours(),    // 小时
      "m+": this.getMinutes(),  // 分
      "s+": this.getSeconds(),  // 秒
      "q+": Math.floor((this.getMonth() + 3) / 3), // 季度
      "S": this.getMilliseconds() // 毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
  }
  Date.prototype.ResidueTime = function () {
    var data = new Date();
    var time = data-this;

    if(time>=3600000){
      var h = Math.floor(time/1000/3600);
      return h+"小时前";
    }else if(time < 3600000 && time >= 60000){
      var m = Math.floor(time/1000/60);
      return m+"分前";
    }else if(time < 60000){
      var s = Math.floor(time/1000);
      return s+"秒前";
    }
  }
  function getUserImg(id,i){
    nim.getUser({
        account: id,
        done: getUserDone
    });
    function getUserDone(error, user) {
      console.log()
      $('.chat_list_group_bd').find('li').each(function(){
        var uid = $(this).data('id');
        var str = 'background: url("/tpl/simplebootx_mobile/Public/images/headicon_128.png") no-repeat';
        if(user['avatar']){
          str = 'url('+user['avatar']+') no-repeat';
        }
        if(uid == id){
          $(this).find('.avatar').css('background',str).css('background-size','100%');
          $(this).find('h3').text(user['nick']);
        }
      })
    }
  }
  //pc端点击右边出现删除按钮
  function IsPC() {
    var userAgentInfo = navigator.userAgent;
    var Agents = ["Android", "iPhone",
      "SymbianOS", "Windows Phone",
      "iPad", "iPod"
    ];
    var flag = false;
    for(var v = 0; v < Agents.length; v++) {
      if(userAgentInfo.indexOf(Agents[v]) > 0) {
        flag = true;
        break;
      }
    }
    return flag;
  }
   function pcCompatibility(){
    if(!IsPC()){
      $('li').each(function(){
        var newDiv = '<div class="delete_btn" style="width:2.45rem;position:absolute;height:100%;right:0;top:0;z-index:99;line-height:1.5rem;text-align:center;">操作</div>';
        $(this).append(newDiv);
      })
      $('.delete_btn').click(function(){
        $(this).parent().find('.btn-box').css('width','2.45rem');
        $(this).hide();
      })
    }
   }
});
