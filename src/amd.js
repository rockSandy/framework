/**
 * an simple amd loader
 *
 * default config
 * AMD_CONFIG  = {
 *     root : './'
 * }
 */
;(function(global){
    var $d  = global.document;
    var $a ;
    
    var modules = {};
    var caches  = [];
    var root    = ''; 
    var mgrid   = 0;
    var currPath = '';

    function isFunc(v){
        return typeof v == 'function';
    }
    function isArray(v){
        return Array.isArray(v);
    }
    function getPath(url){
        if(!$a){ $a = $d.createElement('a'); }
        $a.href = url;
        return $a.pathname;
    }
    function isAmd(url){
        var p = getPath(url);
        if(p.indexOf('.js')>-1){ 
             return false;
        }
        return true;
    }

    function execFactory(id){
        var mod = modules[id];
        if('value' in mod){ return mod.value }
        var factory = mod.factory;
        if(!isFunc(factory)){ //define({ a : 1})
            modules[id].value = factory;
            return factory;
        }
        var deps    = mod.deps;
        if(deps.length){
            var arr = deps.map(function(dep){
                return execFactory(dep)
            });
            return modules[id].value = factory.apply(null,arr);
        }
        return modules[id].value = factory();
    }

    // resolve path
    // a/b/c ../d -> a/d
    // a/b/c ./e  -> a/b/e
    function pathResolve(path1,path2){
        path1 = path1.split('/');
        path1.pop();
        var pathArr = path1.concat(path2.split('/'));
        var up = 0;
        var last;
        for(var i=pathArr.length-1;i>=0;i--){
            last = pathArr[i];
            if(last==='.'){
                pathArr.splice(i,1);
            }else if(last==='..'){
                pathArr.splice(i,1);
                up++;
            }else if(up){
                pathArr.splice(i,1);
                up--;
            }
        }
        return pathArr.join('/');
    }

    var loadMgr = {
        $head  : null,
        events : {},
        load   : function(url,func){
            if(!this.$head){
                this.$head = $d.getElementsByTagName('head')[0];
            }
            var list = this.events[url];
            var script;
            if(!isArray(list)){ //not load
                this.events[url] = [func];
                script = $d.createElement('script');
                script.async = true;
                script.src = url;
                this.$head.appendChild(script);
                script.onload = function(e){
                    list = loadMgr.events[url];
                    list.forEach(function(f){
                        f();
                    });
                    loadMgr.events[url].length = 0;
                    script.remove();
                }
            }else if(list.length>0){ //loading
                this.events[url].push(func)
            }else{//loaded
                func();
            }
        }
    }

    var DepsMgr = function(deps,callback){
        this.id = mgrid+++'_DEPS_MGR';
        define(this.id,deps,callback);
        this.count = 0;
        this.parseModule();
        if(this.count==0){ execFactory(this.id); }
    }
    DepsMgr.prototype = {
        parseModule : function(){
            var me = this;
            caches.forEach(function(mod){
                var id = mod[0] || currPath;
                var deps = mod[1];
                if(deps.length){
                    deps = deps.map(function(id){
                        return pathResolve(currPath,id);
                    });
                    deps.forEach(function(id){
                        if(!modules[id]){me.load(id);}
                    })
                }
                modules[id] = {
                    id   : id,
                    deps : deps,
                    factory : mod[2]
                }
            });
            caches.length = 0;
        },
        load : function(url){
            var me = this;
            me.count++;
            if(isAmd(url)){
                loadMgr.load(root+url+'.js',function(){
                    me.count--;
                    currPath = root+url;
                    me.parseModule();
                    if(me.count==0){
                        execFactory(me.id)
                    }
                })
            }else{
                loadMgr.load(url,function(){
                    me.count--;
                    modules[url] = {value:true};
                    if(me.count==0){
                        execFactory(me.id);
                    }
                })
            }
        }
    }


    //api interface
    function define(id,deps,factory){
        var args = arguments;
        if(args.length==2){
            return caches.push([0,id,deps]);
        }
        if(args.length==1){
            return caches.push([0,[],id]);
        }
        caches.push(args);
    }
    //define.amd = {};
    define.modules = modules;

    function require(deps,callback){
        new DepsMgr(deps,callback);
    }

    global.define = define;
    global.require= require;

})(this)