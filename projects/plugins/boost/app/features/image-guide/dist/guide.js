(function () {
    'use strict';

    function noop(){}const identity=x=>x;function add_location(element,file,line,column,char){element.__svelte_meta={loc:{file,line,column,char}};}function run(fn){return fn();}function blank_object(){return Object.create(null);}function run_all(fns){fns.forEach(run);}function is_function(thing){return typeof thing==='function';}function safe_not_equal(a,b){return a!=a?b==b:a!==b||a&&typeof a==='object'||typeof a==='function';}let src_url_equal_anchor;function src_url_equal(element_src,url){if(!src_url_equal_anchor){src_url_equal_anchor=document.createElement('a');}src_url_equal_anchor.href=url;return element_src===src_url_equal_anchor.href;}function is_empty(obj){return Object.keys(obj).length===0;}function validate_store(store,name){if(store!=null&&typeof store.subscribe!=='function'){throw new Error(`'${name}' is not a store with a 'subscribe' method`);}}function subscribe$1(store,...callbacks){if(store==null){return noop;}const unsub=store.subscribe(...callbacks);return unsub.unsubscribe?()=>unsub.unsubscribe():unsub;}function component_subscribe(component,store,callback){component.$$.on_destroy.push(subscribe$1(store,callback));}const is_client=typeof window!=='undefined';let now=is_client?()=>window.performance.now():()=>Date.now();let raf=is_client?cb=>requestAnimationFrame(cb):noop;// used internally for testing
    const tasks=new Set();function run_tasks(now){tasks.forEach(task=>{if(!task.c(now)){tasks.delete(task);task.f();}});if(tasks.size!==0)raf(run_tasks);}/**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */function loop(callback){let task;if(tasks.size===0)raf(run_tasks);return {promise:new Promise(fulfill=>{tasks.add(task={c:callback,f:fulfill});}),abort(){tasks.delete(task);}};}// Track which nodes are claimed during hydration. Unclaimed nodes can then be removed from the DOM
    function append(target,node){target.appendChild(node);}function get_root_for_style(node){if(!node)return document;const root=node.getRootNode?node.getRootNode():node.ownerDocument;if(root&&root.host){return root;}return node.ownerDocument;}function append_empty_stylesheet(node){const style_element=element('style');append_stylesheet(get_root_for_style(node),style_element);return style_element.sheet;}function append_stylesheet(node,style){append(node.head||node,style);}function insert(target,node,anchor){target.insertBefore(node,anchor||null);}function detach(node){node.parentNode.removeChild(node);}function destroy_each(iterations,detaching){for(let i=0;i<iterations.length;i+=1){if(iterations[i])iterations[i].d(detaching);}}function element(name){return document.createElement(name);}function svg_element(name){return document.createElementNS('http://www.w3.org/2000/svg',name);}function text(data){return document.createTextNode(data);}function space(){return text(' ');}function empty(){return text('');}function listen(node,event,handler,options){node.addEventListener(event,handler,options);return ()=>node.removeEventListener(event,handler,options);}function prevent_default(fn){return function(event){event.preventDefault();// @ts-ignore
    return fn.call(this,event);};}function attr(node,attribute,value){if(value==null)node.removeAttribute(attribute);else if(node.getAttribute(attribute)!==value)node.setAttribute(attribute,value);}function children(element){return Array.from(element.childNodes);}function set_style(node,key,value,important){if(value===null){node.style.removeProperty(key);}else {node.style.setProperty(key,value,important?'important':'');}}function toggle_class(element,name,toggle){element.classList[toggle?'add':'remove'](name);}function custom_event(type,detail,{bubbles=false,cancelable=false}={}){const e=document.createEvent('CustomEvent');e.initCustomEvent(type,bubbles,cancelable,detail);return e;}// https://github.com/sveltejs/svelte/issues/3624
    const managed_styles=new Map();let active=0;// https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str){let hash=5381;let i=str.length;while(i--)hash=(hash<<5)-hash^str.charCodeAt(i);return hash>>>0;}function create_style_information(doc,node){const info={stylesheet:append_empty_stylesheet(node),rules:{}};managed_styles.set(doc,info);return info;}function create_rule(node,a,b,duration,delay,ease,fn,uid=0){const step=16.666/duration;let keyframes='{\n';for(let p=0;p<=1;p+=step){const t=a+(b-a)*ease(p);keyframes+=p*100+`%{${fn(t,1-t)}}\n`;}const rule=keyframes+`100% {${fn(b,1-b)}}\n}`;const name=`__svelte_${hash(rule)}_${uid}`;const doc=get_root_for_style(node);const{stylesheet,rules}=managed_styles.get(doc)||create_style_information(doc,node);if(!rules[name]){rules[name]=true;stylesheet.insertRule(`@keyframes ${name} ${rule}`,stylesheet.cssRules.length);}const animation=node.style.animation||'';node.style.animation=`${animation?`${animation}, `:''}${name} ${duration}ms linear ${delay}ms 1 both`;active+=1;return name;}function delete_rule(node,name){const previous=(node.style.animation||'').split(', ');const next=previous.filter(name?anim=>anim.indexOf(name)<0// remove specific animation
    :anim=>anim.indexOf('__svelte')===-1// remove all Svelte animations
    );const deleted=previous.length-next.length;if(deleted){node.style.animation=next.join(', ');active-=deleted;if(!active)clear_rules();}}function clear_rules(){raf(()=>{if(active)return;managed_styles.forEach(info=>{const{stylesheet}=info;let i=stylesheet.cssRules.length;while(i--)stylesheet.deleteRule(i);info.rules={};});managed_styles.clear();});}let current_component;function set_current_component(component){current_component=component;}function get_current_component(){if(!current_component)throw new Error('Function called outside component initialization');return current_component;}function onMount(fn){get_current_component().$$.on_mount.push(fn);}// shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component,event){const callbacks=component.$$.callbacks[event.type];if(callbacks){// @ts-ignore
    callbacks.slice().forEach(fn=>fn.call(this,event));}}const dirty_components=[];const binding_callbacks=[];const render_callbacks=[];const flush_callbacks=[];const resolved_promise=Promise.resolve();let update_scheduled=false;function schedule_update(){if(!update_scheduled){update_scheduled=true;resolved_promise.then(flush);}}function add_render_callback(fn){render_callbacks.push(fn);}// 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks=new Set();let flushidx=0;// Do *not* move this inside the flush() function
    function flush(){const saved_component=current_component;do{// first, call beforeUpdate functions
    // and update components
    while(flushidx<dirty_components.length){const component=dirty_components[flushidx];flushidx++;set_current_component(component);update$1(component.$$);}set_current_component(null);dirty_components.length=0;flushidx=0;while(binding_callbacks.length)binding_callbacks.pop()();// then, once components are updated, call
    // afterUpdate functions. This may cause
    // subsequent updates...
    for(let i=0;i<render_callbacks.length;i+=1){const callback=render_callbacks[i];if(!seen_callbacks.has(callback)){// ...so guard against infinite loops
    seen_callbacks.add(callback);callback();}}render_callbacks.length=0;}while(dirty_components.length);while(flush_callbacks.length){flush_callbacks.pop()();}update_scheduled=false;seen_callbacks.clear();set_current_component(saved_component);}function update$1($$){if($$.fragment!==null){$$.update();run_all($$.before_update);const dirty=$$.dirty;$$.dirty=[-1];$$.fragment&&$$.fragment.p($$.ctx,dirty);$$.after_update.forEach(add_render_callback);}}let promise;function wait(){if(!promise){promise=Promise.resolve();promise.then(()=>{promise=null;});}return promise;}function dispatch(node,direction,kind){node.dispatchEvent(custom_event(`${direction?'intro':'outro'}${kind}`));}const outroing=new Set();let outros;function group_outros(){outros={r:0,c:[],p:outros// parent group
    };}function check_outros(){if(!outros.r){run_all(outros.c);}outros=outros.p;}function transition_in(block,local){if(block&&block.i){outroing.delete(block);block.i(local);}}function transition_out(block,local,detach,callback){if(block&&block.o){if(outroing.has(block))return;outroing.add(block);outros.c.push(()=>{outroing.delete(block);if(callback){if(detach)block.d(1);callback();}});block.o(local);}else if(callback){callback();}}const null_transition={duration:0};function create_bidirectional_transition(node,fn,params,intro){let config=fn(node,params);let t=intro?0:1;let running_program=null;let pending_program=null;let animation_name=null;function clear_animation(){if(animation_name)delete_rule(node,animation_name);}function init(program,duration){const d=program.b-t;duration*=Math.abs(d);return {a:t,b:program.b,d,duration,start:program.start,end:program.start+duration,group:program.group};}function go(b){const{delay=0,duration=300,easing=identity,tick=noop,css}=config||null_transition;const program={start:now()+delay,b};if(!b){// @ts-ignore todo: improve typings
    program.group=outros;outros.r+=1;}if(running_program||pending_program){pending_program=program;}else {// if this is an intro, and there's a delay, we need to do
    // an initial tick and/or apply CSS animation immediately
    if(css){clear_animation();animation_name=create_rule(node,t,b,duration,delay,easing,css);}if(b)tick(0,1);running_program=init(program,duration);add_render_callback(()=>dispatch(node,b,'start'));loop(now=>{if(pending_program&&now>pending_program.start){running_program=init(pending_program,duration);pending_program=null;dispatch(node,running_program.b,'start');if(css){clear_animation();animation_name=create_rule(node,t,running_program.b,running_program.duration,0,easing,config.css);}}if(running_program){if(now>=running_program.end){tick(t=running_program.b,1-t);dispatch(node,running_program.b,'end');if(!pending_program){// we're done
    if(running_program.b){// intro — we can tidy up immediately
    clear_animation();}else {// outro — needs to be coordinated
    if(! --running_program.group.r)run_all(running_program.group.c);}}running_program=null;}else if(now>=running_program.start){const p=now-running_program.start;t=running_program.a+running_program.d*easing(p/running_program.duration);tick(t,1-t);}}return !!(running_program||pending_program);});}}return {run(b){if(is_function(config)){wait().then(()=>{// @ts-ignore
    config=config();go(b);});}else {go(b);}},end(){clear_animation();running_program=pending_program=null;}};}function create_component(block){block&&block.c();}function mount_component(component,target,anchor,customElement){const{fragment,on_mount,on_destroy,after_update}=component.$$;fragment&&fragment.m(target,anchor);if(!customElement){// onMount happens before the initial afterUpdate
    add_render_callback(()=>{const new_on_destroy=on_mount.map(run).filter(is_function);if(on_destroy){on_destroy.push(...new_on_destroy);}else {// Edge case - component was destroyed immediately,
    // most likely as a result of a binding initialising
    run_all(new_on_destroy);}component.$$.on_mount=[];});}after_update.forEach(add_render_callback);}function destroy_component(component,detaching){const $$=component.$$;if($$.fragment!==null){run_all($$.on_destroy);$$.fragment&&$$.fragment.d(detaching);// TODO null out other refs, including component.$$ (but need to
    // preserve final state?)
    $$.on_destroy=$$.fragment=null;$$.ctx=[];}}function make_dirty(component,i){if(component.$$.dirty[0]===-1){dirty_components.push(component);schedule_update();component.$$.dirty.fill(0);}component.$$.dirty[i/31|0]|=1<<i%31;}function init(component,options,instance,create_fragment,not_equal,props,append_styles,dirty=[-1]){const parent_component=current_component;set_current_component(component);const $$=component.$$={fragment:null,ctx:null,// state
    props,update:noop,not_equal,bound:blank_object(),// lifecycle
    on_mount:[],on_destroy:[],on_disconnect:[],before_update:[],after_update:[],context:new Map(options.context||(parent_component?parent_component.$$.context:[])),// everything else
    callbacks:blank_object(),dirty,skip_bound:false,root:options.target||parent_component.$$.root};append_styles&&append_styles($$.root);let ready=false;$$.ctx=instance?instance(component,options.props||{},(i,ret,...rest)=>{const value=rest.length?rest[0]:ret;if($$.ctx&&not_equal($$.ctx[i],$$.ctx[i]=value)){if(!$$.skip_bound&&$$.bound[i])$$.bound[i](value);if(ready)make_dirty(component,i);}return ret;}):[];$$.update();ready=true;run_all($$.before_update);// `false` as a special case of no DOM component
    $$.fragment=create_fragment?create_fragment($$.ctx):false;if(options.target){if(options.hydrate){const nodes=children(options.target);// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    $$.fragment&&$$.fragment.l(nodes);nodes.forEach(detach);}else {// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    $$.fragment&&$$.fragment.c();}if(options.intro)transition_in(component.$$.fragment);mount_component(component,options.target,options.anchor,options.customElement);flush();}set_current_component(parent_component);}/**
     * Base class for Svelte components. Used when dev=false.
     */class SvelteComponent{$destroy(){destroy_component(this,1);this.$destroy=noop;}$on(type,callback){const callbacks=this.$$.callbacks[type]||(this.$$.callbacks[type]=[]);callbacks.push(callback);return ()=>{const index=callbacks.indexOf(callback);if(index!==-1)callbacks.splice(index,1);};}$set($$props){if(this.$$set&&!is_empty($$props)){this.$$.skip_bound=true;this.$$set($$props);this.$$.skip_bound=false;}}}function dispatch_dev(type,detail){document.dispatchEvent(custom_event(type,Object.assign({version:'3.49.0'},detail),{bubbles:true}));}function append_dev(target,node){dispatch_dev('SvelteDOMInsert',{target,node});append(target,node);}function insert_dev(target,node,anchor){dispatch_dev('SvelteDOMInsert',{target,node,anchor});insert(target,node,anchor);}function detach_dev(node){dispatch_dev('SvelteDOMRemove',{node});detach(node);}function listen_dev(node,event,handler,options,has_prevent_default,has_stop_propagation){const modifiers=options===true?['capture']:options?Array.from(Object.keys(options)):[];if(has_prevent_default)modifiers.push('preventDefault');if(has_stop_propagation)modifiers.push('stopPropagation');dispatch_dev('SvelteDOMAddEventListener',{node,event,handler,modifiers});const dispose=listen(node,event,handler,options);return ()=>{dispatch_dev('SvelteDOMRemoveEventListener',{node,event,handler,modifiers});dispose();};}function attr_dev(node,attribute,value){attr(node,attribute,value);if(value==null)dispatch_dev('SvelteDOMRemoveAttribute',{node,attribute});else dispatch_dev('SvelteDOMSetAttribute',{node,attribute,value});}function set_data_dev(text,data){data=''+data;if(text.wholeText===data)return;dispatch_dev('SvelteDOMSetData',{node:text,data});text.data=data;}function validate_each_argument(arg){if(typeof arg!=='string'&&!(arg&&typeof arg==='object'&&'length'in arg)){let msg='{#each} only iterates over array-like objects.';if(typeof Symbol==='function'&&arg&&Symbol.iterator in arg){msg+=' You can use a spread to convert this iterable into an array.';}throw new Error(msg);}}function validate_slots(name,slot,keys){for(const slot_key of Object.keys(slot)){if(!~keys.indexOf(slot_key)){console.warn(`<${name}> received an unexpected slot "${slot_key}".`);}}}/**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */class SvelteComponentDev extends SvelteComponent{constructor(options){if(!options||!options.target&&!options.$$inline){throw new Error("'target' is a required option");}super();}$destroy(){super.$destroy();this.$destroy=()=>{console.warn('Component was already destroyed');// eslint-disable-line no-console
    };}$capture_state(){}$inject_state(){}}

    const subscriber_queue=[];/**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */function writable(value,start=noop){let stop;const subscribers=new Set();function set(new_value){if(safe_not_equal(value,new_value)){value=new_value;if(stop){// store is ready
    const run_queue=!subscriber_queue.length;for(const subscriber of subscribers){subscriber[1]();subscriber_queue.push(subscriber,value);}if(run_queue){for(let i=0;i<subscriber_queue.length;i+=2){subscriber_queue[i][0](subscriber_queue[i+1]);}subscriber_queue.length=0;}}}}function update(fn){set(fn(value));}function subscribe(run,invalidate=noop){const subscriber=[run,invalidate];subscribers.add(subscriber);if(subscribers.size===1){stop=start(set)||noop;}run(value);return ()=>{subscribers.delete(subscriber);if(subscribers.size===0){stop();stop=null;}};}return {set,update,subscribe};}

    const LS_KEY = 'jetpack-boost-guide';
    const states = ['Active', 'Always On', 'Paused'];
    let stored = localStorage.getItem(LS_KEY);
    if (!stored || !states.includes(stored)) {
        localStorage.setItem(LS_KEY, 'Active');
        stored = 'Active';
    }
    const { set, update, subscribe } = writable(stored);
    subscribe(value => {
        localStorage.setItem(LS_KEY, value);
    });
    var state = {
        subscribe,
        set,
        update,
        cycle: () => {
            update(state => {
                const index = states.indexOf(state);
                return states[(index + 1) % states.length];
            });
        },
    };

    function backOut(t){const s=1.70158;return --t*t*((s+1)*t+s)+1;}function cubicOut(t){const f=t-1.0;return f*f*f+1.0;}

    function fly(node,{delay=0,duration=400,easing=cubicOut,x=0,y=0,opacity=0}={}){const style=getComputedStyle(node);const target_opacity=+style.opacity;const transform=style.transform==='none'?'':style.transform;const od=target_opacity*(1-opacity);return {delay,duration,easing,css:(t,u)=>`
			transform: ${transform} translate(${(1-t)*x}px, ${(1-t)*y}px);
			opacity: ${target_opacity-od*u}`};}

    /* app/features/guide/src/ui/JetpackLogo.svelte generated by Svelte v3.49.0 */

    const file$4 = "app/features/guide/src/ui/JetpackLogo.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let svg;
    	let path0;
    	let path1;
    	let path2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			attr_dev(path0, "d", "M55.4 107.8C84.3397 107.8 107.8 84.3397 107.8 55.4C107.8 26.4603 84.3397 3 55.4 3C26.4603 3 3 26.4603 3 55.4C3 84.3397 26.4603 107.8 55.4 107.8Z");
    			attr_dev(path0, "fill", "#069E08");
    			add_location(path0, file$4, 5, 2, 178);
    			attr_dev(path1, "d", "M58 46.6V97.4L84.2 46.6H58Z");
    			attr_dev(path1, "fill", "white");
    			add_location(path1, file$4, 9, 2, 361);
    			attr_dev(path2, "d", "M52.7 64.1V13.4L26.6 64.1H52.7Z");
    			attr_dev(path2, "fill", "white");
    			add_location(path2, file$4, 10, 2, 417);
    			attr_dev(svg, "viewBox", "0 0 110 110");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$4, 4, 1, 101);
    			set_style(div, "width", /*size*/ ctx[0] + "px");
    			set_style(div, "height", /*size*/ ctx[0] + "px");
    			add_location(div, file$4, 3, 0, 51);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, svg);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    			append_dev(svg, path2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*size*/ 1) {
    				set_style(div, "width", /*size*/ ctx[0] + "px");
    			}

    			if (dirty & /*size*/ 1) {
    				set_style(div, "height", /*size*/ ctx[0] + "px");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('JetpackLogo', slots, []);
    	let { size = 16 } = $$props;
    	const writable_props = ['size'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<JetpackLogo> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('size' in $$props) $$invalidate(0, size = $$props.size);
    	};

    	$$self.$capture_state = () => ({ size });

    	$$self.$inject_state = $$props => {
    		if ('size' in $$props) $$invalidate(0, size = $$props.size);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size];
    }

    class JetpackLogo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { size: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "JetpackLogo",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get size() {
    		throw new Error("<JetpackLogo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<JetpackLogo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* app/features/guide/src/ui/ImageGuide.svelte generated by Svelte v3.49.0 */
    const file$3 = "app/features/guide/src/ui/ImageGuide.svelte";

    // (38:2) {#if image.fileSize.weight > 0}
    function create_if_block_2(ctx) {
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let t2_value = Math.round(/*image*/ ctx[0].fileSize.weight) + "";
    	let t2;
    	let t3;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "Image Size";
    			t1 = space();
    			div1 = element("div");
    			t2 = text(t2_value);
    			t3 = text("kb");
    			attr_dev(div0, "class", "label");
    			add_location(div0, file$3, 39, 4, 1305);
    			attr_dev(div1, "class", "value");
    			add_location(div1, file$3, 40, 4, 1345);
    			attr_dev(div2, "class", "row svelte-gnvvmc");
    			add_location(div2, file$3, 38, 3, 1283);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, t2);
    			append_dev(div1, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*image*/ 1 && t2_value !== (t2_value = Math.round(/*image*/ ctx[0].fileSize.weight) + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(38:2) {#if image.fileSize.weight > 0}",
    		ctx
    	});

    	return block;
    }

    // (55:2) {#if potentialSavings > 0}
    function create_if_block_1$1(ctx) {
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let strong;
    	let t2;
    	let t3;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "Potential savings";
    			t1 = space();
    			div1 = element("div");
    			strong = element("strong");
    			t2 = text(/*potentialSavings*/ ctx[3]);
    			t3 = text(" KB");
    			attr_dev(div0, "class", "label");
    			add_location(div0, file$3, 56, 4, 1797);
    			add_location(strong, file$3, 57, 23, 1863);
    			attr_dev(div1, "class", "value");
    			add_location(div1, file$3, 57, 4, 1844);
    			attr_dev(div2, "class", "row svelte-gnvvmc");
    			add_location(div2, file$3, 55, 3, 1775);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, strong);
    			append_dev(strong, t2);
    			append_dev(strong, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*potentialSavings*/ 8) set_data_dev(t2, /*potentialSavings*/ ctx[3]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(55:2) {#if potentialSavings > 0}",
    		ctx
    	});

    	return block;
    }

    // (63:1) {#if imageOrigin !== origin}
    function create_if_block$2(ctx) {
    	let div6;
    	let p;
    	let strong;
    	let t1;
    	let t2;
    	let div2;
    	let div0;
    	let t4;
    	let div1;
    	let t5;
    	let t6;
    	let div5;
    	let div3;
    	let t8;
    	let div4;
    	let t9;

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			p = element("p");
    			strong = element("strong");
    			strong.textContent = "Image Source";
    			t1 = text("\n\t\t\t\tUnable to fetch image size because the image is hosted on a different domain.");
    			t2 = space();
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "Image hosted on";
    			t4 = space();
    			div1 = element("div");
    			t5 = text(/*imageOrigin*/ ctx[1]);
    			t6 = space();
    			div5 = element("div");
    			div3 = element("div");
    			div3.textContent = "Current page served from";
    			t8 = space();
    			div4 = element("div");
    			t9 = text(/*origin*/ ctx[2]);
    			attr_dev(strong, "class", "svelte-gnvvmc");
    			add_location(strong, file$3, 65, 4, 1999);
    			add_location(p, file$3, 64, 3, 1991);
    			attr_dev(div0, "class", "label");
    			add_location(div0, file$3, 69, 4, 2144);
    			attr_dev(div1, "class", "value");
    			add_location(div1, file$3, 70, 4, 2189);
    			attr_dev(div2, "class", "row svelte-gnvvmc");
    			add_location(div2, file$3, 68, 3, 2122);
    			attr_dev(div3, "class", "label");
    			add_location(div3, file$3, 73, 4, 2263);
    			attr_dev(div4, "class", "value");
    			add_location(div4, file$3, 74, 4, 2317);
    			attr_dev(div5, "class", "row svelte-gnvvmc");
    			add_location(div5, file$3, 72, 3, 2241);
    			attr_dev(div6, "class", "origin svelte-gnvvmc");
    			add_location(div6, file$3, 63, 2, 1967);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, p);
    			append_dev(p, strong);
    			append_dev(p, t1);
    			append_dev(div6, t2);
    			append_dev(div6, div2);
    			append_dev(div2, div0);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, t5);
    			append_dev(div6, t6);
    			append_dev(div6, div5);
    			append_dev(div5, div3);
    			append_dev(div5, t8);
    			append_dev(div5, div4);
    			append_dev(div4, t9);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*imageOrigin*/ 2) set_data_dev(t5, /*imageOrigin*/ ctx[1]);
    			if (dirty & /*origin*/ 4) set_data_dev(t9, /*origin*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(63:1) {#if imageOrigin !== origin}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div10;
    	let div0;
    	let jetpacklogo;
    	let t0;
    	let div2;
    	let div1;
    	let b;
    	let t1;
    	let t2;
    	let br0;
    	let t3;
    	let t4;
    	let t5;
    	let br1;
    	let t6;
    	let img;
    	let img_src_value;
    	let t7;
    	let div9;
    	let t8;
    	let div5;
    	let div3;
    	let t10;
    	let div4;
    	let t11_value = /*image*/ ctx[0].fileSize.width + "";
    	let t11;
    	let t12;
    	let t13_value = /*image*/ ctx[0].fileSize.height + "";
    	let t13;
    	let t14;
    	let div8;
    	let div6;
    	let t16;
    	let div7;
    	let t17_value = /*image*/ ctx[0].onScreen.width + "";
    	let t17;
    	let t18;
    	let t19_value = /*image*/ ctx[0].onScreen.height + "";
    	let t19;
    	let t20;
    	let t21;
    	let div10_transition;
    	let current;
    	jetpacklogo = new JetpackLogo({ props: { size: 250 }, $$inline: true });
    	let if_block0 = /*image*/ ctx[0].fileSize.weight > 0 && create_if_block_2(ctx);
    	let if_block1 = /*potentialSavings*/ ctx[3] > 0 && create_if_block_1$1(ctx);
    	let if_block2 = /*imageOrigin*/ ctx[1] !== /*origin*/ ctx[2] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div10 = element("div");
    			div0 = element("div");
    			create_component(jetpacklogo.$$.fragment);
    			t0 = space();
    			div2 = element("div");
    			div1 = element("div");
    			b = element("b");
    			t1 = text(/*ratio*/ ctx[4]);
    			t2 = text("x larger");
    			br0 = element("br");
    			t3 = text("\n\t\t\tThe image loaded over the network is ");
    			t4 = text(/*ratio*/ ctx[4]);
    			t5 = text("x larger than it appears in the browser.\n\t\t\t");
    			br1 = element("br");
    			t6 = space();
    			img = element("img");
    			t7 = space();
    			div9 = element("div");
    			if (if_block0) if_block0.c();
    			t8 = space();
    			div5 = element("div");
    			div3 = element("div");
    			div3.textContent = "Image Dimensions";
    			t10 = space();
    			div4 = element("div");
    			t11 = text(t11_value);
    			t12 = text(" x ");
    			t13 = text(t13_value);
    			t14 = space();
    			div8 = element("div");
    			div6 = element("div");
    			div6.textContent = "Image Dimensions on screen";
    			t16 = space();
    			div7 = element("div");
    			t17 = text(t17_value);
    			t18 = text(" x ");
    			t19 = text(t19_value);
    			t20 = space();
    			if (if_block1) if_block1.c();
    			t21 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(div0, "class", "logo svelte-gnvvmc");
    			add_location(div0, file$3, 17, 1, 807);
    			add_location(b, file$3, 23, 3, 918);
    			add_location(br0, file$3, 23, 25, 940);
    			add_location(br1, file$3, 25, 3, 1038);
    			attr_dev(div1, "class", "description svelte-gnvvmc");
    			add_location(div1, file$3, 22, 2, 889);
    			if (!src_url_equal(img.src, img_src_value = /*image*/ ctx[0].url)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*imageName*/ ctx[5]);
    			set_style(img, "width", /*previewWidth*/ ctx[6] + "px");
    			set_style(img, "height", /*previewHeight*/ ctx[7] + "px");
    			attr_dev(img, "width", /*previewWidth*/ ctx[6]);
    			attr_dev(img, "height", /*previewHeight*/ ctx[7]);
    			attr_dev(img, "class", "svelte-gnvvmc");
    			add_location(img, file$3, 27, 2, 1056);
    			attr_dev(div2, "class", "preview svelte-gnvvmc");
    			add_location(div2, file$3, 21, 1, 865);
    			attr_dev(div3, "class", "label");
    			add_location(div3, file$3, 45, 3, 1452);
    			attr_dev(div4, "class", "value");
    			add_location(div4, file$3, 46, 3, 1497);
    			attr_dev(div5, "class", "row svelte-gnvvmc");
    			add_location(div5, file$3, 44, 2, 1431);
    			attr_dev(div6, "class", "label");
    			add_location(div6, file$3, 50, 3, 1604);
    			attr_dev(div7, "class", "value");
    			add_location(div7, file$3, 51, 3, 1659);
    			attr_dev(div8, "class", "row svelte-gnvvmc");
    			add_location(div8, file$3, 49, 2, 1583);
    			attr_dev(div9, "class", "meta");
    			add_location(div9, file$3, 36, 1, 1227);
    			attr_dev(div10, "class", "details svelte-gnvvmc");
    			add_location(div10, file$3, 16, 0, 726);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div10, anchor);
    			append_dev(div10, div0);
    			mount_component(jetpacklogo, div0, null);
    			append_dev(div10, t0);
    			append_dev(div10, div2);
    			append_dev(div2, div1);
    			append_dev(div1, b);
    			append_dev(b, t1);
    			append_dev(b, t2);
    			append_dev(div1, br0);
    			append_dev(div1, t3);
    			append_dev(div1, t4);
    			append_dev(div1, t5);
    			append_dev(div1, br1);
    			append_dev(div2, t6);
    			append_dev(div2, img);
    			append_dev(div10, t7);
    			append_dev(div10, div9);
    			if (if_block0) if_block0.m(div9, null);
    			append_dev(div9, t8);
    			append_dev(div9, div5);
    			append_dev(div5, div3);
    			append_dev(div5, t10);
    			append_dev(div5, div4);
    			append_dev(div4, t11);
    			append_dev(div4, t12);
    			append_dev(div4, t13);
    			append_dev(div9, t14);
    			append_dev(div9, div8);
    			append_dev(div8, div6);
    			append_dev(div8, t16);
    			append_dev(div8, div7);
    			append_dev(div7, t17);
    			append_dev(div7, t18);
    			append_dev(div7, t19);
    			append_dev(div9, t20);
    			if (if_block1) if_block1.m(div9, null);
    			append_dev(div10, t21);
    			if (if_block2) if_block2.m(div10, null);
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			if (!current || dirty & /*ratio*/ 16) set_data_dev(t1, /*ratio*/ ctx[4]);
    			if (!current || dirty & /*ratio*/ 16) set_data_dev(t4, /*ratio*/ ctx[4]);

    			if (!current || dirty & /*image*/ 1 && !src_url_equal(img.src, img_src_value = /*image*/ ctx[0].url)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (!current || dirty & /*imageName*/ 32) {
    				attr_dev(img, "alt", /*imageName*/ ctx[5]);
    			}

    			if (/*image*/ ctx[0].fileSize.weight > 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(div9, t8);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if ((!current || dirty & /*image*/ 1) && t11_value !== (t11_value = /*image*/ ctx[0].fileSize.width + "")) set_data_dev(t11, t11_value);
    			if ((!current || dirty & /*image*/ 1) && t13_value !== (t13_value = /*image*/ ctx[0].fileSize.height + "")) set_data_dev(t13, t13_value);
    			if ((!current || dirty & /*image*/ 1) && t17_value !== (t17_value = /*image*/ ctx[0].onScreen.width + "")) set_data_dev(t17, t17_value);
    			if ((!current || dirty & /*image*/ 1) && t19_value !== (t19_value = /*image*/ ctx[0].onScreen.height + "")) set_data_dev(t19, t19_value);

    			if (/*potentialSavings*/ ctx[3] > 0) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1$1(ctx);
    					if_block1.c();
    					if_block1.m(div9, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*imageOrigin*/ ctx[1] !== /*origin*/ ctx[2]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block$2(ctx);
    					if_block2.c();
    					if_block2.m(div10, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(jetpacklogo.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div10_transition) div10_transition = create_bidirectional_transition(div10, fly, { duration: 150, y: 4, easing: backOut }, true);
    				div10_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(jetpacklogo.$$.fragment, local);
    			if (!div10_transition) div10_transition = create_bidirectional_transition(div10, fly, { duration: 150, y: 4, easing: backOut }, false);
    			div10_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div10);
    			destroy_component(jetpacklogo);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (detaching && div10_transition) div10_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let imageName;
    	let ratio;
    	let potentialSavings;
    	let origin;
    	let imageOrigin;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ImageGuide', slots, []);
    	let { image } = $$props;
    	let { size } = $$props;
    	const previewWidth = size === 'normal' ? 100 : 50;
    	const previewHeight = Math.floor(previewWidth / (image.fileSize.width / image.fileSize.height));
    	const writable_props = ['image', 'size'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ImageGuide> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('image' in $$props) $$invalidate(0, image = $$props.image);
    		if ('size' in $$props) $$invalidate(8, size = $$props.size);
    	};

    	$$self.$capture_state = () => ({
    		fly,
    		backOut,
    		JetpackLogo,
    		image,
    		size,
    		previewWidth,
    		previewHeight,
    		imageOrigin,
    		origin,
    		potentialSavings,
    		ratio,
    		imageName
    	});

    	$$self.$inject_state = $$props => {
    		if ('image' in $$props) $$invalidate(0, image = $$props.image);
    		if ('size' in $$props) $$invalidate(8, size = $$props.size);
    		if ('imageOrigin' in $$props) $$invalidate(1, imageOrigin = $$props.imageOrigin);
    		if ('origin' in $$props) $$invalidate(2, origin = $$props.origin);
    		if ('potentialSavings' in $$props) $$invalidate(3, potentialSavings = $$props.potentialSavings);
    		if ('ratio' in $$props) $$invalidate(4, ratio = $$props.ratio);
    		if ('imageName' in $$props) $$invalidate(5, imageName = $$props.imageName);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*image*/ 1) {
    			// Reactive variables because this component can be reused by Svelte.
    			$$invalidate(5, imageName = image.url.split('/').pop());
    		}

    		if ($$self.$$.dirty & /*image*/ 1) {
    			$$invalidate(4, ratio = image.scaling.oversizedBy.toFixed(2));
    		}

    		if ($$self.$$.dirty & /*image*/ 1) {
    			$$invalidate(3, potentialSavings = Math.round(image.fileSize.weight - image.fileSize.weight / image.scaling.oversizedBy));
    		}

    		if ($$self.$$.dirty & /*image*/ 1) {
    			$$invalidate(1, imageOrigin = new URL(image.url).origin);
    		}
    	};

    	$$invalidate(2, origin = new URL(window.location.href).origin);

    	return [
    		image,
    		imageOrigin,
    		origin,
    		potentialSavings,
    		ratio,
    		imageName,
    		previewWidth,
    		previewHeight,
    		size
    	];
    }

    class ImageGuide extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { image: 0, size: 8 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ImageGuide",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*image*/ ctx[0] === undefined && !('image' in props)) {
    			console.warn("<ImageGuide> was created without expected prop 'image'");
    		}

    		if (/*size*/ ctx[8] === undefined && !('size' in props)) {
    			console.warn("<ImageGuide> was created without expected prop 'size'");
    		}
    	}

    	get image() {
    		throw new Error("<ImageGuide>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set image(value) {
    		throw new Error("<ImageGuide>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<ImageGuide>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<ImageGuide>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* app/features/guide/src/ui/Bubble.svelte generated by Svelte v3.49.0 */
    const file$2 = "app/features/guide/src/ui/Bubble.svelte";

    // (19:0) {#if mounted}
    function create_if_block$1(ctx) {
    	let div;
    	let span;
    	let t;
    	let div_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t = text(/*oversizedLabel*/ ctx[1]);
    			attr_dev(span, "class", "label svelte-tqi0sb");
    			add_location(span, file$2, 20, 2, 618);
    			attr_dev(div, "class", "bubble " + /*severity*/ ctx[2] + " svelte-tqi0sb");
    			add_location(div, file$2, 19, 1, 541);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "mouseenter", /*mouseenter_handler*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (!current || dirty & /*oversizedLabel*/ 2) set_data_dev(t, /*oversizedLabel*/ ctx[1]);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fly, /*scaleConfig*/ ctx[3], true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fly, /*scaleConfig*/ ctx[3], false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(19:0) {#if mounted}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*mounted*/ ctx[0] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*mounted*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*mounted*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let oversizedLabel;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Bubble', slots, []);
    	let { oversizedBy } = $$props;
    	let { index } = $$props;

    	const severity = oversizedBy > 4
    	? 'high'
    	: oversizedBy > 2 ? 'medium' : 'normal';

    	let mounted = false;
    	onMount(() => $$invalidate(0, mounted = true));

    	const scaleConfig = {
    		delay: 150 + 50 * index,
    		duration: 250,
    		y: 2,
    		easing: backOut
    	};

    	const writable_props = ['oversizedBy', 'index'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Bubble> was created with unknown prop '${key}'`);
    	});

    	function mouseenter_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ('oversizedBy' in $$props) $$invalidate(4, oversizedBy = $$props.oversizedBy);
    		if ('index' in $$props) $$invalidate(5, index = $$props.index);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		backOut,
    		fly,
    		oversizedBy,
    		index,
    		severity,
    		mounted,
    		scaleConfig,
    		oversizedLabel
    	});

    	$$self.$inject_state = $$props => {
    		if ('oversizedBy' in $$props) $$invalidate(4, oversizedBy = $$props.oversizedBy);
    		if ('index' in $$props) $$invalidate(5, index = $$props.index);
    		if ('mounted' in $$props) $$invalidate(0, mounted = $$props.mounted);
    		if ('oversizedLabel' in $$props) $$invalidate(1, oversizedLabel = $$props.oversizedLabel);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*oversizedBy*/ 16) {
    			$$invalidate(1, oversizedLabel = oversizedBy < 9
    			? oversizedBy.toFixed(1)
    			: `${Math.floor(oversizedBy)}+`);
    		}
    	};

    	return [
    		mounted,
    		oversizedLabel,
    		severity,
    		scaleConfig,
    		oversizedBy,
    		index,
    		mouseenter_handler
    	];
    }

    class Bubble extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { oversizedBy: 4, index: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Bubble",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*oversizedBy*/ ctx[4] === undefined && !('oversizedBy' in props)) {
    			console.warn("<Bubble> was created without expected prop 'oversizedBy'");
    		}

    		if (/*index*/ ctx[5] === undefined && !('index' in props)) {
    			console.warn("<Bubble> was created without expected prop 'index'");
    		}
    	}

    	get oversizedBy() {
    		throw new Error("<Bubble>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set oversizedBy(value) {
    		throw new Error("<Bubble>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get index() {
    		throw new Error("<Bubble>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<Bubble>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* app/features/guide/src/ui/Main.svelte generated by Svelte v3.49.0 */
    const file$1 = "app/features/guide/src/ui/Main.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[8] = i;
    	return child_ctx;
    }

    // (23:0) {#if $state === 'Active' || $state === 'Always On'}
    function create_if_block(ctx) {
    	let div1;
    	let div0;
    	let t;
    	let div1_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*images*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let if_block = /*show*/ ctx[2] !== false && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(div0, "class", "previews svelte-103m0hv");
    			add_location(div0, file$1, 24, 2, 758);
    			attr_dev(div1, "class", div1_class_value = "guide " + /*size*/ ctx[3] + " svelte-103m0hv");
    			toggle_class(div1, "show", /*show*/ ctx[2] !== false);
    			add_location(div1, file$1, 23, 1, 672);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(div1, t);
    			if (if_block) if_block.m(div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div1, "mouseleave", /*onMouseLeave*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*images, show*/ 5) {
    				each_value = /*images*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div0, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (/*show*/ ctx[2] !== false) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*show*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*size*/ 8 && div1_class_value !== (div1_class_value = "guide " + /*size*/ ctx[3] + " svelte-103m0hv")) {
    				attr_dev(div1, "class", div1_class_value);
    			}

    			if (dirty & /*size, show*/ 12) {
    				toggle_class(div1, "show", /*show*/ ctx[2] !== false);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(23:0) {#if $state === 'Active' || $state === 'Always On'}",
    		ctx
    	});

    	return block;
    }

    // (26:3) {#each images as image, index}
    function create_each_block(ctx) {
    	let bubble_1;
    	let current;

    	function mouseenter_handler() {
    		return /*mouseenter_handler*/ ctx[6](/*index*/ ctx[8]);
    	}

    	bubble_1 = new Bubble({
    			props: {
    				index: /*index*/ ctx[8],
    				oversizedBy: /*image*/ ctx[5].scaling.oversizedBy
    			},
    			$$inline: true
    		});

    	bubble_1.$on("mouseenter", mouseenter_handler);

    	const block = {
    		c: function create() {
    			create_component(bubble_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(bubble_1, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const bubble_1_changes = {};
    			if (dirty & /*images*/ 1) bubble_1_changes.oversizedBy = /*image*/ ctx[5].scaling.oversizedBy;
    			bubble_1.$set(bubble_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(bubble_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(bubble_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(bubble_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(26:3) {#each images as image, index}",
    		ctx
    	});

    	return block;
    }

    // (34:2) {#if show !== false}
    function create_if_block_1(ctx) {
    	let imageguide;
    	let current;

    	imageguide = new ImageGuide({
    			props: {
    				size: /*size*/ ctx[3],
    				image: /*show*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(imageguide.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(imageguide, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const imageguide_changes = {};
    			if (dirty & /*size*/ 8) imageguide_changes.size = /*size*/ ctx[3];
    			if (dirty & /*show*/ 4) imageguide_changes.image = /*show*/ ctx[2];
    			imageguide.$set(imageguide_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(imageguide.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(imageguide.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(imageguide, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(34:2) {#if show !== false}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = (/*$state*/ ctx[1] === 'Active' || /*$state*/ ctx[1] === 'Always On') && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$state*/ ctx[1] === 'Active' || /*$state*/ ctx[1] === 'Always On') {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$state*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $state;
    	validate_store(state, 'state');
    	component_subscribe($$self, state, $$value => $$invalidate(1, $state = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Main', slots, []);
    	let { images } = $$props;
    	let show = false;

    	function onMouseLeave() {
    		if ($state !== 'Always On') {
    			$$invalidate(2, show = false);
    		}
    	}

    	let size = 'normal';
    	let image = images[0];

    	// Looking at the first image in the set is fine, at least for now.
    	if (image.onScreen.width < 200 || image.onScreen.height < 200) {
    		size = 'micro';
    	} else if (image.onScreen.width < 400 || image.onScreen.height < 400) {
    		size = 'small';
    	}

    	const writable_props = ['images'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Main> was created with unknown prop '${key}'`);
    	});

    	const mouseenter_handler = index => $$invalidate(2, show = images[index]);

    	$$self.$$set = $$props => {
    		if ('images' in $$props) $$invalidate(0, images = $$props.images);
    	};

    	$$self.$capture_state = () => ({
    		state,
    		ImageGuide,
    		Bubble,
    		images,
    		show,
    		onMouseLeave,
    		size,
    		image,
    		$state
    	});

    	$$self.$inject_state = $$props => {
    		if ('images' in $$props) $$invalidate(0, images = $$props.images);
    		if ('show' in $$props) $$invalidate(2, show = $$props.show);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('image' in $$props) $$invalidate(5, image = $$props.image);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$state, images*/ 3) {
    			$$invalidate(2, show = $state === 'Always On' ? images[0] : false);
    		}
    	};

    	return [images, $state, show, size, onMouseLeave, image, mouseenter_handler];
    }

    class Main extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { images: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Main",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*images*/ ctx[0] === undefined && !('images' in props)) {
    			console.warn("<Main> was created without expected prop 'images'");
    		}
    	}

    	get images() {
    		throw new Error("<Main>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set images(value) {
    		throw new Error("<Main>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function closestStableParent(node, distance = 0) {
        if (!node.parentNode) {
            return null;
        }
        if (!(node.parentNode instanceof Element)) {
            return null;
        }
        // Stop searching at body.
        if (node.parentNode.tagName === 'BODY') {
            node.parentNode;
        }
        if (node.parentNode.classList.contains('jetpack-boost-guide')) {
            return node.parentNode;
        }
        const position = getComputedStyle(node.parentNode).position;
        if (position === 'static' || position === 'relative') {
            return node.parentNode;
        }
        return closestStableParent(node.parentNode, ++distance);
    }
    /**
     * Possible paths forward:
     *
     * If an image has absolute position, place the previews next to the image
     * If the image is a static image, wrap it in a div and place the previews next to the image
     * If the image is a background image, inside the element that has a background image
     *
     */
    let wrapperID = 0;
    function findContainer(image) {
        const node = image.node;
        if (image.type === 'background' &&
            !['absolute', 'fixed'].includes(getComputedStyle(node).position)) {
            return node;
        }
        if (!node.parentNode || !node.parentElement) {
            return;
        }
        const parent = closestStableParent(node);
        if (parent?.classList.contains('jetpack-boost-guide')) {
            return parent;
        }
        if (parent) {
            const parentStyle = getComputedStyle(parent);
            // If this is a relative parent, see if any boost guide-elements are in here already
            if (parentStyle.position === 'relative') {
                const existing = Array.from(parent.children).find(child => child.classList.contains('jetpack-boost-guide'));
                if (existing) {
                    return existing;
                }
            }
            const wrapper = document.createElement('div');
            wrapper.classList.add('jetpack-boost-guide');
            wrapper.dataset.jetpackBoostGuideId = (++wrapperID).toString();
            if (parentStyle.position === 'static') {
                wrapper.classList.add('relative');
                Array.from(parent.children)
                    .reverse()
                    .forEach(child => wrapper.appendChild(child));
            }
            parent.prepend(wrapper);
            return wrapper;
        }
        // @TODO: Fix HTML Types
        return node.parentNode;
    }
    /**
     * This gets a little tricky because of the various layout positions
     * the images can be in.
     *
     * For example, images can be positioned with static, absolute, fixed, etc.
     * But on top of that, they can be a part of a parent that has that positioning.
     * And to make things even more complex, they can change dynamically, for example in a slider.
     *
     * This function attempts to attach the Svelte Components to the DOM in a non-destructive way.
     */
    function attachGuides(images) {
        const componentConfiguration = images.reduce((acc, image) => {
            if ((image.fileSize.weight < 10 && image.fileSize.weight >= 0) ||
                (image.fileSize.width < 250 && image.fileSize.height < 100)) {
                console.info(`Skipping ${image.url} because it's too small`);
                return acc;
            }
            if (!image.node.parentNode) {
                console.error(`Image has no parent`, image.node);
                return acc;
            }
            const container = findContainer(image);
            if (!container) {
                console.error(`Could not find a parent for image`, image);
                return acc;
            }
            // Don't create new entry for Svelte component configuration.
            // Use the index in the array as a unique identifier.
            let id = parseInt(container?.dataset?.jetpackBoostGuideId);
            const images = acc[id]?.props.images || [];
            images.push(image);
            // If there's only one image, assume a new Svelte component needs to be created.
            if (images.length === 1) {
                acc[id] = {
                    target: container,
                    props: {
                        images,
                    },
                };
            }
            return acc;
        }, {});
        // Take the component configuration and create the Svelte components.
        return Object.values(componentConfiguration).map(data => {
            const instance = new Main(data);
            return instance;
        });
    }

    async function load(domElements) {
        const parsedNodes = domElements.map(async (el) => {
            // Handle <img> tags first.
            if (el.tagName === 'IMG') {
                return getImg(el);
            }
            // Check for background images
            // in all other elements.
            return getBackgroundImage(el);
        }, []);
        return (await Promise.all(parsedNodes)).filter(Boolean);
    }
    async function getImageSize(url) {
        const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
        console.log('Loading using fetch', response);
        if (!response.url) {
            console.log(`Can't get image size for ${url} likely due to a CORS error.`);
            return -1;
        }
        const size = response.headers.get('content-length');
        if (size) {
            return parseInt(size, 10) / 1024;
        }
        return -1;
    }
    async function getImageDimensions(url) {
        const img = new Image();
        img.src = url;
        return new Promise(resolve => {
            img.onload = () => {
                resolve({ width: Math.round(img.width), height: Math.round(img.height) });
            };
        });
    }
    async function measurementsFromURL(url) {
        const [weight, { width, height }] = await Promise.all([
            getImageSize(url),
            getImageDimensions(url),
        ]);
        return {
            width,
            height,
            weight,
        };
    }
    async function getBackgroundImage(el) {
        const style = getComputedStyle(el);
        const url = backgroundImageSrc(style.backgroundImage);
        if (!url) {
            return false;
        }
        const { width, height, weight } = await measurementsFromURL(url);
        return {
            type: 'background',
            url,
            fileSize: {
                width,
                height,
                weight,
            },
            node: el,
        };
    }
    function backgroundImageSrc(backgroundValue) {
        if (!imageLikeURL(backgroundValue)) {
            return false;
        }
        const url = backgroundValue.match(/url\(.?(.*?).?\)/i);
        if (url && url[1]) {
            return url[1];
        }
        return false;
    }
    /**
     * This function ensures that the value passed in looks like a URL.
     * This is because `background: url(...)` and `src="..."` can
     * contain various values that are not URLs, like:
     * - none
     * - linear-gradient(...)
     * - data:image/png;base64,...
     * - ...
     *
     * For the purposes of analyzing image sizes,
     * we also don't consider SVGs to be images.
     */
    function imageLikeURL(value) {
        // Look for relative URLs that are not SVGs
        // Intentionally not using an allow-list because images may
        // be served from weird URLs like /images/1234?size=large
        if (value.startsWith('/')) {
            return value.endsWith('.svg');
        }
        try {
            const url = new URL(value);
            return url.protocol === 'http:' || url.protocol === 'https:';
        }
        catch (e) {
            return false;
        }
    }
    async function getImg(el) {
        // Get the currently used image source in srcset if it's available.
        const url = el.currentSrc && imageLikeURL(el.currentSrc) ? el.currentSrc : el.src;
        const type = el.srcset ? 'srcset' : 'img';
        if (!url || !imageLikeURL(url)) {
            return false;
        }
        const { width, height, weight } = await measurementsFromURL(url);
        return {
            type,
            url,
            fileSize: {
                width,
                height,
                weight,
            },
            node: el,
        };
    }

    function measure(images) {
        return images.map(image => {
            const { width, height } = image.node.getBoundingClientRect();
            return {
                ...image,
                onScreen: {
                    width: Math.round(width),
                    height: Math.round(height),
                },
                scaling: {
                    width: image.fileSize.width / width,
                    height: image.fileSize.height / height,
                    oversizedBy: (image.fileSize.width * image.fileSize.height) / (width * height),
                },
            };
        });
    }

    /* app/features/guide/src/ui/AdminBarToggle.svelte generated by Svelte v3.49.0 */
    const file = "app/features/guide/src/ui/AdminBarToggle.svelte";

    function create_fragment(ctx) {
    	let a;
    	let jetpacklogo;
    	let t0;
    	let span;
    	let t1;
    	let t2;
    	let current;
    	let mounted;
    	let dispose;
    	jetpacklogo = new JetpackLogo({ $$inline: true });

    	const block = {
    		c: function create() {
    			a = element("a");
    			create_component(jetpacklogo.$$.fragment);
    			t0 = space();
    			span = element("span");
    			t1 = text("Image Guide: ");
    			t2 = text(/*$state*/ ctx[1]);
    			add_location(span, file, 16, 1, 315);
    			attr_dev(a, "id", "jetpack-boost-bar");
    			attr_dev(a, "href", /*href*/ ctx[0]);
    			attr_dev(a, "class", "ab-item svelte-11tcv97");
    			toggle_class(a, "paused", /*$state*/ ctx[1] === 'Paused');
    			add_location(a, file, 8, 0, 171);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			mount_component(jetpacklogo, a, null);
    			append_dev(a, t0);
    			append_dev(a, span);
    			append_dev(span, t1);
    			append_dev(span, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(a, "click", prevent_default(/*toggleUI*/ ctx[2]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*$state*/ 2) set_data_dev(t2, /*$state*/ ctx[1]);

    			if (!current || dirty & /*href*/ 1) {
    				attr_dev(a, "href", /*href*/ ctx[0]);
    			}

    			if (dirty & /*$state*/ 2) {
    				toggle_class(a, "paused", /*$state*/ ctx[1] === 'Paused');
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(jetpacklogo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(jetpacklogo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			destroy_component(jetpacklogo);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $state;
    	validate_store(state, 'state');
    	component_subscribe($$self, state, $$value => $$invalidate(1, $state = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AdminBarToggle', slots, []);
    	let { href } = $$props;

    	function toggleUI() {
    		state.cycle();
    	}

    	const writable_props = ['href'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AdminBarToggle> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('href' in $$props) $$invalidate(0, href = $$props.href);
    	};

    	$$self.$capture_state = () => ({
    		JetpackLogo,
    		state,
    		href,
    		toggleUI,
    		$state
    	});

    	$$self.$inject_state = $$props => {
    		if ('href' in $$props) $$invalidate(0, href = $$props.href);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [href, $state, toggleUI];
    }

    class AdminBarToggle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { href: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AdminBarToggle",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*href*/ ctx[0] === undefined && !('href' in props)) {
    			console.warn("<AdminBarToggle> was created without expected prop 'href'");
    		}
    	}

    	get href() {
    		throw new Error("<AdminBarToggle>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<AdminBarToggle>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /**
     * Initialize the admin bar toggle.
     */
    document.addEventListener('DOMContentLoaded', () => {
        const adminBarToggle = document.getElementById('wp-admin-bar-jetpack-boost-image-guide');
        const link = adminBarToggle?.querySelector('a');
        if (adminBarToggle && link) {
            const href = link.getAttribute('href');
            link.remove();
            new AdminBarToggle({
                target: adminBarToggle,
                props: {
                    href,
                },
            });
        }
    });
    /**
     * Initialize the guides when window is loaded.
     */
    window.addEventListener('load', async () => {
        const nodes = document.querySelectorAll('body *');
        const images = await load(Array.from(nodes));
        const measuredImages = measure(images);
        attachGuides(measuredImages);
    });
    /**
     * Watch for new images.
     */
    // createImageObserver( async ( nodes: Element[] ) => {
    // 	const images = await load( nodes );
    // 	const measuredImages = measure( images );
    // 	attachGuides( measuredImages );
    // } );

}());
//# sourceMappingURL=guide.js.map
