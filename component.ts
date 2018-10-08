import Vue from "vue";
import VueRouter, { Route } from "vue-router";


export function prop(target: Object, propertyKey: string | symbol) {
	let s = <any>target;
	s.props = s.props || [];
	s.props.push(propertyKey);
}

export function computed(target: Object, propertyKey: string | symbol) {
	let s = <any>target;
	s.computed = s.computed || [];
	s.computed.push({ target, propertyKey });
}

export function watch(...name: string[]) {
	return function (target: Object, propertyKey: string | symbol) {
		let s = <any>target;
		s.watches = s.watches || [];
		s.watches.push({ target, propertyKey, name });
	}
}

export type Constructor<T> = {
	new(...args: any[]): T;
}

export class Component {

	protected $emit!: (name: string, payload?: any) => void;
	protected $set!: (obj: any, propKey: string, value: any) => void;
	protected $route!: Route;
	protected $router!: VueRouter;
	protected $data: any;
	protected $value: any;
	protected $nextTick!: ((clb: () => void) => void | Promise<any>);
	protected $refs: any;

	protected on!: (name: string, handler: any) => void;
	protected emit!: (name: string, payload: any) => void;

	protected track() {

	}


	protected created() {

	}

	protected beforeCreate() {

	}

	protected beforeUpdate() {

	}

	protected updated() {

	}

	protected mounted() {

	}

	protected getParams() {
		let self = <Vue><any>this;
		return self.$route.params;
	}
}

export class ValueComponent<T> extends Component {

	@prop
	public value!: T;

	protected track() {

	}

	protected commit(value: T) {
		this.$value = value;
	}

	@watch("value")
	protected populate() {

	}
}


function getPropertyDesc(proto : any, name : string) {
	while (proto) {
		let desc = Object.getOwnPropertyDescriptor(proto, name);
		if (desc) return desc;
		proto = Object.getPrototypeOf(proto);
	}
}

export function bootstrap(klass: Constructor<Component>) {
	let name = klass.prototype.name;
	let proper: any = {};
	let anyKlass = klass as any;
	let propsNames : any = [];
	if (klass.prototype.props && klass.prototype.props.length) {
		// create class for default values
		let defData : any = new klass();
		proper.props = {};
		for (let p of klass.prototype.props) {
			propsNames.push(p);
			if (p in defData) {
				proper.props[p] = {
					default: defData[p],
					type: null
				}
			} else {
				proper.props[p] = null;
			}
		}
	}
	proper.data = function () {
		let context = Object.assign({}, this.$props);
		let props = Object.assign({}, this.$props);

		for (let name of propsNames) {
			Object.defineProperty(context, name, {
				get() {
					return props[name];
				},
				set(v) {
					return true;
				}
			})
		}
		let data = klass.call(context);
		data = Object.assign({}, data);
		for (let p of propsNames) {
			delete data[p];
		}
		return data;
	};

	let proto = klass.prototype;
	proper.components = anyKlass.prototype.constructor.components;

	let methods : any = {};
	let excluded = ['constructor', 'created', 'mounted', 'beforeCreate', 'updated', 'beforeUpdate'];
	if (klass.prototype.watches) {
		excluded = excluded.concat(klass.prototype.watches.map((x : any) => x.propertyKey));
	}

	for (let m in klass.prototype) {
		let protoStart = proto;
		let desc = getPropertyDesc(proto, m);
		if (desc && desc.get)
			continue;

		if (typeof (klass.prototype[m]) == 'function') {
			if (!excluded.includes(m)) {
				methods[m] = klass.prototype[m];
			}
		}
	}

	proper.methods = methods;
	proper.created = function () {
		let injections = klass.prototype.injections;
		if (injections) {
			for (let i of injections) {
				this[i] = klass.prototype[i];
			}
		}
		try {
			if (klass.prototype.created) {
				klass.prototype.created.call(this);				
			}
		}
		catch (e) {
			debugger;
			throw e;
		}
	}

	if (klass.prototype.computed) {
		proper.computed = proper.computed || {};
		for (let c of klass.prototype.computed) {
			let desc : any = Object.getOwnPropertyDescriptor(c.target, c.propertyKey);
			proper.computed[c.propertyKey] = {
				get() {

					return desc.get.call(this);
				},
				set(value : any) {

					if (!desc.set) {
						throw 'Property ' + c.propertyKey + ' on ' + name + ' doesnt allow setting, make sure that it is property, not a method';
					}
					desc.set.call(this, value);
				}
			}
		}
	}

	if (klass.prototype.watches) {
		proper.watch = proper.watch || {};
		let toWatchList = proto.watches.multi((x : any) => x.name);
		for (let toWatch of toWatchList) {
			let handler = {
				handler: function (n : any, o: any) {
					let handlers = proto.watches.filter((x : any) => x.name.includes(toWatch)).map((x : any) => x.propertyKey);
					for (let index = 0; index < handlers.length; index++) {
						const handler = handlers[index];						
						klass.prototype[handler].call(this, n, o, toWatch);						
					}
				},
				deep: true,
				immediate: true
			};
			proper.watch[toWatch] = handler;
		}
	}

	proper.beforeCreate = klass.prototype.beforeCreate;
	proper.mounted = klass.prototype.mounted;	
	proper.updated = klass.prototype.updated;
	proper.beforeUpdate = klass.prototype.beforeUpdate;
	proper.beforeMount = klass.prototype.beforeMount;
	return proper;
}