(function () {

	window.TplLoader = function (args) {
		/**  ========= 外部传递变量 ======== **/
		/**  外部传递原始tpl进来  **/
		this.sourceTpl = args.tpl || "<div>error:tpl未传递</div>";
		/**  父节点,dom需要放在的位置  **/
		this.$tplPostion = args.$tplPostion || null;
		/**  传递tpl所在的容器高度  **/
		this.containerHeight = this.$tplPostion.height() || window.innerHeight && window.innerHeight * 0.7 || document.documentElement.clientHeight && document.documentElement.clientHeight * 0.7;
		/**  默认第一次向dom中存放的节点个数  **/
		this.defaultLen = args.defaultLen || 1000;
		/**  默认鼠标向下滚动的个数  **/
		this.defaultDownLen = args.defaultDownLen || this.defaultLen;
		/**  搜索到的结果可接受外部传递的样式类  **/
		this.searchBGC = args.searchBGC || "";
		/**  初始化显示搜索结果  **/
		this.initSearchVal = args.searchVal || null;
		/**  初始化锚点位置  **/
		this.initAnchorPoint = args.anchorPoint || null;
		/**  滚动时遇到锚点抛出  **/
		this.scrollAnchorPoint = args.scrollAnchorPoint || function () {};

		/** ========= 内部使用变量 ======== **/
		/**  通过tpl转换为语法树  **/
		this.ASTDOM = {};
		/**  语法树转化为数组  **/
		this.resultASTArr = [];
		/**  当前dom节点在数组中的位置  **/
		this.currentArrIndex = 0;
		/**  搜索结果存放  **/
		this.searchResult = [];
		/**  dom id 存放  **/
		this.domIdArr = [];
		/**  当前scrolltop值  **/
		this.scrollTopVal = 0;
		/**  占位空白div  **/
		this.placeholderDiv = $("<div id = 'tplLoaderPlaceHolderDiv'></div>");
	};
	// 初始化
	TplLoader.prototype.init = function () {
		// 扩展IE8方法
		this.IE8Methods();
		// 绑定滚动事件
		this.bindEvent();
		// 转为语法树
		this.ASTDOM = this.getASTDOM();
		// 通过语法树转为数组
		var date1 = new Date().getTime();
		this.ASTDOM2Array(this.ASTDOM, this.$tplPostion);
		var date2 = new Date().getTime();
		console.log(date2-date1);
		// 初始化时存放dom
		this.putDocument();
		// 初始化显示搜索
		if (this.initSearchVal) this.searchByStr(this.initSearchVal);
		// 初始化锚点位置
		if (this.initAnchorPoint) this.movePostionAtAnchorPoint(this.initAnchorPoint);
	};

	TplLoader.prototype.setBodyFragment = function () {
		$("body").append($("<div id = 'tplLoaderFragment' style = 'display:none'></div>"));
	};
	// 事件处理
	TplLoader.prototype.bindEvent = function () {
		var that = this;
		this.$tplPostion.scroll(function () {
			var scrollHeight = that.$tplPostion[0].scrollHeight - that.placeholderDiv.height();
			var scrollTop = that.$tplPostion.scrollTop();
			var clientHeight = that.$tplPostion[0].clientHeight;
			if ((scrollHeight - scrollTop <= that.scrollTopVal) &&
				(scrollHeight - scrollTop <= clientHeight * 3) &&
				(that.currentArrIndex <= that.resultASTArr.length)) {
				that.putDocument(that.defaultDownLen);
			}
			that.scrollTopVal = scrollHeight - scrollTop;
		});
	};
	// IE8方法扩展
	TplLoader.prototype.IE8Methods = function () {
		/**  扩展替换方法  **/
		String.prototype.replaceAll = function (s1, s2) {
			return this.replace(new RegExp(s1, "gm"), s2);
		}
	}
	// 搜索
	TplLoader.prototype.searchByStr = function (str) {
		if (!str) return;
		/**  清空搜索结果  **/
		this.removeSearchResult();
		/**  设置搜索样式类  **/
		this.setSearchClass();
		/**  定义最后一个搜索结果位置  **/
		var lastIndex = 0;
		for (var i = 0; i < this.resultASTArr.length; i++) {
			var item = this.resultASTArr[i];
			if (item['s'] && item['s'].indexOf(str) > -1 && item['p'].nodeName != "STYLE") {
				lastIndex = i;
				this.searchResult.push({
					'd': item['d'],
					's': item['s'],
					'p': item['p'],
					't': $(item['p']).offset().top,
					'r': item['s'].replaceAll(str, this.getSearchDomTpl(str))
				})
			}
		}
		/**  如果最后一个位置没有在dom上展示,需要展示dom **/
		if (lastIndex > this.currentArrIndex) {
			this.putDocument(lastIndex - this.currentArrIndex + this.defaultDownLen);
		}
		/**  将搜索结果进行替换  **/
		for (var i = 0; i < this.searchResult.length; i++) {
			var item = this.searchResult[i];
			if (item['d'].nodeType == 3) {
				$(item['p'])[0].innerHTML = item['r'];
			}
		}
		/**  滚动屏幕到第一个搜索节点位置**/
		if (this.searchResult.length) {
			var firstItem = this.searchResult[0];
			if (!firstItem.t) firstItem.t = $(item['p']).offset().top;
			this.setScrollPostion(firstItem.t);
		}
	};
	// 移动位置到锚点
	TplLoader.prototype.movePostionAtAnchorPoint = function (id) {
		if (!id) return;
		for (var i = 0; i < this.domIdArr.length; i++ )  {
			if (this.domIdArr[i]['id'] == id) break;
		}
		// 刚好是数组中的最后一个
		if (!this.domIdArr[i+1]){
			this.putAll();
		}else{
			if (this.domIdArr[i+1]['i'] > this.currentArrIndex) {
				this.putDocument(this.domIdArr[i+1]['i'] - this.currentArrIndex + this.defaultDownLen);
			};
		}
		this.setScrollPostion($(this.resultASTArr[this.domIdArr[i]['i']]['d']).offset().top);
	};
	// 滚动到相应的区域
	TplLoader.prototype.setScrollPostion = function (top) {
		this.$tplPostion.animate({ scrollTop: this.$tplPostion.scrollTop() + top - this.$tplPostion.offset().top }, 350);
	};
	// 返回顶部
	TplLoader.prototype.moveUp = function () {
		this.setScrollPostion(-this.$tplPostion[0].scrollHeight);
	};
	// 返回页面最底部
	TplLoader.prototype.moveDown = function () {
		this.putAll();
		this.setScrollPostion(this.$tplPostion[0].scrollHeight);
	};
	// 获取搜索后的dom片段
	TplLoader.prototype.getSearchDomTpl = function (str) {
		return "<span class = 'tplLoaderCssClass_bgc " + this.searchBGC + "'>" + str + "</span>";
	};
	// 根据内部定义样式类取消搜索结果
	TplLoader.prototype.removeSearchResult = function () {
		for (var i = 0; i < this.searchResult.length; i++) {
			var item = this.searchResult[i];
			if (item['d'].nodeType == 3) {
				$(item['p'])[0].innerHTML = item['s'];
			}
		}
		this.searchResult = [];
	};
	// 为搜索结果添加样式类
	TplLoader.prototype.setSearchClass = function () {
		if (!document.getElementById("tplLoaderCssClass")) {
			(function (c) { var d = document, a = 'appendChild', i = 'styleSheet', s = d.createElement('style'); s.type = 'text/css'; s.id = 'tplLoaderCssClass'; d.getElementsByTagName('head')[0][a](s); s[i] ? s[i].cssText = c : s[a](d.createTextNode(c)); })
				('.tplLoaderCssClass_bgc{color:red}');
		}
	};
	// dom 存放到页面上
	TplLoader.prototype.putDocument = function (len) {
		if (!len) len = this.defaultLen;
		len = len - 0;
		var currentAnchorPoint = null;
		for (var i = this.currentArrIndex || 0; i < this.currentArrIndex + len; i++) {
			if (i >= this.resultASTArr.length) break;
			var item = this.resultASTArr[i];
			$(item['p']).append(item['d']);
			if(item['id']) currentAnchorPoint = item['id'];
		}
		this.currentArrIndex += len;
		if (this.$tplPostion.find(this.placeholderDiv).length > 0) {
			this.$tplPostion.find(this.placeholderDiv).remove();
		}
		this.$tplPostion.append(this.placeholderDiv);
		this.placeholderDiv.css('height', this.resultASTArr.length - this.currentArrIndex).appendTo(this.$tplPostion);
		if (this.$tplPostion[0].scrollHeight <= this.$tplPostion[0].clientHeight
			&& this.currentArrIndex < this.resultASTArr.length) {
			this.putDocument();
		}
		if(currentAnchorPoint){
			this.scrollAnchorPoint(currentAnchorPoint);
		}
	};
	// 一次性把tpl全部展示到界面中
	TplLoader.prototype.putAll = function () {
		this.putDocument(this.resultASTArr.length);
	};
	// 获取语法树
	TplLoader.prototype.getASTDOM = function (dom) {
		var arr = $.parseHTML(dom || this.sourceTpl) ;delete  this.sourceTpl;
		return this.arrToNodeList(arr);
	};
	// 数组转类数组
	TplLoader.prototype.arrToNodeList = function (arr) {
		var nodeList = {};
		for (var i = 0; i < arr.length; i++) {
			nodeList[i] = arr[i];
		}
		nodeList['length'] = i;
		return nodeList;
	};
	// 语法树转化为数组
	TplLoader.prototype.ASTDOM2Array = function (arr, parent) {
		for (var i = 0; i < arr.length; i++) {
			var item = arr[i];
			var emptyDom = item.childNodes.length > 0 ? item.cloneNode() : null;
				if (item.nodeType == 3) {/**  留下字符串  **/
					this.resultASTArr.push({
						'd': item,
						'p': parent,
						's': (item.textContent || item.nodeValue || item.data)});
				}
				else if (item.childNodes.length == 0) {/**  留下数组中的单个节点 **/
					this.resultASTArr.push({'d': item,'p': parent,'s': item.innerText});
				}else if (item.childNodes.length > 0) {/**  置空父节点并存放,递归子节点 **/
					var hasId = false;
					if (item.id 
						&& item.id.length > 0 
						&& item.className 
						&& (item.className.indexOf("left-content") >= 0 
							|| item.className.indexOf("title-text") >= 0)) {
						hasId = true;		
						this.domIdArr.push({id:[item.id],i:this.resultASTArr.length - 1});
					}
					this.resultASTArr.push({'d': emptyDom,'p': parent,'id':hasId ? item.id : false});
				}
			if (item.childNodes.length > 0) 
				this.ASTDOM2Array(item.childNodes, emptyDom);
		}
	};
})()