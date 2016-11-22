var request = require('request');
var util = require('util');
var _ = require('underscore');
var url = require('url');

module.exports = function messagingClient(config, logger){

  const API_KEY_HEADER = "x-feedhenry-msgapikey";
  const CONF_API_KEY_KEY = "apikey";
  const CONF_HOST = "host";
  const CONF_PORT = "port";
  const CONF_PROTOCOL = "protocol";
  const MISSING_CONFIG_KEY_ERROR = "Missing required config key %s";
  const MISSING_CONFIG_ERROR = "Missing config. No config passed to metrics client";
  if(! config){
    throw new Error(MISSING_CONFIG_ERROR);
  }

  function checkConfigKeys(keys){
    _.each(keys, function(k){
      if(! config.hasOwnProperty(k)){
        throw new Error(util.format(MISSING_CONFIG_KEY_ERROR,k));
      }
    });
  }

  checkConfigKeys([CONF_API_KEY_KEY,CONF_HOST,CONF_PORT,CONF_PROTOCOL]);


  function log(message){
    if(config.debug && logger && logger.hasOwnProperty("debug")){
      logger.debug("fh-metrics-client: ", message);
    }
  }

  function getUrl(path){
    return url.format({
      "protocol": config[CONF_PROTOCOL],
      "hostname":config[CONF_HOST],
      "port":config[CONF_PORT],
      "pathname": path
    });
  }

  function appendCommonHeaders(toAdd){
    var headers = {};
    headers[API_KEY_HEADER] = config[CONF_API_KEY_KEY];
    if(toAdd) {
      _.extend(headers, toAdd);
    }
    return headers;
  }

  function requestCallback(cb){
    return function (err,response,body){
      var status = response ? response.statusCode : undefined;
      return cb(err,body,status);
    }
  }

  /** this is just a representation of a common message schema
   * {
      guid:string (instance app id),
      appid:string (widget project id),
      domain:string,
      bytes:fullparams.bytes, //number
      cached:false,
      cuid:_fh.cuid || "",
      destination:_fh.destination || "",
      agent: fullparams.agent,
      'function':fullparams.funct || "",
      ipAddress:ip,
      scriptEngine:"node",
      'status':fullparams.status || "",
      time:fullparams.time || 0,
      startTime : fullparams.start,
      endTime : fullparams.end,
      'version':_fh.version || 0}
   */

  return{
    /**
     * 
     * @param topic string
     * @param object single or array of messages
     * @param cb function
     */
    "createAppMessage": function (topic,message,cb){
      //send on to messaging
      if(! topic) return cb({message:"expected topic to be set",code:400});
      if(! message) return cb({"message":"expected a message to be passed", code:400});
      
      var url = getUrl("/msg/" + topic);
      log("got url for messaging " + url);
      request({"url":url,"method":"POST","json":message,headers:appendCommonHeaders()},requestCallback(cb));
    },
    /**
     * 
     * @param from Number timestamp
     * @param to Number timestamp
     * @param level string (domain/app)
     * @param data Object (rolled up metrics)
     * @param cb function
     */
    "sendMbaasMetrics": function (from, to , level, data, cb){
      if(! from) return cb({message:"expected from to be set",code:400});
      if(! to) return cb({message:"expected to be set",code:400});
      if(! level) return cb({"message":"expected level to be set",code:400});
      if(! data) return cb({"message":"expected data to be set",code:400});
      data.to = to;
      data.from = from;
      var url = getUrl("/rollup/receive/" + level);
      log("got url for messaging " + url);
      request({"url":url,"method":"POST","json":data,headers:appendCommonHeaders()},requestCallback(cb));
    }
  }


};
