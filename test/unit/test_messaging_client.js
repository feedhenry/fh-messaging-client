var util = require('util');
var assert = require('assert');
var proxyquire = require('proxyquire');

var undertest = '../../index';

var mock = {
  'request': function (params,cb){
    cb(undefined,{"statusCode":200},{});
  }
};

var messagingConfig = {
  "host":"127.0.0.1",
  "port":"8813",
  "protocol":"http",
  "apikey":"somekey"
};


exports.test_messaging_config_ok = function (finish){
  try {
    proxyquire(undertest, {})(messagingConfig);
  }catch(e){
    assert.fail("did not expect an exception" + e.message);
  }
  finish();
};

exports.test_messaging_config_fail = function (finish){
  try {
    proxyquire(undertest, {})({"host":"host"});
  }catch(e){
    assert.ok(e,"expected an exception");
    return finish();
  }
  assert.fail("expected an exception");
};

exports.test_create_app_message_ok = function (finish){
    var client = proxyquire(undertest, mock)(messagingConfig);
    client.createAppMessage("fhact",{},function (err,body,status){
      assert.ok(! err , " did not expect an error " + util.inspect(err));
      assert.ok(200 === status);
      finish();
    });
};

exports.test_create_app_message_bad_request = function (finish){
  
    var client = proxyquire(undertest, mock)(messagingConfig);
    client.createAppMessage(null,{},function (err,body,status){
      assert.ok(err , " expected an error " + util.inspect(err));
      assert.ok(400 === err.code);
      finish();
    });
};

exports.test_create_app_message_status_code = function (finish){
  
    var mock = {
      'request': function (params,cb){
        cb(undefined,{"statusCode":400},{});
      }
    };
    var client = proxyquire(undertest, mock)(messagingConfig);
    client.createAppMessage("fhact",{},function (err,body,status){
      assert.ok(! err , " did not expect an error " + util.inspect(err));
      assert.ok(400 === status);
      finish();
    });
};

exports.test_sendMbaasMetrics_bad_request = function (finish){
  var client = proxyquire(undertest, mock)(messagingConfig);
  var from = new Date().getTime();
  var to = new Date().getTime();
  client.sendMbaasMetrics(from,to,null,{},function (err,body,status){
    assert.ok(err , "  expected an error " + util.inspect(err));
    assert.ok(400 === err.code);
    finish();
  });
};

exports.test_sendMbaasMetrics_ok = function (finish){
  var client = proxyquire(undertest, mock)(messagingConfig);
  var from = new Date().getTime();
  var to = new Date().getTime();
  client.sendMbaasMetrics(from,to,"domain",{},function (err,body,status){
    assert.ok(! err , "  did not expect an error " + util.inspect(err));
    assert.ok(status == 200);
    finish();
  });
};