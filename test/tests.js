define('testAmdModule',[],function(){
    return 'wxx'
});

QUnit.test('amd base test',function(assert){

    require(['testAmdModule'],function(value){
        assert.ok( value==='wxx','passed!' )
    })
});

QUnit.asyncTest('amd asyncTest test',function(assert){

    require(['amd/remote','http://ajax.aspnetcdn.com/ajax/jQuery/jquery-1.7.2.min.js'],function(remote){
        console.log($);
        assert.ok(remote()==='wxx','passed');
        QUnit.start();
    });
    

})