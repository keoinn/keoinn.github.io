document.addEventListener("DOMContentLoaded", function () {
  volantis.requestAnimationFrame(() => {
    VolantisApp.init();
    VolantisApp.subscribe();
    VolantisFancyBox.init();
    highlightKeyWords.startFromURL();
    locationHash();
  });
});

/* 錨點定位 */
const locationHash = () => {
  if (window.location.hash) {
    let locationID = decodeURI(window.location.hash.split('#')[1]).replace(/\ /g, '-');
    let target = document.getElementById(locationID);
    if (target) {
      setTimeout(() => {
        if (window.location.hash.startsWith('#fn')) { // hexo-reference https://github.com/volantis-x/hexo-theme-volantis/issues/647
          volantis.scroll.to(target, { addTop: - volantis.dom.header.offsetHeight - 5, behavior: 'instant', observer: true })
        } else {
          // 錨點中上半部有大片空白 高度大概是 volantis.dom.header.offsetHeight
          volantis.scroll.to(target, { addTop: 5, behavior: 'instant', observer: true })
        }
      }, 1000)
    }
  }
}
Object.freeze(locationHash);

/* Main */
const VolantisApp = (() => {
  const fn = {},
    COPYHTML = '<button class="btn-copy" data-clipboard-snippet=""><i class="fa-solid fa-copy"></i><span>COPY</span></button>';
  let scrollCorrection = 80;

  fn.init = () => {
    if (volantis.dom.header) {
      scrollCorrection = volantis.dom.header.clientHeight + 16;
    }

    window.onresize = () => {
      if (document.documentElement.clientWidth < 500) {
        volantis.isMobile = 1;
      } else {
        volantis.isMobile = 0;
      }
      if (volantis.isMobile != volantis.isMobileOld) {
        fn.setGlobalHeaderMenuEvent();
        fn.setHeader();
        fn.setHeaderSearch();
      }
    }
    volantis.scroll.push(fn.scrollEventCallBack, "scrollEventCallBack")
  }

  fn.event = () => {
    volantis.dom.$(document.getElementById("scroll-down"))?.on('click', function () {
      fn.scrolltoElement(volantis.dom.bodyAnchor);
    });

    // 如果 sidebar 為空，隱藏 sidebar。
    const sidebar = document.querySelector("#l_side")
    if (sidebar) {
      const sectionList = sidebar.querySelectorAll("section")
      if (!sectionList.length) {
        document.querySelector("#l_main").classList.add("no_sidebar")
      }
    }

    // 站點信息 最後活動日期
    if (volantis.GLOBAL_CONFIG.sidebar.for_page.includes('webinfo') || volantis.GLOBAL_CONFIG.sidebar.for_post.includes('webinfo')) {
      const lastupd = volantis.GLOBAL_CONFIG.sidebar.webinfo.lastupd;
      if (!!document.getElementById('last-update-show') && lastupd.enable && lastupd.friendlyShow) {
        document.getElementById('last-update-show').innerHTML = fn.utilTimeAgo(volantis.GLOBAL_CONFIG.lastupdate);
      }
    }

    // 站點信息 運行時間
    if (!!document.getElementById('webinfo-runtime-count')) {
      let BirthDay = new Date(volantis.GLOBAL_CONFIG.sidebar.webinfo.runtime.data);
      let timeold = (new Date().getTime() - BirthDay.getTime());
      let daysold = Math.floor(timeold / (24 * 60 * 60 * 1000));
      document.getElementById('webinfo-runtime-count').innerHTML = `${daysold} ${volantis.GLOBAL_CONFIG.sidebar.webinfo.runtime.unit}`;
    }

    // 消息提示 複製時彈出
    document.body.oncopy = function () {
      fn.messageCopyright()
    };
  }

  fn.restData = () => {
    scrollCorrection = volantis.dom.header ? volantis.dom.header.clientHeight + 16 : 80;
  }

  fn.setIsMobile = () => {
    if (document.documentElement.clientWidth < 500) {
      volantis.isMobile = 1;
      volantis.isMobileOld = 1;
    } else {
      volantis.isMobile = 0;
      volantis.isMobileOld = 0;
    }
  }

  // 校正頁面定位（被導航欄擋住的區域）
  fn.scrolltoElement = (elem, correction = scrollCorrection) => {
    volantis.scroll.to(elem, {
      top: elem.getBoundingClientRect().top + document.documentElement.scrollTop - correction
    })
  }

  // 滾動事件回調們
  fn.scrollEventCallBack = () => {
    // 【移動端 PC】//////////////////////////////////////////////////////////////////////

    // 顯示/隱藏 Header導航 topBtn 【移動端 PC】
    const showHeaderPoint = volantis.dom.bodyAnchor.offsetTop - scrollCorrection;
    const scrollTop = volantis.scroll.getScrollTop(); // 滾動條距離頂部的距離

    // topBtn
    if (volantis.dom.topBtn) {
      if (scrollTop > volantis.dom.bodyAnchor.offsetTop) {
        volantis.dom.topBtn.addClass('show');
        // 向上滾動高亮 topBtn
        if (volantis.scroll.del > 0) {
          volantis.dom.topBtn.removeClass('hl');
        } else {
          volantis.dom.topBtn.addClass('hl');
        }
      } else {
        volantis.dom.topBtn.removeClass('show').removeClass('hl');
      }
    }

    // Header導航
    if (volantis.dom.header) {
      if (scrollTop - showHeaderPoint > -1) {
        volantis.dom.header.addClass('show');
      } else {
        volantis.dom.header.removeClass('show');
      }
    }

    // 決定一二級導航欄的切換 【向上滾動切換為一級導航欄；向下滾動切換為二級導航欄】  【移動端 PC】
    if (pdata.ispage && volantis.dom.wrapper) {
      if (volantis.scroll.del > 0 && scrollTop > 100) { // 向下滾動
        volantis.dom.wrapper.addClass('sub'); // <---- 二級導航顯示
      } else if (volantis.scroll.del < 0) { // 向上滾動
        volantis.dom.wrapper.removeClass('sub'); // <---- 取消二級導航顯示 一級導航顯示
      }
    }

    // 【移動端】//////////////////////////////////////////////////////////////////////
    if (volantis.isMobile) {
      // 【移動端】 頁面滾動  隱藏 移動端toc目錄按鈕
      if (pdata.ispage && volantis.dom.tocTarget && volantis.dom.toc) {
        volantis.dom.tocTarget.removeClass('active');
        volantis.dom.toc.removeClass('active');
      }
      // 【移動端】 滾動時隱藏子選單
      if (volantis.dom.mPhoneList) {
        volantis.dom.mPhoneList.forEach(function (e) {
          volantis.dom.$(e).hide();
        })
      }
    }
  }

  // 設定滾動錨點
  fn.setScrollAnchor = () => {
    // click topBtn 滾動至bodyAnchor 【移動端 PC】
    if (volantis.dom.topBtn && volantis.dom.bodyAnchor) {
      volantis.dom.topBtn.click(e => {
        e.preventDefault();
        e.stopPropagation();
        fn.scrolltoElement(volantis.dom.bodyAnchor);
        e.stopImmediatePropagation();
      });
    }

  }

  // 設定導航欄
  fn.setHeader = () => {
    // !!! 此處的Dom對象需要重載 !!!
    if (!pdata.ispage) return;

    // 填充二級導航文章標題 【移動端 PC】
    volantis.dom.wrapper.find('.nav-sub .title').html(document.title.split(" - ")[0]);

    // ====== bind events to every btn =========
    // 評論按鈕 【移動端 PC】
    volantis.dom.comment = volantis.dom.$(document.getElementById("s-comment")); // 評論按鈕  桌面端 移動端
    volantis.dom.commentTarget = volantis.dom.$(document.querySelector('#l_main article#comments')); // 評論區域
    if (volantis.dom.commentTarget) {
      volantis.dom.comment.click(e => { // 評論按鈕點擊後 跳轉到評論區域
        e.preventDefault();
        e.stopPropagation();
        volantis.cleanContentVisibility();
        fn.scrolltoElement(volantis.dom.commentTarget);
        e.stopImmediatePropagation();
      });
    } else volantis.dom.comment.style.display = 'none'; // 關閉了評論，則隱藏評論按鈕

    // 移動端toc目錄按鈕 【移動端】
    if (volantis.isMobile) {
      volantis.dom.toc = volantis.dom.$(document.getElementById("s-toc")); // 目錄按鈕  僅移動端
      volantis.dom.tocTarget = volantis.dom.$(document.querySelector('#l_side .toc-wrapper')); // 側邊欄的目錄列表
      if (volantis.dom.tocTarget) {
        // 點擊移動端目錄按鈕 激活目錄按鈕 顯示側邊欄的目錄列表
        volantis.dom.toc.click((e) => {
          e.stopPropagation();
          volantis.dom.tocTarget.toggleClass('active');
          volantis.dom.toc.toggleClass('active');
        });
        // 點擊空白 隱藏
        volantis.dom.$(document).click(function (e) {
          e.stopPropagation();
          if (volantis.dom.tocTarget) {
            volantis.dom.tocTarget.removeClass('active');
          }
          volantis.dom.toc.removeClass('active');
        });
      } else if (volantis.dom.toc) volantis.dom.toc.style.display = 'none'; // 隱藏toc目錄按鈕
    }
  }

  // 設定導航欄選單選中狀態  【移動端 PC】
  fn.setHeaderMenuSelection = () => {
    // !!! 此處的Dom對象需要重載 !!!
    volantis.dom.headerMenu = volantis.dom.$(document.querySelectorAll('#l_header .navigation,#l_cover .navigation,#l_side .navigation')); // 導航列表

    // 先把已經激活的取消激活
    volantis.dom.headerMenu.forEach(element => {
      let li = volantis.dom.$(element).find('li a.active')
      if (li)
        li.removeClass('active')
      let div = volantis.dom.$(element).find('div a.active')
      if (div)
        div.removeClass('active')
    });

    // replace '%' '/' '.'
    var idname = location.pathname.replace(/\/|%|\./g, '');
    if (idname.length == 0) {
      idname = 'home';
    }
    var page = idname.match(/page\d{0,}$/g);
    if (page) {
      page = page[0];
      idname = idname.split(page)[0];
    }
    var index = idname.match(/index.html/);
    if (index) {
      index = index[0];
      idname = idname.split(index)[0];
    }
    // 轉義字符如 [, ], ~, #, @
    idname = idname.replace(/(\[|\]|~|#|@)/g, '\\$1');
    if (idname && volantis.dom.headerMenu) {
      volantis.dom.headerMenu.forEach(element => {
        // idname 不能為數字開頭, 加一個 action- 前綴
        let id = element.querySelector("[active-action=action-" + idname + "]")
        if (id) {
          volantis.dom.$(id).addClass('active')
        }
      });
    }
  }

  // 設定全局事件
  fn.setGlobalHeaderMenuEvent = () => {
    if (volantis.isMobile) {
      // 【移動端】 關閉已經展開的子選單 點擊展開子選單
      document.querySelectorAll('#l_header .m-phone li').forEach(function (e) {
        if (e.querySelector(".list-v")) {
          // 點擊選單
          volantis.dom.$(e).click(function (e) {
            e.stopPropagation();
            // 關閉已經展開的子選單
            e.currentTarget.parentElement.childNodes.forEach(function (e) {
              if (Object.prototype.toString.call(e) == '[object HTMLLIElement]') {
                e.childNodes.forEach(function (e) {
                  if (Object.prototype.toString.call(e) == '[object HTMLUListElement]') {
                    volantis.dom.$(e).hide()
                  }
                })
              }
            })
            // 點擊展開子選單
            let array = e.currentTarget.children
            for (let index = 0; index < array.length; index++) {
              const element = array[index];
              if (volantis.dom.$(element).title === 'menu') { // 移動端選單欄異常
                volantis.dom.$(element).display = "flex"      // https://github.com/volantis-x/hexo-theme-volantis/issues/706
              } else {
                volantis.dom.$(element).show()
              }
            }
          }, 0);
        }
      })
    } else {
      // 【PC端】 hover時展開子選單，點擊時[target.baseURI==origin時]隱藏子選單? 現有邏輯大部分情況不隱藏子選單
      document.querySelectorAll('#wrapper .m-pc li > a[href]').forEach(function (e) {
        volantis.dom.$(e.parentElement).click(function (e) {
          e.stopPropagation();
          if (e.target.origin == e.target.baseURI) {
            document.querySelectorAll('#wrapper .m-pc .list-v').forEach(function (e) {
              volantis.dom.$(e).hide(); // 大概率不會執行
            })
          }
        }, 0);
      })
    }
    fn.setPageHeaderMenuEvent();
  }

  // 【移動端】隱藏子選單
  fn.setPageHeaderMenuEvent = () => {
    if (!volantis.isMobile) return
    // 【移動端】 點擊空白處隱藏子選單
    volantis.dom.$(document).click(function (e) {
      volantis.dom.mPhoneList.forEach(function (e) {
        volantis.dom.$(e).hide();
      })
    });
  }

  // 設定導航欄搜索框 【移動端】
  fn.setHeaderSearch = () => {
    if (!volantis.isMobile) return;
    if (!volantis.dom.switcher) return;
    // 點擊移動端搜索按鈕
    volantis.dom.switcher.click(function (e) {
      e.stopPropagation();
      volantis.dom.header.toggleClass('z_search-open'); // 激活移動端搜索框
      volantis.dom.switcher.toggleClass('active'); // 移動端搜索按鈕
    });
    // 點擊空白取消激活
    volantis.dom.$(document).click(function (e) {
      volantis.dom.header.removeClass('z_search-open');
      volantis.dom.switcher.removeClass('active');
    });
    // 移動端點擊搜索框 停止事件傳播
    volantis.dom.search.click(function (e) {
      e.stopPropagation();
    });
  }

  // 設定 tabs 標籤  【移動端 PC】
  fn.setTabs = () => {
    let tabs = document.querySelectorAll('#l_main .tabs .nav-tabs')
    if (!tabs) return
    tabs.forEach(function (e) {
      e.querySelectorAll('a').forEach(function (e) {
        volantis.dom.$(e).on('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const $tab = volantis.dom.$(e.target.parentElement.parentElement.parentElement);
          $tab.find('.nav-tabs .active').removeClass('active');
          volantis.dom.$(e.target.parentElement).addClass('active');
          $tab.find('.tab-content .active').removeClass('active');
          $tab.find(e.target.className).addClass('active');
          return false;
        });
      })
    })
  }

  // hexo-reference 頁腳跳轉 https://github.com/volantis-x/hexo-theme-volantis/issues/647
  fn.footnotes = () => {
    let ref = document.querySelectorAll('#l_main .footnote-backref, #l_main .footnote-ref > a');
    ref.forEach(function (e, i) {
      ref[i].click = () => { }; // 強制清空原 click 事件
      volantis.dom.$(e).on('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        let targetID = decodeURI(e.target.hash.split('#')[1]).replace(/\ /g, '-');
        let target = document.getElementById(targetID);
        if (target) {
          volantis.scroll.to(target, { addTop: - volantis.dom.header.offsetHeight - 5, behavior: 'instant' })
        }
      });
    })
  }

  // 工具類：代碼塊複製
  fn.utilCopyCode = (Selector) => {
    document.querySelectorAll(Selector).forEach(node => {
      const test = node.insertAdjacentHTML("beforebegin", COPYHTML);
      const _BtnCopy = node.previousSibling;
      _BtnCopy.onclick = e => {
        e.stopPropagation();
        const _icon = _BtnCopy.querySelector('i');
        const _span = _BtnCopy.querySelector('span');

        node.focus();
        const range = new Range();
        range.selectNodeContents(node);
        document.getSelection().removeAllRanges();
        document.getSelection().addRange(range);

        const str = document.getSelection().toString();
        fn.utilWriteClipText(str).then(() => {
          fn.messageCopyright();
          _BtnCopy.classList.add('copied');
          _icon.classList.remove('fa-copy');
          _icon.classList.add('fa-check-circle');
          _span.innerText = "COPIED";
          setTimeout(() => {
            _icon.classList.remove('fa-check-circle');
            _icon.classList.add('fa-copy');
            _span.innerText = "COPY";
          }, 2000)
        }).catch(e => {
          VolantisApp.message('系統提示', e, {
            icon: 'fa fa-exclamation-circle red'
          });
          _BtnCopy.classList.add('copied-failed');
          _icon.classList.remove('fa-copy');
          _icon.classList.add('fa-exclamation-circle');
          _span.innerText = "COPY FAILED";
          setTimeout(() => {
            _icon.classList.remove('fa-exclamation-circle');
            _icon.classList.add('fa-copy');
            _span.innerText = "COPY";
          })
        })
      }
    });
  }

  // 工具類：複製字符串到剪貼簿
  fn.utilWriteClipText = (str) => {
    return navigator.clipboard
      .writeText(str)
      .then(() => {
        return Promise.resolve()
      })
      .catch(e => {
        const input = document.createElement('textarea');
        input.setAttribute('readonly', 'readonly');
        document.body.appendChild(input);
        input.innerHTML = str;
        input.select();
        try {
          let result = document.execCommand('copy')
          document.body.removeChild(input);
          if (!result || result === 'unsuccessful') {
            return Promise.reject('複製文字失敗!')
          } else {
            return Promise.resolve()
          }
        } catch (e) {
          document.body.removeChild(input);
          return Promise.reject(
            '當前瀏覽器不支援複製功能，請檢查更新或更換其他瀏覽器操作!'
          )
        }
      })
  }

  // 工具類：返回時間間隔
  fn.utilTimeAgo = (dateTimeStamp) => {
    const minute = 1e3 * 60, hour = minute * 60, day = hour * 24, week = day * 7, month = day * 30;
    const now = new Date().getTime();
    const diffValue = now - dateTimeStamp;
    const minC = diffValue / minute,
      hourC = diffValue / hour,
      dayC = diffValue / day,
      weekC = diffValue / week,
      monthC = diffValue / month;
    if (diffValue < 0) {
      result = ""
    } else if (monthC >= 1 && monthC < 7) {
      result = " " + parseInt(monthC) + " 月前"
    } else if (weekC >= 1 && weekC < 4) {
      result = " " + parseInt(weekC) + " 週前"
    } else if (dayC >= 1 && dayC < 7) {
      result = " " + parseInt(dayC) + " 天前"
    } else if (hourC >= 1 && hourC < 24) {
      result = " " + parseInt(hourC) + " 小時前"
    } else if (minC >= 1 && minC < 60) {
      result = " " + parseInt(minC) + " 分鐘前"
    } else if (diffValue >= 0 && diffValue <= minute) {
      result = "剛剛"
    } else {
      const datetime = new Date();
      datetime.setTime(dateTimeStamp);
      const Nyear = datetime.getFullYear();
      const Nmonth = datetime.getMonth() + 1 < 10 ? "0" + (datetime.getMonth() + 1) : datetime.getMonth() + 1;
      const Ndate = datetime.getDate() < 10 ? "0" + datetime.getDate() : datetime.getDate();
      const Nhour = datetime.getHours() < 10 ? "0" + datetime.getHours() : datetime.getHours();
      const Nminute = datetime.getMinutes() < 10 ? "0" + datetime.getMinutes() : datetime.getMinutes();
      const Nsecond = datetime.getSeconds() < 10 ? "0" + datetime.getSeconds() : datetime.getSeconds();
      result = Nyear + "-" + Nmonth + "-" + Ndate
    }
    return result;
  }

  // 消息提示：標準
  fn.message = (title, message, option = {}, done = null) => {
    if (typeof iziToast === "undefined") {
      volantis.css(volantis.GLOBAL_CONFIG.cdn.izitoast_css)
      volantis.js(volantis.GLOBAL_CONFIG.cdn.izitoast_js, () => {
        tozashMessage(title, message, option, done);
      });
    } else {
      tozashMessage(title, message, option, done);
    }
    function tozashMessage(title, message, option, done) {
      const {
        icon,
        time,
        position,
        transitionIn,
        transitionOut,
        messageColor,
        titleColor,
        backgroundColor,
        zindex,
        displayMode
      } = option;
      iziToast.show({
        layout: '2',
        icon: 'Fontawesome',
        closeOnEscape: 'true',
        displayMode: displayMode || 'replace',
        transitionIn: transitionIn || volantis.GLOBAL_CONFIG.plugins.message.transitionIn,
        transitionOut: transitionOut || volantis.GLOBAL_CONFIG.plugins.message.transitionOut,
        messageColor: messageColor || volantis.GLOBAL_CONFIG.plugins.message.messageColor,
        titleColor: titleColor || volantis.GLOBAL_CONFIG.plugins.message.titleColor,
        backgroundColor: backgroundColor || volantis.GLOBAL_CONFIG.plugins.message.backgroundColor,
        zindex: zindex || volantis.GLOBAL_CONFIG.plugins.message.zindex,
        icon: icon || volantis.GLOBAL_CONFIG.plugins.message.icon.default,
        timeout: time || volantis.GLOBAL_CONFIG.plugins.message.time.default,
        position: position || volantis.GLOBAL_CONFIG.plugins.message.position,
        title: title,
        message: message,
        onClosed: () => {
          if (done) done();
        },
      });
    }
  }

  // 消息提示：詢問
  fn.question = (title, message, option = {}, success = null, cancel = null, done = null) => {
    if (typeof iziToast === "undefined") {
      volantis.css(volantis.GLOBAL_CONFIG.cdn.izitoast_css)
      volantis.js(volantis.GLOBAL_CONFIG.cdn.izitoast_js, () => {
        tozashQuestion(title, message, option, success, cancel, done);
      });
    } else {
      tozashQuestion(title, message, option, success, cancel, done);
    }

    function tozashQuestion(title, message, option, success, cancel, done) {
      const {
        icon,
        time,
        position,
        transitionIn,
        transitionOut,
        messageColor,
        titleColor,
        backgroundColor,
        zindex
      } = option;
      iziToast.question({
        id: 'question',
        icon: 'Fontawesome',
        close: false,
        overlay: true,
        displayMode: 'once',
        position: 'center',
        messageColor: messageColor || volantis.GLOBAL_CONFIG.plugins.message.messageColor,
        titleColor: titleColor || volantis.GLOBAL_CONFIG.plugins.message.titleColor,
        backgroundColor: backgroundColor || volantis.GLOBAL_CONFIG.plugins.message.backgroundColor,
        zindex: zindex || volantis.GLOBAL_CONFIG.plugins.message.zindex,
        icon: icon || volantis.GLOBAL_CONFIG.plugins.message.icon.quection,
        timeout: time || volantis.GLOBAL_CONFIG.plugins.message.time.quection,
        title: title,
        message: message,
        buttons: [
          ['<button><b>是</b></button>', (instance, toast) => {
            instance.hide({ transitionOut: transitionOut || 'fadeOut' }, toast, 'button');
            if (success) success(instance, toast)
          }],
          ['<button><b>否</b></button>', (instance, toast) => {
            instance.hide({ transitionOut: transitionOut || 'fadeOut' }, toast, 'button');
            if (cancel) cancel(instance, toast)
          }]
        ],
        onClosed: (instance, toast, closedBy) => {
          if (done) done(instance, toast, closedBy);
        }
      });
    }
  }

  // 消息提示：隱藏
  fn.hideMessage = (done = null) => {
    const toast = document.querySelector('.iziToast');
    if (!toast) {
      if (done) done()
      return;
    }

    if (typeof iziToast === "undefined") {
      volantis.css(volantis.GLOBAL_CONFIG.cdn.izitoast_css)
      volantis.js(volantis.GLOBAL_CONFIG.cdn.izitoast_js, () => {
        hideMessage(done);
      });
    } else {
      hideMessage(done);
    }

    function hideMessage(done) {
      iziToast.hide({}, toast);
      if (done) done();
    }
  }

  // 消息提示：複製
  let messageCopyrightShow = 0;
  fn.messageCopyright = () => {
    // 消息提示 複製時彈出
    if (volantis.GLOBAL_CONFIG.plugins.message.enable
      && volantis.GLOBAL_CONFIG.plugins.message.copyright.enable
      && messageCopyrightShow < 1) {
      messageCopyrightShow++;
      VolantisApp.message(volantis.GLOBAL_CONFIG.plugins.message.copyright.title,
        volantis.GLOBAL_CONFIG.plugins.message.copyright.message, {
        icon: volantis.GLOBAL_CONFIG.plugins.message.copyright.icon,
        transitionIn: 'flipInX',
        transitionOut: 'flipOutX',
        displayMode: 1
      });
    }
  }

  return {
    init: () => {
      fn.init();
      fn.event();
    },
    subscribe: () => {
      fn.setIsMobile();
      fn.setHeader();
      fn.setHeaderMenuSelection();
      fn.setGlobalHeaderMenuEvent();
      fn.setHeaderSearch();
      fn.setScrollAnchor();
      fn.setTabs();
      fn.footnotes();
    },
    utilCopyCode: fn.utilCopyCode,
    utilWriteClipText: fn.utilWriteClipText,
    utilTimeAgo: fn.utilTimeAgo,
    message: fn.message,
    question: fn.question,
    hideMessage: fn.hideMessage,
    messageCopyright: fn.messageCopyright,
    scrolltoElement: fn.scrolltoElement
  }
})()
Object.freeze(VolantisApp);

