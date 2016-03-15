/**
 * Created by qiwenshi on 2016/3/15.
 */
var fs=require('hexo-fs');
var path=require('path');
fs.readFile('source/_posts/hello-world.md',function(err,data){
    console.log(data);
});