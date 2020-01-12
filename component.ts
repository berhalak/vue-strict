import VueRouter, { Route } from "vue-router";

/** Decorates field as vue prop */
export function prop(target: Object, propertyKey: string | symbol) {
	let s = <any>target;
	s.props = s.props || [];
	s.props.push(propertyKey);
}

/** Defines computed property, deprected all getters and setters are computed */
export function computed(target: Object, propertyKey: string | symbol) {
	let s = <any>target;
	s.computed = s.computed || [];
	s.computed.push({ target, propertyKey });
}

/** Declares method as watch handler with options: deep, imidiate */
export function watch(...name: string[]) {
	return function (target: Object, propertyKey: string | symbol) {
		let s = <any>target;
		s.watches = s.watches || [];
		s.watches.push({ target, propertyKey, name });
	}
}

export function provides(target: Object, propertyKey: string | symbol) {
	let s = <any>target;
	s._providers = s._providers || [];
	s._providers.push(propertyKey);
}

export function inject(target: Object, propertyKey: string | symbol) {
	let s = <any>target;
	s._injections = s._providers || [];
	s._injections.push(propertyKey);
}

export type Constructor<T> = {
	new(...args: any[]): T;
}

export interface IComponentBase {
	$emit: (name: string, payload?: any) => void;
	$set: (obj: any, propKey: string, value: any) => void;
	$route: Route;
	$router: VueRouter;
	$data: any;
	$value: any;
	$nextTick: ((clb: () => void) => void | Promise<any>);
	$refs: any;
}

/** Base class for vue components in typescript */
export class ComponentBase {
	protected $emit!: (name: string, payload?: any) => void;
	protected $set!: (obj: any, propKey: string, value: any) => void;
	protected $route!: Route;
	protected $router!: VueRouter;
	protected $data: any;
	protected $value: any;
	protected $nextTick!: ((clb: () => void) => void | Promise<any>);
	protected $refs: any;
	protected created() {

	}

	public data() {
		return {

		}
	}

	protected beforeCreate() {

	}

	protected beforeUpdate() {

	}

	protected beforeDestroy() {

	}

	protected updated() {

	}

	protected beforeMount() {

	}

	protected mounted() {

	}
}

/** Internal function for changing class based declarations to proper vue component */
export function bootstrap(klass: Constructor<ComponentBase>) {

	const properties: PropertyDescriptorMap = {};

	let chain = klass.prototype;

	while (chain.constructor.name != 'Object') {
		const descriptors = Object.getOwnPropertyDescriptors(chain);
		for (const name in descriptors) {
			if (!properties[name]) {
				properties[name] = descriptors[name];
			}
		}
		chain = Object.getPrototypeOf(chain);
	}

	let proper: any = {};

	if (klass.prototype.beforeBootstrap) {
		klass.prototype.beforeBootstrap(proper);
	}


	let anyKlass = klass as any;
	let propsNames: any = [];
	if (klass.prototype.props && klass.prototype.props.length) {
		// create class for default values
		let defData: any = new klass();
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
		let props = Object.assign({}, this.$props);
		let data: any = new klass();
		Object.assign(data, props);
		let result = data.data ? data.data() : {};
		Object.assign(data, result);
		if (data.init && typeof data.init == 'function') {
			data.init();
		}

		data = Object.assign({}, data);

		for (let p of propsNames) {
			delete data[p];
		}

		return data;
	};

	let proto = klass.prototype;
	proper.components = anyKlass.prototype.constructor.components;

	let methods: any = {};
	let excluded = ['constructor', 'created', 'mounted', 'beforeCreate', 'updated', 'beforeUpdate', 'data', 'afterBootstrap', 'beforeBootstrap'];
	if (klass.prototype.watches) {
		excluded = excluded.concat(klass.prototype.watches.map((x: any) => x.propertyKey));
	}

	for (let m in properties) {
		const desc = properties[m];
		if (desc !== undefined && desc.get !== undefined) {
			proper.computed = proper.computed || {};
			proper.computed[m] = {
				get() {
					if (desc !== undefined && desc.get !== undefined)
						return desc.get.call(this);
				},
				set(value: any) {
					if (desc !== undefined && desc.set !== undefined) {
						desc.set.call(this, value);
					} else {
						throw 'Property ' + m + ' on ' + klass.name + ' doesnt allow setting, make sure that it is property, not a method';
					}
				}
			}

		} else if (typeof (klass.prototype[m]) == 'function') {
			if (!excluded.includes(m)) {
				methods[m] = klass.prototype[m];
			}
		}
	}

	proper.methods = methods;
	if (klass.prototype.created) {
		proper.created = klass.prototype.created;
	}

	if (klass.prototype.watches) {
		proper.watch = proper.watch || {};
		let toWatchList = proto.watches.multi((x: any) => x.name);
		for (let toWatch of toWatchList) {
			let handler = {
				handler: function (n: any, o: any) {
					let handlers = proto.watches.filter((x: any) => x.name.includes(toWatch)).map((x: any) => x.propertyKey);
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
	proper.beforeDestroy = klass.prototype.beforeDestroy;


	if (klass.prototype.provide) {
		proper.provide = klass.prototype.provide;
	} else {
		const providers = klass.prototype._providers;
		if (providers && providers.length) {
			proper.provide = function () {
				const result: any = {};
				for (let key of providers) {
					result[key] = this[key];
				}
				return result;
			}
		}
	}


	const injectors = klass.prototype._injectors;

	if (injectors && injectors.length) {
		proper.inject = injectors;
	}

	if (klass.prototype.render) {
		proper.render = klass.prototype.render;
	}

	if (klass.prototype.constructor.bootstrap) {
		klass.prototype.constructor.bootstrap(proper, klass);
	}

	if (klass.prototype.afterBootstrap) {
		klass.prototype.afterBootstrap(proper);
	}

	return proper;
}