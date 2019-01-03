const SERVER = require("../../utils/server.js");
const CONFIG = require("../../config.js");
const UTIL = require("../../utils/util.js");

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    target: {
      type: Object,
      observer: function() {
        this.loadLikes(false);
      }
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    likes: [],
    all: false,
    total: 0,

    //private
    loading: false,
    page: 0,
    mine: null,
    changing: false
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onBindScrollToLower: function() {
      if (this.data.loading || this.data.all)
        return;
      this.loadLikes(true);
    },

    onBindTap: function() {
      if (this.data.loading || this.data.all)
        return;
      this.loadLikes(true);
    },

    loadLikes: function(more) {
      let page = 1;
      if (more)
        page = this.data.page + 1;

      this.data.loading = true;

      const _this = this;
      SERVER.getLatestLikes({
        ...this.properties.target,
        page: page,
        pageSize: CONFIG.likePageSize,
        mine: !more
      }, {
        success: function(res) {
          let likes = res.data.data.likes;
          for (let like of likes)
            like.createTime = UTIL.printDateTime(like.createTime);

          if (more)
            likes = _this.data.likes.concat(res.data.data.likes);
          else {
            _this.data.mine = res.data.data.mine;
            _this.triggerEvent("liked", {
              value: _this.data.mine != null
            }, {});
          }

          let total = res.data.data.total;
          let all = (likes.length >= total);

          _this.setData({
            likes: likes,
            all: all,
            total: total
          });
          _this.data.page = page;

          if (likes.length > total) {
            console.error("Likes: Local > Server");
            console.error(likes, total);
          }
        },
        fail: function(res) {

        },
        complete: function(res) {
          console.debug(res);
          _this.data.loading = false;
        }
      })
    },

    addLike: function() {
      if (this.data.changing)
        return;
      this.data.changing = true;

      const _this = this;
      SERVER.addLike({
        ...this.properties.target,
        userID: getApp().data.user.userID,
      }, {
        success: function(res) {
          wx.showToast({
            title: "谢谢\u{1F604}",
            icon: "success"
          });
          _this.loadLikes(false);
        },
        fail: function(res) {
          wx.showToast({
            title: "点赞失败了\u{1F644}"
          });
        },
        complete: function(res) {
          _this.data.changing = false;
          console.debug(res);
        }
      });
    },

    deleteLike: function() {
      if (this.data.changing)
        return;
      this.data.changing = true;

      const _this = this;
      SERVER.deleteLike({
        likeID: this.data.mine.likeID
      }, {
        success: function(res) {
          wx.showToast({
            title: "取消点赞",
            icon: "success"
          });
          _this.loadLikes(false);
        },
        fail: function(res) {
          wx.showToast({
            title: "取消点赞失败了\u{1F644}"
          });
        },
        complete: function(res) {
          _this.data.changing = false;
          console.debug(res);
        }
      });
    }
  }
})