/* FancyBox */
const VolantisFancyBox = (() => {
  const fn = {};

  fn.loadFancyBox = (done) => {
    volantis.css(volantis.GLOBAL_CONFIG.cdn.fancybox_css);
    volantis.js(volantis.GLOBAL_CONFIG.cdn.fancybox_js).then(() => {
      if (done) done();
    })
  }

  /**
   * 載入及處理
   * 
   * @param {*} checkMain 是否只處理文章區域的文章
   * @param {*} done      FancyBox 載入完成後的動作，預設執行分組綁定
   * @returns 
   */
  fn.init = (checkMain = true, done = fn.groupBind) => {
    if (!document.querySelector(".md .gallery img, .fancybox") && checkMain) return;
    if (typeof Fancybox === "undefined") {
      fn.loadFancyBox(done);
    } else {
      done();
    }
  }

  /**
   * 圖片元素預處理
   * 
   * @param {*} selectors 選擇器
   * @param {*} name      分組
   */
  fn.elementHandling = (selectors, name) => {
    const nodeList = document.querySelectorAll(selectors);
    nodeList.forEach($item => {
      if ($item.hasAttribute('fancybox')) return;
      $item.setAttribute('fancybox', '');
      const $link = document.createElement('a');
      $link.setAttribute('href', $item.src);
      $link.setAttribute('data-caption', $item.alt);
      $link.setAttribute('data-fancybox', name);
      $link.classList.add('fancybox');
      $link.append($item.cloneNode());
      $item.replaceWith($link);
    })
  }

  /**
   * 原生綁定
   * 
   * @param {*} selectors 選擇器
   */
  fn.bind = (selectors) => {
    fn.init(false, () => {
      Fancybox.bind(selectors, {
        groupAll: true,
        Hash: false,
        hideScrollbar: false,
        Thumbs: {
          autoStart: false,
        },
        caption: function (fancybox, slide) {
          return slide.thumbEl?.alt || "";
        }
      });
    });
  }

  /**
   * 分組綁定
   * 
   * @param {*} groupName 分組名稱
   */
  fn.groupBind = (groupName = null) => {
    const group = new Set();

    document.querySelectorAll(".gallery").forEach(ele => {
      if (ele.querySelector("img")) {
        group.add(ele.getAttribute('data-group') || 'default');
      }
    })

    if (!!groupName) group.add(groupName);

    for (const iterator of group) {
      Fancybox.unbind('[data-fancybox="' + iterator + '"]');
      Fancybox.bind('[data-fancybox="' + iterator + '"]', {
        Hash: false,
        hideScrollbar: false,
        Thumbs: {
          autoStart: false,
        }
      });
    }
  }

  return {
    init: fn.init,
    bind: fn.bind,
    groupBind: (selectors, groupName = 'default') => {
      try {
        fn.elementHandling(selectors, groupName);
        fn.init(false, () => {
          fn.groupBind(groupName)
        });
      } catch (error) {
        console.error(error)
      }
    }
  }
})()
Object.freeze(VolantisFancyBox);

