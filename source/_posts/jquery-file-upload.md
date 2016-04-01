---
title: jquery-file-upload异步图片上传使用总结
date: 2016-03-31 15:59:45
tags: [jquery-file-upload]
description: jquery,jquery-file-upload,jqueryfileupload,jquery图片上传插件,异步图片上传
---

jquery-file-upload是一个比较出色的jquery文件上传插件([官网][4])  
本文主要讲述笔者在桌面浏览器端的一些使用经验：  
<!-- more -->
## 浏览器兼容性  
Google Chrome  
Apple Safari 4.0+  
Mozilla Firefox 3.0+  
Opera 11.0+  
Microsoft Internet Explorer 6.0+  
  

就上面看浏览器兼容性不错  
但笔者开发要求适配IE8+和其他现代浏览器  

## 插件依赖  
[jQuery v. 1.6+][1]  
[jQuery UI widget factory v. 1.9+ (包括)][2]  
[jQuery Iframe Transport plugin (包括)][3]  
  
当然还有其他一些可选依赖，没用到不做阐述  
## 使用  
在浏览器上进行文件上传，当然要用到input标签啦  

    <input type="file" name="XXX" multiple="multiple" accept="image/jpg..."/>  
(后面的inputDom都用此标签代指)  
type不用说啦  
name属性作为文件上传后端接收的参数名  
multiple属性表示是否在文件选择窗口中可以同时选择多个文件  
accept表示限定文件选择窗口中出现的文件类型，方便过滤需要的文件  
### 初始化插件    
    var options={
		url:xxx,//服务器的图片上传接口地址
		acceptFileTypes:/\.(?:gif|jpe?g|png)$/i,//上传文件限制类型
		maxFileSize：2*1024*1024,//上传文件限制大小
		dropZone:null,//笔者自己定制了拖拽区域，故此为null
		dataType:'json',//在使用ajax上传图片成功后后端返回图片在服务器上的访问地址json数据  
		redirect:path+'result.html?%s'//在不支持ajax上传文件的浏览器上使用表单提交和重定向iframe配合实现上传图片
	};  
	$(inputDom).fileupload(options);

支持ajax level2的浏览器上传图片很方便，没烦恼，嘿嘿！

IE10-只能使用iframe重定向方式上传图片，前面option说到的redirect配置就很重要了  
redirect域必须与你jquery.fileupload.js所访问的域一致，如果不一致就会导致插件无法正确获取服务器在成功上传图片后返回的img url json数据  
  
当然服务器也是要做些处理的，插件如果使用iframe方式上传图片的话，后端会接收到前端options配置的redirect参数，一旦接到redirect参数，服务器端处理好的json就不能直接用application/json形式返回json数据，转而必须将处理好的json数据拼在前端传的redirect地址后面替换%s，然后重定向到拼好json的redirect地址中去  

大家肯定想问前端还要怎么处理，前端就不用处理啦！O(∩_∩)O~~  

关于其中实现的一些机制，大家可以看下插件当中的result.html文件，插件内部会将iframe redirect url后面拼好的json string取到iframe body内部，再从body内部拿出来解析成js对象供用户使用
### 绑定插件上传图片事件  
插件中的事件有很多，我这只说说一般要用到的  
  fileuploadsend  //图片上传前的校验回调函数  
  fileuploadprogressall  //图片上传中回调函数  
  fileuploaddone  //图片上传成功后回调函数  
使用方式：  

    $(inputDom).fileupload(options).bind('fileuploadsend',function(e,data){
		var file=data.files[0];//上传的图片文件对象
		//return false;当前图片上传请求会中断
	}).bind('fileuploadprogressall',function(e,data){
		//可以设置一些加载中的效果
	}).bind('fileuploaddone',function(e,data){
		// var json=data.result;//图片上传成功后返回的json数据
	});

当然还有另外一种绑定事件方式，就是写在插件配置的options对象里  
### 编程式上传图片  
有些场景不知道大家考虑过没有，比如在浏览器支持拖拽本地图片文件和粘贴剪切板图片时，这些时候怎么上传图片呢？(查询支持拖拽和粘贴事件的浏览器可访问[caniuse官网][5])  

在支持drop事件的浏览器中，用户拖拽图片文件进入浏览器事件绑定dom区域会触发drop事件，drop事件的handler回调函数的event参数会接收到用户拖拽的图片列表，获取方式如下：  

    var fileList=event.dataTransfer.files;  
  
在支持paste事件的浏览器中，用户在对应的事件绑定dom上右键选择粘贴(ctrl+v)后会触发paste事件，paste事件的handler回调函数的event参数会读取到剪切板中的信息，当然我们得判断一下是不是我们需要的图片信息：  

    var cdItems=event.clipboardData&&event.clipboardData.items&& event.clipboardData.items.length===1&&/^image\//.test(event.clipboardData.items[0].type)?event.clipboardData.items:null;  
	/*
	*  cdItems就是我们的图片文件列表数据，但是我们不能直接使用
	*  因为后端识别不了这种DataTransferItem数据结构，我们必须处理成Blob类型数据
	*/
	var cdBlob=cdItems[0].getAsFile();
	/*
	*  设置一个name属性，插件需要把其当做文件名称，如不设置，后端会收到名称为undefined的 
	*  图片数据，可能会影响后端相关校验
	*/  
	cdBlob['name']='image_'+new Date().getTime()+'.'+cdItem[0].type.replace('image/','');  
	var fileList=[cdBlob];

好了，待上传的图片文件列表准备完毕，接下来就是进行上传操作：  

	var $input=$(inputDom);
    $input.fileupload(options)//初始化插件  
	.bind('fileuploadsend',fn1).bind('fileuploadprogressall',fn2).bind('fileuploaddone',fn3);//绑定上传相关事件
	//上传单个图片文件列表
	$input.fileupload('send',{files:fileList});
	//上传多个图片文件列表
	$input.fileupload('add',{files:fileList});

一般使用add方法即可，插件会逐次上传每个图片文件  
## 最后  
jquery-file-upload插件功能非常强大，插件中还有很多有用的可选配置和事件绑定本文没有阐述，其他一些拓展插件更能对本插件的功能锦上添花，有需要的开发者可以根据需求自行选择  

在此也推荐一款国内比较优秀的图片上传插件[webuploader][6]

[1]: http://jquery.com/
[2]: http://api.jqueryui.com/jQuery.widget/  
[3]: https://github.com/blueimp/jQuery-File-Upload/blob/master/js/jquery.iframe-transport.js  
[4]: https://github.com/blueimp/jQuery-File-Upload/wiki
[5]: http://caniuse.com
[6]: http://fex.baidu.com/webuploader/


  
