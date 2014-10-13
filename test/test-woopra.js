var http = require('http');
var https = require('https');
var should = require('should');
var sinon = require('sinon');

describe('Woopra', function() {
    var Woopra = require('../index.js');
    var PROJECT = 'test-woopra.com';

    var woopra;

    var sslSpy = sinon.spy(https, 'get');
    var spy = sinon.spy(http, 'get');

    beforeEach(function() {
    });

    afterEach(function() {
    });

    describe('Setting configuration and client data', function() {
        it('should throw an error if not initialized with a project key', function() {
            (function() {
                woopra = new Woopra();
            }).should.throw();
        });

        it('should initialize with project key and configuration options', function() {
            woopra = new Woopra(PROJECT, {
                foo: 'bar'
            });

            woopra.projectKey.should.equal(PROJECT, 'initialize with project key');
            woopra.options.should.have.property('foo', 'bar');
        });

        it('should always extend configuration object when called', function() {
            woopra = new Woopra(PROJECT, {
                foo: 'bar'
            });

            woopra.config({
                foo: 'baz',
                bar: 'foo'
            });

            woopra.config().should.have.property('foo', 'baz');
            woopra.config().should.have.property('bar', 'foo');
        });

        it('should set and return client data', function() {
            woopra.client().should.not.have.property('screen');

            woopra.client({
                screen: '100x100'
            });

            woopra.client().should.have.property('screen', '100x100');
        });

        it('should throw an error if domain is not set', function() {
            (function() {
                woopra.push();
            }).should.throw();
        });
    });

    describe('Sending configuration, client, and visitor properties to remote server', function() {
        beforeEach(function() {
            woopra = new Woopra(PROJECT);
        });

        it('should send to non-SSL server if configured', function() {
            woopra.config({
                ssl: false
            });

            woopra.identify('test').push();

            sslSpy.called.should.equal(false, 'should not call with SSL');
            spy.called.should.equal(true, 'should call without SSL');

        });

        it('should throw an error if trying to `push` without identifying the visitor', function() {
            (function() {
                woopra.push();
            }).should.throw();
        });

        it('should set and send visitors id/email property', function() {
            woopra.identify('billyid');

            woopra.push();

            sslSpy.calledWithMatch('cv_email=billyid').should.equal(true, 'called with cv_email parameter');
        });

        it('should set and send visitor id/email and custom properties', function() {

            woopra.identify('billyid', {
                gender: 'male'
            }).push();

            sslSpy.calledWithMatch('cv_email=billyid').should.equal(true, 'called with correct email property');
            sslSpy.calledWithMatch('cv_gender=male').should.equal(true, 'called with visitor property: gender');

        });

        it('should send all client data', function() {
            woopra.identify('billyid');

            woopra.client({
                screen: 'screen',
                referer: 'referer'
            });

            woopra.push();

            sslSpy.calledWithMatch('screen=screen').should.equal(true, 'called with screen parameter');
            sslSpy.calledWithMatch('referer=referer').should.equal(true, 'called with referer parameter');
        });

    });

    describe('Sending configuration, client, visitor, and event properties to remote server', function() {
        beforeEach(function() {
            woopra = new Woopra(PROJECT);
            woopra.identify('billyid');
        });

        it('should throw an error if trying to `track` without a name parameter', function() {
            (function() {
                woopra.track();
            }).should.throw();

            (function() {
                woopra.track({});
            }).should.throw();
        });

        it('should track an event with no properties', function() {
            woopra.track('test');

            sslSpy.calledWithMatch('name=test').should.equal(true, 'track event name with no properties');
        });

        it('should track an event with properties', function() {
            woopra.track('test', {
                property: true
            });

            sslSpy.calledWithMatch('name=test').should.equal(true, 'track `test` event');
            sslSpy.calledWithMatch('ce_property=true').should.equal(true, 'track `test` event with property `property=true`');

        });

        it('should call callback after `track` succeeds', function(done) {
            sslSpy.restore();

            var spy = sinon.spy();
            var stub = sinon.stub(https, 'get', function(url, callback) {
                spy.called.should.equal(false, 'callback should not be called yet');
                callback();
                stub.restore();
                done();
            });

            woopra.track('test', {}, spy);
            spy.called.should.equal(true, 'callback should be called');
        });
    });

    describe('Reset properties', function() {
        it('should clear client properties after setting them', function() {
            woopra.client({
                screen: 'test'
            });

            woopra.client().should.have.property('screen', 'test');

            woopra.reset();

            woopra.client().should.not.have.property('screen');
        });

        it('should clear visitor properties after setting them', function() {
            woopra.identify('test@test-woopra.com', {
                gender: 'male'
            });
            woopra.push();
            sslSpy.calledWithMatch('cv_gender=male').should.equal(true, 'Identify with `gender` property = male (before reset)');

            woopra.reset();

            (function() {
                woopra.push();
            }).should.throw();
        });
    });
});