// highlightKeyWords 與 搜索功能搭配 https://github.com/next-theme/hexo-theme-next/blob/eb194a7258058302baf59f02d4b80b6655338b01/source/js/third-party/search/local-search.js
// Question: 錨點穩定性未知
// ToDo: 查找模式
// 0. (/////////要知道瀏覽器自帶全頁面查找功能 CTRL + F)
// 1. 右鍵開啟查找模式 / 導航欄選單開啟?? / CTRL + F ???
// 2. 查找模式面板 (可拖動? or 固定?)
// 3. keyword mark id 從 0 開始編號 查找下一處 highlightKeyWords.scrollToNextHighlightKeywordMark() 查找上一處 scrollToPrevHighlightKeywordMark() 循環查找(取模%)
// 4. 可輸入修改 查找關鍵詞 keywords(type:list)
// 5. 區分大小寫 caseSensitive (/ 全字匹配?? / 正則匹配??)
// 6. 在選定區域中查找 querySelector ??
// 7. 關閉查找模式
// 8. 搜索跳轉 (URL 入口) 自動開啟查找模式 調用 scrollToNextHighlightKeywordMark()
const highlightKeyWords = (() => {
  let fn = {}
  fn.markNum = 0
  fn.markNextId = -1
  fn.startFromURL = () => {
    const params = decodeURI(new URL(location.href).searchParams.get('keyword'));
    const keywords = params ? params.split(' ') : [];
    const post = document.querySelector('#l_main');
    if (keywords.length == 1 && keywords[0] == "null") {
      return;
    }
    fn.start(keywords, post); // 渲染耗時較長
    fn.scrollToFirstHighlightKeywordMark()
  }
  fn.scrollToFirstHighlightKeywordMark = () => {
    volantis.cleanContentVisibility();
    let target = fn.scrollToNextHighlightKeywordMark("0");
    if (!target) {
      volantis.requestAnimationFrame(fn.scrollToFirstHighlightKeywordMark)
    }
  }
  fn.scrollToNextHighlightKeywordMark = (id) => {
    // Next Id
    let input = id || (fn.markNextId + 1) % fn.markNum;
    fn.markNextId = parseInt(input)
    let target = document.getElementById("keyword-mark-" + fn.markNextId);
    if (!target) {
      fn.markNextId = (fn.markNextId + 1) % fn.markNum;
      target = document.getElementById("keyword-mark-" + fn.markNextId);
    }
    if (target) {
      volantis.scroll.to(target, { addTop: - volantis.dom.header.offsetHeight - 5, behavior: 'instant' })
    }
    // Current target
    return target
  }
  fn.scrollToPrevHighlightKeywordMark = (id) => {
    // Prev Id
    let input = id || (fn.markNextId - 1 + fn.markNum) % fn.markNum;
    fn.markNextId = parseInt(input)
    let target = document.getElementById("keyword-mark-" + fn.markNextId);
    if (!target) {
      fn.markNextId = (fn.markNextId - 1 + fn.markNum) % fn.markNum;
      target = document.getElementById("keyword-mark-" + fn.markNextId);
    }
    if (target) {
      volantis.scroll.to(target, { addTop: - volantis.dom.header.offsetHeight - 5, behavior: 'instant' })
    }
    // Current target
    return target
  }
  fn.start = (keywords, querySelector) => {
    fn.markNum = 0
    if (!keywords.length || !querySelector || (keywords.length == 1 && keywords[0] == "null")) return;
    console.log(keywords);
    const walk = document.createTreeWalker(querySelector, NodeFilter.SHOW_TEXT, null);
    const allNodes = [];
    while (walk.nextNode()) {
      if (!walk.currentNode.parentNode.matches('button, select, textarea')) allNodes.push(walk.currentNode);
    }
    allNodes.forEach(node => {
      const [indexOfNode] = fn.getIndexByWord(keywords, node.nodeValue);
      if (!indexOfNode.length) return;
      const slice = fn.mergeIntoSlice(0, node.nodeValue.length, indexOfNode);
      fn.highlightText(node, slice, 'keyword');
      fn.highlightStyle()
    });
  }
  fn.getIndexByWord = (words, text, caseSensitive = false) => {
    const index = [];
    const included = new Set();
    words.forEach(word => {
      const div = document.createElement('div');
      div.innerText = word;
      word = div.innerHTML;

      const wordLen = word.length;
      if (wordLen === 0) return;
      let startPosition = 0;
      let position = -1;
      if (!caseSensitive) {
        text = text.toLowerCase();
        word = word.toLowerCase();
      }
      while ((position = text.indexOf(word, startPosition)) > -1) {
        index.push({ position, word });
        included.add(word);
        startPosition = position + wordLen;
      }
    });
    index.sort((left, right) => {
      if (left.position !== right.position) {
        return left.position - right.position;
      }
      return right.word.length - left.word.length;
    });
    return [index, included];
  };
  fn.mergeIntoSlice = (start, end, index) => {
    let item = index[0];
    let { position, word } = item;
    const hits = [];
    const count = new Set();
    while (position + word.length <= end && index.length !== 0) {
      count.add(word);
      hits.push({
        position,
        length: word.length
      });
      const wordEnd = position + word.length;

      index.shift();
      while (index.length !== 0) {
        item = index[0];
        position = item.position;
        word = item.word;
        if (wordEnd > position) {
          index.shift();
        } else {
          break;
        }
      }
    }
    return {
      hits,
      start,
      end,
      count: count.size
    };
  };
  fn.highlightText = (node, slice, className) => {
    const val = node.nodeValue;
    let index = slice.start;
    const children = [];
    for (const { position, length } of slice.hits) {
      const text = document.createTextNode(val.substring(index, position));
      index = position + length;
      let mark = document.createElement('mark');
      mark.className = className;
      mark = fn.highlightStyle(mark)
      mark.appendChild(document.createTextNode(val.substr(position, length)));
      children.push(text, mark);
    }
    node.nodeValue = val.substring(index, slice.end);
    children.forEach(element => {
      node.parentNode.insertBefore(element, node);
    });
  }
  fn.highlightStyle = (mark) => {
    if (!mark) return;
    mark.id = "keyword-mark-" + fn.markNum;
    fn.markNum++;
    mark.style.background = "transparent";
    mark.style["border-bottom"] = "1px dashed #ff2a2a";
    mark.style["color"] = "#ff2a2a";
    mark.style["font-weight"] = "bold";
    return mark
  }
  fn.cleanHighlightStyle = () => {
    document.querySelectorAll(".keyword").forEach(mark => {
      mark.style.background = "transparent";
      mark.style["border-bottom"] = null;
      mark.style["color"] = null;
      mark.style["font-weight"] = null;
    })
  }
  return {
    start: (keywords, querySelector) => {
      fn.start(keywords, querySelector)
    },
    startFromURL: () => {
      fn.startFromURL()
    },
    scrollToNextHighlightKeywordMark: (id) => {
      fn.scrollToNextHighlightKeywordMark(id)
    },
    scrollToPrevHighlightKeywordMark: (id) => {
      fn.scrollToPrevHighlightKeywordMark(id)
    },
    cleanHighlightStyle: () => {
      fn.cleanHighlightStyle()
    },
  }
})()
Object.freeze(highlightKeyWords);

