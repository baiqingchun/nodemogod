var express = require('express');
var router = express.Router();
//新增
var mongoose = require('mongoose');//导入mongoose模块
var Users = require('../modules/users');//导入模型数据模块

var _msg = require('../auth/msg')
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});


//查询所有用户数据
router.get('/users', function(req, res, next) {
    // res.send('aaaaaaaaaaa resource');
    // Users.fetch(function(err, users) {
    //     if(err) {
    //         console.log(err);
    //     }
    //     res.send({title: '用户列表', users: users})  //这里也可以json的格式直接返回数据res.json({data: users});
    // })
   return  Users.find().exec().then(function (users) {
        // res.status(200).send({title: '用户列表', users: users})
       return _msg.pass(res)

    })
})

module.exports = router;
