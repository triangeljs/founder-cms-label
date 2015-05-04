define(function (require, exports, module) {
  'use strict';

  var CommandManager = brackets.getModule('command/CommandManager'),
      Menus = brackets.getModule('command/Menus'),
      EditorManager = brackets.getModule('editor/EditorManager'),
      Dialogs = brackets.getModule('widgets/Dialogs');
  
  function InsertSingleNode() {
    var template = require('text!label/SingleNode.html');
    var rendered = Mustache.render(template, {target: '_blank', nodeid: '', szinfo: '', tag: ''});
    AdvInsert(rendered);
  }

  function InsertAdvTitleList() {
    var template = require('text!label/AdvTitleList.html');
    var rendered = Mustache.render(template, {nodeid: '', attr: '', comstring: '', dayspan: '0'});
    AdvInsert(rendered);
  }

  function InsertAdvContent() {
    var template = require('text!label/AdvContent.html');
    var rendered = Mustache.render(template, {comstring: '', lastpage: '', nextpage: ''});
    AdvInsert(rendered);
  }
  
  function InsertAdvTitleListPage() {
    var template = require('text!label/AdvTitleListPage.html');
    var rendered = Mustache.render(template, {comstring: '', lastpage: '', nextpage: '', spanmode: '0', dayspan: '0'});
    AdvInsert(rendered);
  }

  // 插入方正标签
  function AdvInsert(str) {
    var editor = EditorManager.getCurrentFullEditor();
    if (editor) {
      var insertionText = editor.getSelectedText();
      // 获取光标位置，格式为：CodeMirror.Pos {line: 16, ch: 7}
      var insertionPos = editor.getCursorPos();
      if(insertionText == '></' || insertionText == '--></') {
        insertionPos.ch = insertionPos.ch - 2;
      }
      if(insertionText == '--><!--') {
        insertionPos.ch = insertionPos.ch - 4;
      }
      // 在光标后面插入方正标签
      editor.document.replaceRange(str, insertionPos);
    }
  }

  // 处理方正标签分发
  function AdvEditor() {
    var editor = EditorManager.getCurrentFullEditor(),
        insertionText = editor.getSelectedText(),
        ptn = new RegExp('^<!--webbot([\\s\\S]*?)i-checksum="0" -->$'),
        isState = ptn.test(insertionText);
    if (editor && isState) {
      var founderIndo = getFounderData(insertionText);
      switch(founderIndo['bot']) {
        case 'SingleNode':
          singleNode(founderIndo);
          break;
        case 'AdvTitleList':
          advTitleList(founderIndo);
          break;
        case 'AdvContent':
          advContent(founderIndo);
          break;
        case 'AdvTitleListPage':
          advTitleListPage(founderIndo);
          break;
      }
    }
  }
  
  // 单个栏目编辑
  function singleNode(data) {
    var editor = EditorManager.getCurrentFullEditor(),
        modal = require('text!html/SingleNode.html');
    var getSelections = editor.getSelections(),
        convertToLineSelections = editor.convertToLineSelections(getSelections);
    var start = convertToLineSelections[0].selectionsToTrack[0].start;
    var end = convertToLineSelections[0].selectionsToTrack[0].end;
    var ptn = new RegExp('#TARGET:(.*)', 'g');
    data['target'] = ptn.exec(data.style)[1];
    data['szinfo'] = html_decode(data.szinfo);
    
    Dialogs.showModalDialogUsingTemplate(Mustache.render(modal, data));
    
    $('#szinfoSelect').val(html_decode(data['szinfo'])).on('click',function() {
      var curVal = $(this).val();
      $('#szinfo').val(curVal);
    });
    $('#targetSelect').val(data['target']).on('click',function() {
      var curVal = $(this).val();
      $('#target').val(curVal);
    });
    $('#templates_modalBtn').one('click',function() {
      var dataObj = {
        target: $('#target').val(),
        nodeid: $('#nodeid').val(),
        szinfo: html_encode($('#szinfo').val())
      }
      var template = require('text!label/SingleNode.html');
      var rendered = Mustache.render(template, dataObj);
      editor.document.replaceRange(rendered, start, end);
    })
  }
  
  // 标题列表编辑
  function advTitleList(data) {
    var editor = EditorManager.getCurrentFullEditor(),
        modal = require('text!html/AdvTitleList.html');
    var getSelections = editor.getSelections(),
        convertToLineSelections = editor.convertToLineSelections(getSelections);
    var start = convertToLineSelections[0].selectionsToTrack[0].start;
    var end = convertToLineSelections[0].selectionsToTrack[0].end;
    
    // 稿件属性
    var ptn = new RegExp('\\+\\d+', 'g');
    var attrs = data.attr.match(ptn);
    for(var k in attrs) {
      if(attrs[k] == '+61') {
        data['attr_61'] = 'checked';
      }
      if(attrs[k] == '+62') {
        data['attr_62'] = 'checked';
      }
      if(attrs[k] == '+63') {
        data['attr_63'] = 'checked';
      }
      if(attrs[k] == '+64') {
        data['attr_64'] = 'checked';
      }
      if(attrs[k] == '+65') {
        data['attr_65'] = 'checked';
      }
    }
    data['comstring'] = html_decode(data.comstring);
    
    Dialogs.showModalDialogUsingTemplate(Mustache.render(modal, data));
    
    $('#selectTag span').on('click',function() {
      var strStart = $(this).data('start');
      var strEnd = $(this).data('end');
      setTextarea(strStart, strEnd);
    });
    $('#templates_modalBtn').one('click',function() {
      var sttrValue = [];
      $('input[name="attr"]:checked').each(function() {
        sttrValue.push($(this).val());
      });
      
      var dataObj = {
        nodeid: $('#nodeid').val(),
        attr: sttrValue.join(''),
        dayspan: $('#dayspan').val(),
        comstring: html_encode($('#contentBox').val())
      }
      var template = require('text!label/AdvTitleList.html');
      var rendered = Mustache.render(template, dataObj);
      editor.document.replaceRange(rendered, start, end);
    });
  }
  
  // 分页标题列表编辑
  function advTitleListPage(data) {
    var editor = EditorManager.getCurrentFullEditor(),
        modal = require('text!html/AdvTitleListPage.html');
    var getSelections = editor.getSelections(),
        convertToLineSelections = editor.convertToLineSelections(getSelections);
    var start = convertToLineSelections[0].selectionsToTrack[0].start;
    var end = convertToLineSelections[0].selectionsToTrack[0].end;
    
    // 稿件属性
    var ptn = new RegExp('\\+\\d+', 'g');
    var attrs = data.attr.match(ptn);
    for(var k in attrs) {
      if(attrs[k] == '+61') {
        data['attr_61'] = 'checked';
      }
      if(attrs[k] == '+62') {
        data['attr_62'] = 'checked';
      }
      if(attrs[k] == '+63') {
        data['attr_63'] = 'checked';
      }
      if(attrs[k] == '+64') {
        data['attr_64'] = 'checked';
      }
      if(attrs[k] == '+65') {
        data['attr_65'] = 'checked';
      }
    }
    data['comstring'] = html_decode(data.comstring);
    
    Dialogs.showModalDialogUsingTemplate(Mustache.render(modal, data));
    
    $('#selectTag span').on('click',function() {
      var strStart = $(this).data('start');
      var strEnd = $(this).data('end');
      setTextarea(strStart, strEnd);
    });
    $('#templates_modalBtn').one('click',function() {
      var sttrValue = [];
      $('input[name="attr"]:checked').each(function() {
        sttrValue.push($(this).val());
      });
      
      var dataObj = {
        nodeid: $('#nodeid').val(),
        attr: sttrValue.join(''),
        spanmode: $('#spanmode').val(),
        dayspan: $('#dayspan').val(),
        lastpage: $('#lastpage').val(),
        nextpage: $('#nextpage').val(),
        comstring: html_encode($('#contentBox').val())
      }
      var template = require('text!label/AdvTitleListPage.html');
      var rendered = Mustache.render(template, dataObj);
      editor.document.replaceRange(rendered, start, end);
    });
  }
  
  // 文章内容编辑
  function advContent(data) {
    var editor = EditorManager.getCurrentFullEditor(),
        modal = require('text!html/AdvContent.html');
    var getSelections = editor.getSelections(),
        convertToLineSelections = editor.convertToLineSelections(getSelections);
    var start = convertToLineSelections[0].selectionsToTrack[0].start;
    var end = convertToLineSelections[0].selectionsToTrack[0].end;
    data['comstring'] = html_decode(data.comstring);
    
    Dialogs.showModalDialogUsingTemplate(Mustache.render(modal, data));
    
    $('#selectTag span').on('click',function() {
      var strStart = $(this).data('start');
      var strEnd = $(this).data('end');
      setTextarea(strStart, strEnd);
    });
    $('#templates_modalBtn').one('click',function() {
      var dataObj = {
        lastpage: $('#lastpage').val(),
        nextpage: $('#nextpage').val(),
        comstring: html_encode($('#contentBox').val())
      }
      var template = require('text!label/AdvContent.html');
      var rendered = Mustache.render(template, dataObj);
      editor.document.replaceRange(rendered, start, end);
    });
  }
  
  // 获取方正标签数据
  function getFounderData(str) {
    var ptn = new RegExp('([a-zA-Z-]*?="[\\s\\S]*?")', 'g');
    var ptn_attr = new RegExp('([^=]*?)="([\\s\\S]*?)"');
    var arr = str.match(ptn);
    var founder_tag_attr = {};
    var digest_arr;
    for(var i in arr) {
      digest_arr = arr[i].match(ptn_attr);
      founder_tag_attr[digest_arr[1]] = digest_arr[2];
    }
    return founder_tag_attr;
  }
  
  // 标题列表和分页标题列表内容的编辑
  function setTextarea(startText,endText) {
    if(!startText) startText = '';
    if(!endText) endText = '';
    var obj = document.getElementById('contentBox');
    obj.focus();
    var start = obj.selectionStart;
    var end = obj.selectionEnd;
    var selectionText = obj.value.substring(start, end);
    var a = obj.value.substring(0,start);
    var b = obj.value.substr(end);
    var tag = startText + selectionText + endText;
    window.getSelection().deleteFromDocument();
    obj.value = a + tag + b;
  }
  
  // 内容编码
  function html_encode(str) {
    var s = str;
    if (s.length == 0) {
      return "";
    }
    s = s.replace(/&/g, "&amp;");
    s = s.replace(/</g, "&lt;");
    s = s.replace(/>/g, "&gt;");
    s = s.replace(/"/g, "#enpquot#");
    return s;
  }
  
  // 内容解码
  function html_decode(str) {
    var s = str;
    if (s.length == 0) {
      return "";
    }
    s = s.replace(/&amp;/g, "&");
    s = s.replace(/&lt;/g, "<");
    s = s.replace(/&gt;/g, ">");
    s = s.replace(/#enpquot#/g, '"');
    return s;
  }
  
  EditorManager.registerInlineEditProvider(AdvEditor);
  // 注册命令
  CommandManager.register('单个栏目_方正翔宇插件', 'SingleNode', InsertSingleNode);
  CommandManager.register('标题列表_方正翔宇插件', 'AdvTitleList', InsertAdvTitleList);
  CommandManager.register('分页标题列表_方正翔宇插件', 'AdvTitleListPage', InsertAdvTitleListPage);
  CommandManager.register('文章内容_方正翔宇插件', 'AdvContent', InsertAdvContent);
  CommandManager.register('编辑_方正翔宇插件', 'AdvEditor', AdvEditor);
  // 文本编辑区域的右键菜单对象
  var contextMenu = Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU);
  // 把命令添加到菜单去
  contextMenu.addMenuItem('SingleNode');
  contextMenu.addMenuItem('AdvTitleList');
  contextMenu.addMenuItem('AdvTitleListPage');
  contextMenu.addMenuItem('AdvContent');
  contextMenu.addMenuItem('AdvEditor');
});