/* DOM 控制 */
const DOMController = {
  /**
   * 控制元素顯隱
   */
  visible: (ele, type = true) => {
    if (ele) ele.style.display = type === true ? 'block' : 'none';
  },

  /**
   * 移除元素
   */
  remove: (param) => {
    const node = document.querySelectorAll(param);
    node.forEach(ele => {
      ele.remove();
    })
  },

  removeList: (list) => {
    list.forEach(param => {
      DOMController.remove(param)
    })
  },

  /**
   * 設定屬性
   */
  setAttribute: (param, attrName, attrValue) => {
    const node = document.querySelectorAll(param);
    node.forEach(ele => {
      ele.setAttribute(attrName, attrValue)
    })
  },

  setAttributeList: (list) => {
    list.forEach(item => {
      DOMController.setAttribute(item[0], item[1], item[2])
    })
  },

  /**
   * 設定樣式
   */
  setStyle: (param, styleName, styleValue) => {
    const node = document.querySelectorAll(param);
    node.forEach(ele => {
      ele.style[styleName] = styleValue;
    })
  },

  setStyleList: (list) => {
    list.forEach(item => {
      DOMController.setStyle(item[0], item[1], item[2])
    })
  },

  fadeIn: (e) => {
    if (!e) return;
    e.style.visibility = "visible";
    e.style.opacity = 1;
    e.style.display = "block";
    e.style.transition = "all 0.5s linear";
    return e
  },

  fadeOut: (e) => {
    if (!e) return;
    e.style.visibility = "hidden";
    e.style.opacity = 0;
    e.style.display = "none";
    e.style.transition = "all 0.5s linear";
    return e
  },

  fadeToggle: (e) => {
    if (!e) return;
    if (e.style.visibility == "hidden") {
      e = DOMController.fadeIn(e)
    } else {
      e = DOMController.fadeOut(e)
    }
    return e
  },

  fadeToggleList: (list) => {
    list.forEach(param => {
      DOMController.fadeToggle(param)
    })
  },

  hasClass: (e, c) => {
    if (!e) return;
    return e.className.match(new RegExp('(\\s|^)' + c + '(\\s|$)'));
  },

  addClass: (e, c) => {
    if (!e) return;
    e.classList.add(c);
    return e
  },

  removeClass: (e, c) => {
    if (!e) return;
    e.classList.remove(c);
    return e
  },

  toggleClass: (e, c) => {
    if (!e) return;
    if (DOMController.hasClass(e, c)) {
      DOMController.removeClass(e, c)
    } else {
      DOMController.addClass(e, c)
    }
    return e
  },

  toggleClassList: (list) => {
    list.forEach(item => {
      DOMController.toggleClass(item[0], item[1])
    })
  }
}
Object.freeze(DOMController);

