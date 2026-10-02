suite('idleCallbackShim', function() {
	test('should have api methods', function(){
		chai.assert(idleCallbackShim.request);
		chai.assert(idleCallbackShim.cancel);
	});

	test('should invoke callback async', function(done){
		var isRun = false;
		var callback = sinon.spy();
		var timeoutCall = sinon.spy();
		var run = function(){
			if(isRun){return;}
			isRun = true;
			chai.assert(timeoutCall.calledBefore(callback));
			done();
		};

		idleCallbackShim.request(callback);
		setTimeout(timeoutCall, 0);

		idleCallbackShim.request(run);
		setTimeout(run, 999);
	});

	test('should schedule nested callback later', function(done){
		idleCallbackShim.request(function(){
			var isRun = false;
			var callback = sinon.spy();
			var timeoutCall = sinon.spy();
			var run = function(){
				if(isRun){return;}
				isRun = true;
				chai.assert(timeoutCall.calledBefore(callback));
				done();
			};

			idleCallbackShim.request(callback);
			setTimeout(timeoutCall, 0);

			idleCallbackShim.request(run);
			setTimeout(run, 999);
		});
	});

	test('should invoke with the deadline argument', function(done){
		idleCallbackShim.request(function(deadline){
			chai.assert('didTimeout' in deadline);
			chai.assert(!deadline.didTimeout);
			try {
				deadline.didTimeout = true;
			} catch(e){}
			chai.assert(!deadline.didTimeout);

			chai.assert(typeof deadline.timeRemaining() == 'number');
			chai.assert(deadline.timeRemaining() >= 0 && deadline.timeRemaining() <= 50);
			done();
		});
	});

	test('timeRemaining counts down', function(done){
		idleCallbackShim.request(function(deadline){
			var now = Date.now();
			var timeRemaining = deadline.timeRemaining();
			while(Date.now() - now <= 2){

			}
			chai.assert(timeRemaining > deadline.timeRemaining());
			done();
		});
	});

	test('cancels callback', function(done){
		var canceledID1, canceledID2, canceledID3;
		var run1 = sinon.spy();
		var run2 = sinon.spy();
		var run3 = sinon.spy();
		var canceled1 = sinon.spy();
		var canceled2 = sinon.spy();
		var canceled3 = sinon.spy();

		idleCallbackShim.request(run1);
		canceledID1 = idleCallbackShim.request(canceled1);


		idleCallbackShim.request(function(){
			idleCallbackShim.request(run3);
			idleCallbackShim.cancel(canceledID2);

			canceledID3 = idleCallbackShim.request(canceled3);

			idleCallbackShim.cancel(canceledID3);

			idleCallbackShim.request(function(){
				chai.assert(run1.called);
				chai.assert(run2.called);
				chai.assert(run3.called);

				chai.assert(!canceled1.called);
				chai.assert(!canceled2.called);
				chai.assert(!canceled3.called);
				done();
			});
		});

		idleCallbackShim.request(run2);
		canceledID2 = idleCallbackShim.request(canceled2);


		setTimeout(function(){
			idleCallbackShim.cancel(canceledID1);
		});
	});
});
