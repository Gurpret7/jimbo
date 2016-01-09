'use strict';

const uva = require('uva-amqp')
const Remi = require('remi')
const joi = require('joi')

function Server() {
  this.methods = {}
  this._remi = new Remi()
}

Server.prototype.connection = function(opts) {
  this._server = new uva.Server(opts)
}

Server.prototype.register = function(plugins, cb) {
  return this._remi.register(this, plugins, {}, cb)
}

Server.prototype.start = function(cb) {
  cb()
}

function compileRule(rule) {
  // null, undefined, true - anything allowed
  // false - nothing allowed
  // {...} - ... allowed

  if (rule === false)
    return joi.object({}).allow(null)

  if (typeof rule === 'function')
    return rule

  // false tested earlier
  if (!rule || rule === true)
    return null

  return joi.compile(rule);
}

function getValidateFunc(validate) {

}

Server.prototype.method = function(opts) {
  if (!opts.name)
    throw new Error('name is required')

  if (!opts.handler)
    throw new Error('handler is required')

  let validate = opts.config && opts.config.validate || {}
  let schema = joi.compile(validate)
  function validationFunc(params, cb) {
    joi.validate(params, schema, cb)
  }

  function method(params, cb) {
    validationFunc(params, function(err, params) {
      if (err) return cb(err)

      return opts.handler(params, cb)
    })
  }

  this._server.addMethod(opts.name, method)
  this.methods[opts.name] = method
}

Server.prototype.inject = function(opts, cb) {
  this.methods[opts.methodName](opts.params, cb)
}

module.exports = Server