const VolantisRequest = {
  timeoutFetch: (url, ms, requestInit) => {
    const controller = new AbortController()
    requestInit.signal?.addEventListener('abort', () => controller.abort())
    let promise = fetch(url, { ...requestInit, signal: controller.signal })
    if (ms > 0) {
      const timer = setTimeout(() => controller.abort(), ms)
      promise.finally(() => { clearTimeout(timer) })
    }
    promise = promise.catch((err) => {
      throw ((err || {}).name === 'AbortError') ? new Error(`Fetch timeout: ${url}`) : err
    })
    return promise
  },

  Fetch: async (url, requestInit, timeout = 15000) => {
    const resp = await VolantisRequest.timeoutFetch(url, timeout, requestInit);
    if (!resp.ok) throw new Error(`Fetch error: ${url} | ${resp.status}`);
    let json = await resp.json()
    if (!json.success) throw json
    return json
  },

  POST: async (url, data) => {
    const requestInit = {
      method: 'POST',
    }
    if (data) {
      const formData = new FormData();
      Object.keys(data).forEach(key => formData.append(key, String(data[key])))
      requestInit.body = formData;
    }
    const json = await VolantisRequest.Fetch(url, requestInit)
    return json.data;
  },

  Get: async (url, data) => {
    const json = await VolantisRequest.Fetch(url + (data ? (`?${new URLSearchParams(data)}`) : ''), {
      method: 'GET'
    })
  }
}
Object.freeze(VolantisRequest);
